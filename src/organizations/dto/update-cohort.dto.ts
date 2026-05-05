import { IsOptional, IsBoolean, IsString, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class UpdateCohortDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsDateString() targetExamDate?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(9) targetBandScore?: number;
  @IsOptional() @IsString() assignedTutorId?: string;
  @IsOptional() @IsNumber() @Min(1) maxStudents?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
