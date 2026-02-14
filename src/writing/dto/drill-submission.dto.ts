import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class SubmitDrillDto {
  @IsString()
  userAnswer: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  timeSpentSeconds?: number;
}

export interface DrillFeedbackResponse {
  isCorrect: boolean;
  feedback: string;
  relatedConcept: string;
  additionalExamples: string[];
  correctAnswer?: string;
}
