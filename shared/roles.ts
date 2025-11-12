export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'technician',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS_AR = {
  [ROLES.ADMIN]: 'مدير النظام',
  [ROLES.SUPERVISOR]: 'مشرف',
  [ROLES.TECHNICIAN]: 'فني',
} as const;

export const ROLE_ORDER = {
  [ROLES.ADMIN]: 3,
  [ROLES.SUPERVISOR]: 2,
  [ROLES.TECHNICIAN]: 1,
} as const;

export function hasRoleOrAbove(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_ORDER[userRole as UserRole] || 0;
  const requiredLevel = ROLE_ORDER[requiredRole as UserRole] || 0;
  return userLevel >= requiredLevel;
}

export function canManageUsers(userRole: string): boolean {
  return userRole === ROLES.ADMIN;
}

export function canViewReports(userRole: string): boolean {
  return hasRoleOrAbove(userRole, ROLES.SUPERVISOR);
}

export function canManageWarehouses(userRole: string): boolean {
  return hasRoleOrAbove(userRole, ROLES.SUPERVISOR);
}

export function isSupervisor(userRole: string): boolean {
  return userRole === ROLES.SUPERVISOR;
}

export function isAdmin(userRole: string): boolean {
  return userRole === ROLES.ADMIN;
}

export function isTechnician(userRole: string): boolean {
  return userRole === ROLES.TECHNICIAN;
}
