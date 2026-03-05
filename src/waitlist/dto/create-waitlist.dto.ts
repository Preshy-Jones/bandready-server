import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWaitlistDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
