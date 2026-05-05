import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export class CreateCohortDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  targetExamDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  targetBandScore?: number;

  @IsOptional()
  @IsString()
  assignedTutorId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStudents?: number;
}
