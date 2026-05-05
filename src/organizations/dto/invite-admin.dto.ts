import { IsString, IsEmail, IsEnum } from 'class-validator';
import { OrgAdminRole } from '@prisma/client';

export class InviteAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsEnum(OrgAdminRole)
  role: OrgAdminRole;
}
