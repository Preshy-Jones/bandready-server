import { IsDefined, IsOptional, IsString } from 'class-validator';

export class SubmitReadingAnswerDto {
  @IsString()
  questionId!: string;

  @IsDefined()
  answer!: unknown;

  @IsOptional()
  timeSpentSeconds?: number;
}
