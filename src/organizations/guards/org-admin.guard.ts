import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Guard that validates the requesting user is an active admin of the
 * organization specified in the route parameter `orgId`.
 *
 * Attaches `req.orgAdmin` and `req.organization` on success.
 * Must be applied AFTER JwtAuthGuard so that `req.user` exists.
 */
@Injectable()
export class OrgAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.orgId;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!orgId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const orgAdmin = await this.prisma.organizationAdmin.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.id,
        },
      },
      include: { organization: true },
    });

    if (!orgAdmin || !orgAdmin.isActive) {
      throw new ForbiddenException(
        'You are not an admin of this organization',
      );
    }

    if (!orgAdmin.organization.isActive) {
      throw new ForbiddenException('This organization has been deactivated');
    }

    // Attach to request for downstream use
    request.orgAdmin = orgAdmin;
    request.organization = orgAdmin.organization;

    return true;
  }
}
