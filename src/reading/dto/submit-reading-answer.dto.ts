import { IsDefined, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitReadingAnswerDto {
  @IsString()
  questionId!: string;

  @IsDefined()
  answer!: unknown;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSeconds?: number;
}
