import {
  IsString,
  IsArray,
  ValidateNested,
  IsEmail,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkStudentInput {
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
  @IsNumber()
  @Min(1)
  @Max(9)
  targetBandScore?: number;

  @IsOptional()
  @IsDateString()
  targetExamDate?: string;
}

export class BulkAddStudentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStudentInput)
  students: BulkStudentInput[];

  @IsOptional()
  @IsString()
  cohortId?: string;

  @IsOptional()
  @IsBoolean()
  sendInvites?: boolean;
}
