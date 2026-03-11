import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReadingService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return {
      module: 'reading',
      status: 'scaffolded',
      message: 'Reading module scaffolding is in place. Session, content, and scoring APIs are not implemented yet.',
    };
  }

  async getPassageCatalog(filters: unknown) {
    const normalized = this.normalizeCatalogFilters(filters);

    try {
      const whereClauses = [Prisma.sql`"is_active" = true`];

      if (normalized.testType) {
        whereClauses.push(Prisma.sql`"test_type" = ${normalized.testType}::"ReadingTestType"`);
      }

      if (normalized.difficulty) {
        whereClauses.push(
          Prisma.sql`"difficulty_level" = ${normalized.difficulty}::"ReadingDifficulty"`,
        );
      }

      if (normalized.topic) {
        whereClauses.push(
          Prisma.sql`LOWER("topic_category") LIKE ${`%${normalized.topic.toLowerCase()}%`}`,
        );
      }

      const whereSql = Prisma.join(whereClauses, ' AND ');

      const passages = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "title",
          "word_count" AS "wordCount",
          "difficulty_level" AS "difficultyLevel",
          "test_type" AS "testType",
          "topic_category" AS "topicCategory",
          "source_attribution" AS "sourceAttribution",
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
        FROM "reading_passages"
        WHERE ${whereSql}
        ORDER BY "created_at" DESC
        LIMIT ${normalized.limit}
        OFFSET ${normalized.offset}
      `);

      const totalRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "reading_passages"
        WHERE ${whereSql}
      `);

      return {
        status: 'ready',
        filters: normalized,
        passages,
        total: Number(totalRows[0]?.count || 0),
      };
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_passages', error, {
        filters: normalized,
        passages: [],
        total: 0,
      });
    }
  }

  async getPassage(id: string) {
    try {
      const passages = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "title",
          "content",
          "word_count" AS "wordCount",
          "difficulty_level" AS "difficultyLevel",
          "test_type" AS "testType",
          "topic_category" AS "topicCategory",
          "source_attribution" AS "sourceAttribution",
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
        FROM "reading_passages"
        WHERE "id" = ${id} AND "is_active" = true
        LIMIT 1
      `);

      const passage = passages[0];

      if (!passage) {
        return {
          status: 'not_found',
          id,
          message: 'Reading passage not found.',
        };
      }

      const paragraphs = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "paragraph_index" AS "paragraphIndex",
          "label",
          "content"
        FROM "passage_paragraphs"
        WHERE "passage_id" = ${id}
        ORDER BY "paragraph_index" ASC
      `);

      const questionSets = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "question_type" AS "questionType",
          "instructions",
          "question_range_start" AS "questionRangeStart",
          "question_range_end" AS "questionRangeEnd",
          "set_data" AS "setData",
          "created_at" AS "createdAt"
        FROM "reading_question_sets"
        WHERE "passage_id" = ${id}
        ORDER BY "question_range_start" ASC
      `);

      const questions = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "question_set_id" AS "questionSetId",
          "question_type" AS "questionType",
          "question_number" AS "questionNumber",
          "question_data" AS "questionData",
          "explanation",
          "skill_tested" AS "skillTested",
          "created_at" AS "createdAt"
        FROM "reading_questions"
        WHERE "passage_id" = ${id}
        ORDER BY "question_number" ASC
      `);

      return {
        status: 'ready',
        passage,
        paragraphs,
        questionSets: questionSets.map((set) => ({
          ...set,
          questions: questions.filter((question) => question.questionSetId === set.id),
        })),
        ungroupedQuestions: questions.filter((question) => !question.questionSetId),
      };
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_passage', error, { id });
    }
  }

  startSession(payload: unknown) {
    return {
      status: 'not_implemented',
      resource: 'reading_session',
      payload,
      message: 'Reading session creation is not implemented yet.',
    };
  }

  submitAnswer(sessionId: string, payload: unknown) {
    return {
      status: 'not_implemented',
      resource: 'reading_answer',
      sessionId,
      payload,
      message: 'Reading answer submission is not implemented yet.',
    };
  }

  completeSession(sessionId: string) {
    return {
      status: 'not_implemented',
      resource: 'reading_completion',
      sessionId,
      message: 'Reading session completion is not implemented yet.',
    };
  }

  getResults(sessionId: string) {
    return {
      status: 'not_implemented',
      resource: 'reading_results',
      sessionId,
      message: 'Reading session results are not implemented yet.',
    };
  }

  getProgress() {
    return {
      status: 'not_implemented',
      resource: 'reading_progress',
      overallStats: null,
      questionTypeProgress: [],
      recentSessions: [],
      weakAreas: [],
      recommendations: [],
      message: 'Reading progress analytics are not implemented yet.',
    };
  }

  getQuestionTypeProgress() {
    return {
      status: 'not_implemented',
      resource: 'reading_question_type_progress',
      types: [],
      message: 'Reading question-type analytics are not implemented yet.',
    };
  }

  private normalizeCatalogFilters(filters: unknown) {
    const input = (filters ?? {}) as Record<string, unknown>;

    const testType = this.normalizeEnumValue(input.testType, [
      'ACADEMIC',
      'GENERAL_TRAINING',
    ]);
    const difficulty = this.normalizeEnumValue(input.difficulty, ['EASY', 'MEDIUM', 'HARD']);
    const topic = typeof input.topic === 'string' ? input.topic.trim() : undefined;
    const limit = this.normalizePositiveInteger(input.limit, 20, 100);
    const offset = this.normalizePositiveInteger(input.offset, 0);

    return {
      testType,
      difficulty,
      topic: topic || undefined,
      limit,
      offset,
    };
  }

  private normalizeEnumValue(value: unknown, allowed: string[]) {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toUpperCase();
    return allowed.includes(normalized) ? normalized : undefined;
  }

  private normalizePositiveInteger(value: unknown, fallback: number, max?: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    const rounded = Math.floor(parsed);
    if (max !== undefined) {
      return Math.min(rounded, max);
    }

    return rounded;
  }

  private handleReadingStorageUnavailable(
    resource: string,
    error: unknown,
    extra: Record<string, unknown> = {},
  ) {
    const message = error instanceof Error ? error.message : 'Unknown storage error';

    return {
      status: 'not_ready',
      resource,
      ...extra,
      message:
        'Reading storage is not available yet. Ensure the reading migration has been applied before using this endpoint.',
      error: message,
    };
  }
}
