import { SetMetadata } from '@nestjs/common';

export const ORG_PERMISSIONS_KEY = 'orgPermissions';

/**
 * Decorator to set required permissions on a route handler.
 * Used with OrgPermissionGuard.
 * 
 * Usage: @OrgPermissions('ADD_STUDENTS', 'REMOVE_STUDENTS')
 */
export const OrgPermissions = (...permissions: string[]) =>
  SetMetadata(ORG_PERMISSIONS_KEY, permissions);
