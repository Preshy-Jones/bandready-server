import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgAdminRole } from '@prisma/client';
import { ORG_PERMISSIONS_KEY } from '../decorators/org-permissions.decorator';

/**
 * Full RBAC permission matrix for organization admin roles.
 */
const ROLE_PERMISSIONS: Record<OrgAdminRole, string[]> = {
  OWNER: ['*'], // wildcard — all permissions
  ADMIN: [
    'VIEW_DASHBOARD',
    'INVITE_ADMINS',
    'ADD_STUDENTS',
    'REMOVE_STUDENTS',
    'CREATE_COHORTS',
    'ASSIGN_PRACTICE',
    'VIEW_ALL_STUDENTS',
    'GENERATE_REPORTS',
    'DOWNLOAD_REPORTS',
    'ORG_SETTINGS',
    'CUSTOM_BRANDING',
  ],
  MANAGER: [
    'VIEW_DASHBOARD',
    'ADD_STUDENTS',
    'REMOVE_STUDENTS',
    'CREATE_COHORTS',
    'ASSIGN_PRACTICE',
    'VIEW_ALL_STUDENTS',
    'GENERATE_REPORTS',
    'DOWNLOAD_REPORTS',
  ],
  TUTOR: [
    'VIEW_DASHBOARD',
    'ASSIGN_PRACTICE_OWN',
    'VIEW_ASSIGNED_STUDENTS',
    'GENERATE_REPORTS_OWN',
    'DOWNLOAD_REPORTS',
  ],
};

/**
 * Guard that checks the org admin's role against the required permissions
 * set via the @OrgPermissions() decorator.
 *
 * Must be applied AFTER OrgAdminGuard so that `req.orgAdmin` exists.
 */
@Injectable()
export class OrgPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      ORG_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions specified, allow by default (guarded by OrgAdminGuard)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const orgAdmin = request.orgAdmin;

    if (!orgAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const rolePermissions = ROLE_PERMISSIONS[orgAdmin.role as OrgAdminRole];

    if (!rolePermissions) {
      throw new ForbiddenException('Invalid role');
    }

    // Wildcard = all permissions
    if (rolePermissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((p) =>
      rolePermissions.includes(p),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
