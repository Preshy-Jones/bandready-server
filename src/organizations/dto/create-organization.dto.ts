import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OrgType, OrgSubscriptionTier, BillingCycle } from '@prisma/client';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsEnum(OrgType)
  type: OrgType;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsEnum(OrgSubscriptionTier)
  subscriptionTier: OrgSubscriptionTier;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  // First org owner
  @IsEmail()
  ownerEmail: string;

  @IsString()
  ownerName: string;

  @IsString()
  ownerPassword: string;
}
