import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AssignmentPracticeType } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAssignment(orgId: string, dto: {
    title: string;
    description?: string;
    dueDate: string;
    practiceType?: AssignmentPracticeType;
    minSessions?: number;
    cohortId?: string;
    studentIds?: string[];
  }, assignedBy: string) {
    const targetUserIds = new Set<string>();

    if (dto.studentIds && dto.studentIds.length > 0) {
      dto.studentIds.forEach((id) => targetUserIds.add(id));
    }

    if (dto.cohortId) {
      const cohortStudents = await this.prisma.cohortStudent.findMany({
        where: { cohortId: dto.cohortId, status: 'COHORT_ACTIVE' },
        select: { userId: true },
      });
      cohortStudents.forEach((cs) => targetUserIds.add(cs.userId));
    }

    if (targetUserIds.size === 0) {
      throw new NotFoundException('No valid students found for this assignment');
    }

    const assignment = await this.prisma.practiceAssignment.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        dueDate: new Date(dto.dueDate),
        organizationId: orgId,
        assignedById: assignedBy,
        cohortId: dto.cohortId || null,
        practiceType: dto.practiceType || AssignmentPracticeType.SPEAKING,
        minSessions: dto.minSessions || 1,
        completions: {
          create: Array.from(targetUserIds).map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        _count: { select: { completions: true } }
      }
    });

    return assignment;
  }

  async getAssignments(orgId: string, pagination: { page?: number; limit?: number }) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.practiceAssignment.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          cohort: { select: { name: true } },
          _count: { select: { completions: true } },
          completions: {
            where: { completedAt: { not: null } },
            select: { id: true },
          },
        },
      }),
      this.prisma.practiceAssignment.count({ where: { organizationId: orgId } }),
    ]);

    return {
      assignments: items.map((i: any) => ({
        ...i,
        totalAssigned: i._count.completions,
        totalCompleted: i.completions.length,
        _count: undefined,
        completions: undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAssignmentDetail(orgId: string, assignmentId: string) {
    const assignment = await this.prisma.practiceAssignment.findFirst({
      where: { id: assignmentId, organizationId: orgId },
      include: {
        cohort: { select: { name: true } },
        completions: {
          include: {
            user: { select: { fullName: true, email: true, avatarUrl: true } },
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }
}
