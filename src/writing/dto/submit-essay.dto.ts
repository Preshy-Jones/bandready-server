import { IsString, IsInt, IsEnum, IsOptional, MinLength, Min } from 'class-validator';
import { TaskType, SessionType } from '@prisma/client';

export class SubmitEssayDto {
  @IsString()
  questionId: string;

  @IsString()
  @MinLength(50, { message: 'Essay must be at least 50 characters long' })
  essayText: string;

  @IsInt()
  @Min(0)
  timeSpentSeconds: number;

  @IsEnum(SessionType)
  @IsOptional()
  sessionType?: SessionType;
}

export class GetQuestionsDto {
  @IsEnum(TaskType)
  taskType: TaskType;

  @IsString()
  @IsOptional()
  subType?: string;
}

export class SubmitDiagnosticDto {
  @IsString()
  task1QuestionId: string;

  @IsString()
  task2QuestionId: string;

  @IsString()
  @MinLength(100)
  task1Essay: string;

  @IsString()
  @MinLength(200)
  task2Essay: string;

  @IsInt()
  @Min(0)
  task1TimeSpent: number;

  @IsInt()
  @Min(0)
  task2TimeSpent: number;
}
