import { IsOptional, IsBoolean } from 'class-validator';

export class CompleteReadingSessionDto {
  @IsOptional()
  @IsBoolean()
  forceComplete?: boolean;
}
