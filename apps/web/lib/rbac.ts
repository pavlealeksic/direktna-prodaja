import { AuthContext } from './clerk';

export function requireRole(ctx: AuthContext, allowed: Array<AuthContext['role']>) {
  if (!allowed.includes(ctx.role)) {
    throw new Error('Forbidden');
  }
}

export const Roles = {
  OwnerOrManager: ['owner', 'manager'] as const,
  SalesOrAbove: ['owner', 'manager', 'sales'] as const,
};

