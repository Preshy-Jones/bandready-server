import { IsString, IsEmail, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class AddStudentDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  cohortId?: string;

  @IsOptional()
  @IsNumber()
  targetBandScore?: number;

  @IsOptional()
  @IsDateString()
  targetExamDate?: string;

  @IsOptional()
  @IsBoolean()
  sendInvite?: boolean;
}
