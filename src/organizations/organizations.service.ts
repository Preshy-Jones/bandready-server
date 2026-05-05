import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { BulkAddStudentsDto } from './dto/bulk-add-students.dto';
import { CohortStudentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Organization CRUD ────────────────────────────────────────

  async createOrganization(dto: CreateOrganizationDto) {
    // Validate slug uniqueness
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Organization slug already taken');
    }

    // Create org + owner user + admin record in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the organization
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          type: dto.type,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          country: dto.country || 'Nigeria',
          subscriptionTier: dto.subscriptionTier,
          billingCycle: dto.billingCycle,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        },
      });

      // 2. Find or create the owner user
      let ownerUser = await tx.user.findUnique({
        where: { email: dto.ownerEmail },
      });

      if (!ownerUser) {
        const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);
        ownerUser = await tx.user.create({
          data: {
            email: dto.ownerEmail,
            fullName: dto.ownerName,
            passwordHash,
            isEmailVerified: true,
            organizationId: org.id,
          },
        });
      } else {
        // Link existing user to org
        await tx.user.update({
          where: { id: ownerUser.id },
          data: { organizationId: org.id },
        });
      }

      // 3. Create the OrganizationAdmin record (OWNER role)
      await tx.organizationAdmin.create({
        data: {
          organizationId: org.id,
          userId: ownerUser.id,
          role: 'OWNER',
          acceptedAt: new Date(),
        },
      });

      // 4. Log activity
      await tx.organizationActivityLog.create({
        data: {
          organizationId: org.id,
          actorId: ownerUser.id,
          actorType: 'ACTIVITY_ADMIN',
          action: 'ORGANIZATION_CREATED',
          entityType: 'Organization',
          entityId: org.id,
          details: { name: org.name, tier: org.subscriptionTier },
        },
      });

      return org;
    });
  }

  async getOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            students: true,
            admins: true,
            cohorts: true,
          },
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateOrganization(orgId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
    });
  }

  // ─── Organization Stats ───────────────────────────────────────

  async getOrganizationStats(orgId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      activeStudents,
      speakingSessionsThisMonth,
      essaysThisMonth,
    ] = await Promise.all([
      // Total students in org
      this.prisma.user.count({
        where: { organizationId: orgId },
      }),

      // Students active in last 7 days
      this.prisma.user.count({
        where: {
          organizationId: orgId,
          OR: [
            { practiceSessions: { some: { createdAt: { gte: sevenDaysAgo } } } },
            { essaySubmissions: { some: { submittedAt: { gte: sevenDaysAgo } } } },
          ],
        },
      }),

      // Speaking sessions this month
      this.prisma.practiceSession.count({
        where: {
          user: { organizationId: orgId },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Writing sessions this month
      this.prisma.essaySubmission.count({
        where: {
          user: { organizationId: orgId },
          submittedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Get average band score across all students
    const speakingAvg = await this.prisma.userProgress.aggregate({
      _avg: { avgOverallScore: true },
      where: { user: { organizationId: orgId } },
    });

    const writingAvg = await this.prisma.writingProgress.aggregate({
      _avg: { avgOverallScore: true },
      where: { user: { organizationId: orgId } },
    });

    const avgSpeaking = Number(speakingAvg._avg.avgOverallScore) || 0;
    const avgWriting = Number(writingAvg._avg.avgOverallScore) || 0;
    const averageBandScore = avgSpeaking && avgWriting
      ? Number(((avgSpeaking + avgWriting) / 2).toFixed(1))
      : avgSpeaking || avgWriting || 0;

    // Get needs-attention students
    const needsAttention = await this.getNeedsAttentionStudents(orgId);

    return {
      totalStudents,
      activeStudents,
      totalSessions: speakingSessionsThisMonth + essaysThisMonth,
      averageBandScore,
      needsAttention,
    };
  }

  // ─── Needs Attention ──────────────────────────────────────────

  private async getNeedsAttentionStudents(orgId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const alerts: Array<{
      userId: string;
      fullName: string;
      email: string;
      reason: string;
      details: string;
    }> = [];

    // 1. Inactive students (no sessions in 7+ days)
    const orgStudents = await this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        fullName: true,
        email: true,
        targetBandScore: true,
        targetExamDate: true,
        progress: { select: { lastPracticeDate: true, totalSessions: true, avgOverallScore: true } },
        writingProgress: { select: { totalEssays: true, avgOverallScore: true } },
      },
    });

    for (const student of orgStudents) {
      const lastPractice = student.progress?.lastPracticeDate;
      const totalSessions = (student.progress?.totalSessions || 0) + (student.writingProgress?.totalEssays || 0);

      // Inactive check
      if (!lastPractice || lastPractice < sevenDaysAgo) {
        if (totalSessions > 0) {
          alerts.push({
            userId: student.id,
            fullName: student.fullName || student.email,
            email: student.email,
            reason: 'inactive_7_days',
            details: `No practice in ${lastPractice ? Math.ceil((Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)) : '?'} days`,
          });
        }
      }

      // Approaching exam check
      if (
        student.targetExamDate &&
        student.targetExamDate <= fourteenDaysFromNow &&
        student.targetExamDate > new Date() &&
        totalSessions < 10
      ) {
        const daysLeft = Math.ceil(
          (student.targetExamDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          userId: student.id,
          fullName: student.fullName || student.email,
          email: student.email,
          reason: 'exam_approaching',
          details: `Exam in ${daysLeft} days, only ${totalSessions} sessions completed`,
        });
      }
    }

    return alerts.slice(0, 10); // Limit to 10 alerts
  }

  // ─── Admin Management ─────────────────────────────────────────

  async inviteAdmin(orgId: string, dto: InviteAdminDto, invitedById: string) {
    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      const tempPassword = randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          isEmailVerified: true,
        },
      });
    }

    // Check if already an admin of this org
    const existingAdmin = await this.prisma.organizationAdmin.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.id,
        },
      },
    });

    if (existingAdmin) {
      throw new ConflictException('User is already an admin of this organization');
    }

    return this.prisma.organizationAdmin.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: dto.role,
        invitedById: invitedById,
      },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
  }

  async getAdmins(orgId: string) {
    return this.prisma.organizationAdmin.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { invitedAt: 'asc' },
    });
  }

  // ─── Student Management ───────────────────────────────────────

  async getStudents(
    orgId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      cohortId?: string;
      status?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.cohortId) {
      where.cohortMemberships = {
        some: { cohortId: params.cohortId, status: 'COHORT_ACTIVE' },
      };
    }

    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          targetBandScore: true,
          targetExamDate: true,
          enrolledAt: true,
          studentId: true,
          createdAt: true,
          progress: {
            select: {
              avgOverallScore: true,
              totalSessions: true,
              lastPracticeDate: true,
              currentStreakDays: true,
            },
          },
          writingProgress: {
            select: {
              avgOverallScore: true,
              totalEssays: true,
            },
          },
          cohortMemberships: {
            where: { status: 'COHORT_ACTIVE' },
            include: {
              cohort: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: {
              practiceSessions: true,
              essaySubmissions: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addStudent(orgId: string, dto: AddStudentDto) {
    // Check seat limit
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const currentCount = await this.prisma.user.count({
      where: { organizationId: orgId },
    });

    if (currentCount >= org.maxStudents) {
      throw new BadRequestException(
        `Student seat limit reached (${org.maxStudents}). Upgrade your plan to add more students.`,
      );
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      if (user.organizationId && user.organizationId !== orgId) {
        throw new ConflictException('This student is already linked to another organization');
      }
      if (user.organizationId === orgId) {
        throw new ConflictException('This student is already in your organization');
      }
      // Link existing user to org
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          organizationId: orgId,
          studentId: dto.studentId,
          enrolledAt: new Date(),
          targetBandScore: dto.targetBandScore || user.targetBandScore,
          targetExamDate: dto.targetExamDate ? new Date(dto.targetExamDate) : user.targetExamDate,
        },
      });
    } else {
      // Create new user with temp password
      const tempPassword = randomBytes(4).toString('hex'); // 8 chars
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: `${dto.firstName} ${dto.lastName}`,
          passwordHash,
          isEmailVerified: true,
          organizationId: orgId,
          studentId: dto.studentId,
          enrolledAt: new Date(),
          targetBandScore: dto.targetBandScore || 7.0,
          targetExamDate: dto.targetExamDate ? new Date(dto.targetExamDate) : undefined,
        },
      });
    }

    // Add to cohort if specified
    if (dto.cohortId) {
      await this.prisma.cohortStudent.create({
        data: {
          cohortId: dto.cohortId,
          userId: user.id,
        },
      }).catch(() => {
        // Ignore if already in cohort
      });
    }

    // Log activity
    await this.prisma.organizationActivityLog.create({
      data: {
        organizationId: orgId,
        actorType: 'ACTIVITY_ADMIN',
        action: 'STUDENT_ADDED',
        entityType: 'User',
        entityId: user.id,
        details: { email: user.email, fullName: user.fullName },
      },
    });

    return user;
  }

  async removeStudent(orgId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });

    if (!user) {
      throw new NotFoundException('Student not found in this organization');
    }

    // Remove from org (unlink, don't delete the user)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: null,
        studentId: null,
        enrolledAt: null,
        assignedTutorId: null,
      },
    });

    // Remove from all cohorts
    await this.prisma.cohortStudent.deleteMany({
      where: {
        userId,
        cohort: { organizationId: orgId },
      },
    });

    // Log
    await this.prisma.organizationActivityLog.create({
      data: {
        organizationId: orgId,
        actorType: 'ACTIVITY_ADMIN',
        action: 'STUDENT_REMOVED',
        entityType: 'User',
        entityId: userId,
        details: { email: user.email, fullName: user.fullName },
      },
    });
  }

  async getStudentDetail(orgId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
      include: {
        progress: true,
        writingProgress: true,
        writingWeaknesses: {
          orderBy: { severity: 'desc' },
          take: 5,
        },
        practiceSessions: {
          where: { overallBandScore: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            part: true,
            overallBandScore: true,
            fluencyCoherenceScore: true,
            lexicalResourceScore: true,
            grammarAccuracyScore: true,
            pronunciationScore: true,
            createdAt: true,
            question: { select: { topic: true, questionText: true } },
          },
        },
        essaySubmissions: {
          where: { overallBandScore: { not: null } },
          orderBy: { submittedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            overallBandScore: true,
            taskResponseScore: true,
            coherenceCohesionScore: true,
            lexicalResourceScore: true,
            grammarAccuracyScore: true,
            submittedAt: true,
            question: { select: { taskType: true, prompt: true } },
          },
        },
        cohortMemberships: {
          where: { status: 'COHORT_ACTIVE' },
          include: { cohort: { select: { id: true, name: true, targetBandScore: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Student not found in this organization');
    }

    // Compute AI insights from weakness data
    const aiInsights: string[] = [];
    if (user.writingWeaknesses) {
      for (const w of user.writingWeaknesses) {
        if (w.severity === 'HIGH') {
          aiInsights.push(`⚠️ ${w.displayName} — identified as a high-priority weakness`);
        }
      }
    }

    // Compute progress trend
    const currentSpeaking = Number(user.progress?.avgOverallScore) || 0;
    const currentWriting = Number(user.writingProgress?.avgOverallScore) || 0;
    const currentEstimate = currentSpeaking && currentWriting
      ? Number(((currentSpeaking + currentWriting) / 2).toFixed(1))
      : currentSpeaking || currentWriting || 0;

    const targetScore = Number(user.targetBandScore) || 7.0;

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        targetBandScore: user.targetBandScore,
        targetExamDate: user.targetExamDate,
        enrolledAt: user.enrolledAt,
        studentId: user.studentId,
      },
      currentEstimate,
      targetScore,
      gap: Number((targetScore - currentEstimate).toFixed(1)),
      speakingProgress: {
        avgScore: currentSpeaking,
        totalSessions: user.progress?.totalSessions || 0,
        recentSessions: user.practiceSessions,
      },
      writingProgress: {
        avgScore: currentWriting,
        totalEssays: user.writingProgress?.totalEssays || 0,
        recentSubmissions: user.essaySubmissions,
      },
      cohorts: user.cohortMemberships.map((cm) => cm.cohort),
      aiInsights,
      practiceStreak: user.progress?.currentStreakDays || 0,
    };
  }

  // ─── Cohort Management ────────────────────────────────────────

  async getCohorts(orgId: string, params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [cohorts, total] = await Promise.all([
      this.prisma.cohort.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { students: { where: { status: CohortStudentStatus.COHORT_ACTIVE } } },
          },
          assignedTutor: {
            select: { user: { select: { fullName: true, email: true } } },
          },
        },
      }),
      this.prisma.cohort.count({ where }),
    ]);

    return {
      cohorts: cohorts.map((c: any) => ({
        ...c,
        studentCount: c._count.students,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createCohort(orgId: string, dto: CreateCohortDto) {
    return this.prisma.cohort.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        targetExamDate: dto.targetExamDate ? new Date(dto.targetExamDate) : null,
        targetBandScore: dto.targetBandScore,
        assignedTutorId: dto.assignedTutorId,
        maxStudents: dto.maxStudents,
      },
      include: {
        assignedTutor: { select: { user: { select: { fullName: true, email: true } } } },
      },
    });
  }

  async getCohortDetail(orgId: string, cohortId: string) {
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, organizationId: orgId },
      include: {
        assignedTutor: { select: { user: { select: { fullName: true, email: true, avatarUrl: true } } } },
        students: {
          where: { status: CohortStudentStatus.COHORT_ACTIVE },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                targetBandScore: true,
                progress: { select: { avgOverallScore: true, totalSessions: true, lastPracticeDate: true } },
                writingProgress: { select: { avgOverallScore: true, totalEssays: true } },
              },
            },
          },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }

    return cohort;
  }

  async updateCohort(orgId: string, cohortId: string, dto: UpdateCohortDto) {
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, organizationId: orgId },
    });

    if (!cohort) throw new NotFoundException('Cohort not found');

    return this.prisma.cohort.update({
      where: { id: cohortId },
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
        targetExamDate: dto.targetExamDate !== undefined ? (dto.targetExamDate ? new Date(dto.targetExamDate) : null) : undefined,
        targetBandScore: dto.targetBandScore,
        assignedTutorId: dto.assignedTutorId,
        maxStudents: dto.maxStudents,
        isActive: dto.isActive,
      },
    });
  }

  async getCohortProgress(orgId: string, cohortId: string) {
    const detail = await this.getCohortDetail(orgId, cohortId);

    let totalScore = 0;
    let scoreCount = 0;
    let onTrackCount = 0;
    let atRiskCount = 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let sessionsThisWeek = 0;

    const targetScore = Number(detail.targetBandScore) || 7.0;

    const students = detail.students.map((cs) => {
      const u = cs.user;
      const speaking = Number(u.progress?.avgOverallScore) || 0;
      const writing = Number(u.writingProgress?.avgOverallScore) || 0;
      const currentAvg = speaking && writing ? (speaking + writing) / 2 : speaking || writing || 0;

      if (currentAvg > 0) {
        totalScore += currentAvg;
        scoreCount++;

        // On track if within 0.5 of target score
        if (currentAvg >= targetScore - 0.5) {
          onTrackCount++;
        }
        
        // At risk if > 1.0 below target
        if (currentAvg <= targetScore - 1.0) {
          atRiskCount++;
        }
      }

      // Check inactive
      const lastPractice = u.progress?.lastPracticeDate;
      const isInactive = !lastPractice || lastPractice < sevenDaysAgo;
      if (isInactive) atRiskCount++; // Also flag inactive as at risk

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        targetBandScore: u.targetBandScore,
        currentEstimate: currentAvg,
        totalSessions: (u.progress?.totalSessions || 0) + (u.writingProgress?.totalEssays || 0),
        lastPracticeDate: lastPractice,
        isOnTrack: currentAvg >= targetScore - 0.5,
        isAtRisk: currentAvg <= targetScore - 1.0 || isInactive,
      };
    });

    return {
      totalStudents: students.length,
      averageScore: scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(1)) : 0,
      targetScore,
      onTrackCount,
      atRiskCount,
      sessionsThisWeek, // needs proper aggregation
      scoreDistribution: [], // mock for now
      studentList: students,
    };
  }

  async addStudentsToCohort(orgId: string, cohortId: string, userIds: string[]) {
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, organizationId: orgId },
      include: { _count: { select: { students: { where: { status: CohortStudentStatus.COHORT_ACTIVE } } } } }
    });

    if (!cohort) throw new NotFoundException('Cohort not found');

    if (cohort.maxStudents && (cohort as any)._count.students + userIds.length > cohort.maxStudents) {
      throw new BadRequestException('Adding these students would exceed the cohort capacity');
    }

    // Verify all students belong to the organization
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, organizationId: orgId },
      select: { id: true },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more students are not in your organization');
    }

    const data = users.map((u) => ({
      cohortId,
      userId: u.id,
      status: CohortStudentStatus.COHORT_ACTIVE,
    }));

    await this.prisma.cohortStudent.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async removeStudentFromCohort(orgId: string, cohortId: string, userId: string) {
    // Just delete the relation
    await this.prisma.cohortStudent.deleteMany({
      where: {
        cohortId,
        userId,
        cohort: { organizationId: orgId },
      },
    });
  }

  // ─── Bulk Student Upload ──────────────────────────────────────

  async bulkAddStudents(orgId: string, dto: BulkAddStudentsDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    
    if (!org) throw new NotFoundException('Organization not found');

    const currentCount = await this.prisma.user.count({
      where: { organizationId: orgId },
    });

    if (currentCount + dto.students.length > org.maxStudents) {
      throw new BadRequestException(
        `Bulk operation would exceed seat limit (${org.maxStudents}). You have ${currentCount} students currently.`,
      );
    }

    const result = {
      created: 0,
      skipped: 0,
      errors: [] as { email: string; reason: string }[],
    };

    const cohortId = dto.cohortId;

    for (const student of dto.students) {
      try {
        let user = await this.prisma.user.findUnique({
          where: { email: student.email },
        });

        if (user) {
          if (user.organizationId && user.organizationId !== orgId) {
             result.errors.push({ email: student.email, reason: 'Already linked to another organization' });
             continue;
          }
          if (user.organizationId === orgId) {
             result.skipped++;
          } else {
             user = await this.prisma.user.update({
               where: { id: user.id },
               data: {
                 organizationId: orgId,
                 studentId: student.studentId,
                 enrolledAt: new Date(),
                 targetBandScore: student.targetBandScore || user.targetBandScore,
                 targetExamDate: student.targetExamDate ? new Date(student.targetExamDate) : user.targetExamDate,
               },
             });
             result.created++;
          }
        } else {
          const tempPassword = randomBytes(4).toString('hex');
          const passwordHash = await bcrypt.hash(tempPassword, 10);
          user = await this.prisma.user.create({
            data: {
              email: student.email,
              fullName: `${student.firstName} ${student.lastName}`.trim(),
              passwordHash,
              isEmailVerified: true,
              organizationId: orgId,
              studentId: student.studentId,
              enrolledAt: new Date(),
              targetBandScore: student.targetBandScore || 7.0,
              targetExamDate: student.targetExamDate ? new Date(student.targetExamDate) : undefined,
            },
          });
          result.created++;

          // Send invite if requested
          if (dto.sendInvites) {
            // Future: call mail service
          }
        }

        if (cohortId && user) {
          await this.prisma.cohortStudent.create({
            data: {
              cohortId,
              userId: user.id,
            },
          }).catch(() => { /* Ignore if already in cohort */ });
        }
      } catch (err: any) {
        result.errors.push({ email: student.email, reason: err.message });
      }
    }

    // Log Activity
    await this.prisma.organizationActivityLog.create({
      data: {
        organizationId: orgId,
        actorType: 'ACTIVITY_ADMIN',
        action: 'BULK_STUDENT_ADDED',
        details: { created: result.created, skipped: result.skipped, errors: result.errors.length },
      },
    });

    return result;
  }

  // ─── Student Progress API ─────────────────────────────────────

  async getStudentProgress(orgId: string, userId: string) {
    const detail = await this.getStudentDetail(orgId, userId);
    
    // Convert to extended format
    return {
      user: detail.user,
      currentEstimate: detail.currentEstimate,
      targetScore: detail.targetScore,
      gap: detail.gap,
      weeklyProgress: [], // Placeholder for chart data
      skillBreakdown: {
        speaking: {
          score: detail.speakingProgress.avgScore,
          sessions: detail.speakingProgress.totalSessions,
          trend: 'stable',
        },
        writing: {
          score: detail.writingProgress.avgScore,
          essays: detail.writingProgress.totalEssays,
          trend: 'stable',
        },
        reading: { score: 0, tests: 0, trend: 'stable' },
        listening: { score: 0, tests: 0, trend: 'stable' },
      },
      totalSessions: detail.speakingProgress.totalSessions + detail.writingProgress.totalEssays,
      practiceStreak: detail.practiceStreak,
      recentSessions: [
        ...detail.speakingProgress.recentSessions.map((s: any) => ({
          id: s.id,
          type: 'speaking',
          score: s.overallBandScore,
          date: s.createdAt,
          details: `Part ${s.part} • ${s.question?.topic || 'Practice'}`,
        })),
        ...detail.writingProgress.recentSubmissions.map((s: any) => ({
          id: s.id,
          type: 'writing',
          score: s.overallBandScore,
          date: s.submittedAt,
          details: `${s.question?.taskType || 'Essay'}`,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      aiInsights: detail.aiInsights,
      recommendations: [], // Placeholder
    };
  }

  // ─── Org Admin Profile ────────────────────────────────────────

  async getOrgAdminProfile(userId: string) {
    const orgAdmin = await this.prisma.organizationAdmin.findFirst({
      where: { userId, isActive: true },
      include: {
        organization: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!orgAdmin) {
      return null;
    }

    return {
      user: orgAdmin.user,
      orgAdmin: {
        id: orgAdmin.id,
        role: orgAdmin.role,
        permissions: orgAdmin.permissions,
      },
      organization: orgAdmin.organization,
    };
  }
}
