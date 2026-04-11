import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReadingSessionModeDto {
  FULL_TEST = 'FULL_TEST',
  SINGLE_PASSAGE = 'SINGLE_PASSAGE',
  QUESTION_TYPE_PRACTICE = 'QUESTION_TYPE_PRACTICE',
  REVIEW = 'REVIEW',
}

export enum ReadingTestTypeDto {
  ACADEMIC = 'ACADEMIC',
  GENERAL_TRAINING = 'GENERAL_TRAINING',
}

export class StartReadingSessionDto {
  @IsEnum(ReadingSessionModeDto)
  mode!: ReadingSessionModeDto;

  @IsEnum(ReadingTestTypeDto)
  testType!: ReadingTestTypeDto;

  @IsOptional()
  @IsString()
  passageId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionTypes?: string[];

  @IsBoolean()
  isTimed!: boolean;
}
