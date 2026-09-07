import { AdminRole } from '@/types/database';
import { ROLE_HIERARCHY } from '@/types/admin';

export const PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_SUSPEND: 'users.suspend',
  USERS_BAN: 'users.ban',
  USERS_RESTORE: 'users.restore',

  // Posts & Decision Rooms
  POSTS_VIEW: 'posts.view',
  POSTS_HIDE: 'posts.hide',
  POSTS_DELETE: 'posts.delete',
  POSTS_RESTORE: 'posts.restore',

  // Comments & Opinions
  COMMENTS_VIEW: 'comments.view',
  COMMENTS_HIDE: 'comments.hide',
  COMMENTS_DELETE: 'comments.delete',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_ASSIGN: 'reports.assign',
  REPORTS_RESOLVE: 'reports.resolve',

  // Verification
  VERIFICATION_VIEW: 'verification.view',
  VERIFICATION_APPROVE: 'verification.approve',
  VERIFICATION_REJECT: 'verification.reject',

  // Admins
  ADMINS_VIEW: 'admins.view',
  ADMINS_MANAGE: 'admins.manage',

  // Audit Logs & Analytics
  AUDIT_LOGS_VIEW: 'audit_logs.view',
  ANALYTICS_VIEW: 'analytics.view',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<AdminRole, PermissionKey[]> = {
  USER: [],
  MODERATOR: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.POSTS_VIEW,
    PERMISSIONS.POSTS_HIDE,
    PERMISSIONS.COMMENTS_VIEW,
    PERMISSIONS.COMMENTS_HIDE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_ASSIGN,
    PERMISSIONS.REPORTS_RESOLVE,
    PERMISSIONS.VERIFICATION_VIEW,
    PERMISSIONS.VERIFICATION_APPROVE,
    PERMISSIONS.VERIFICATION_REJECT,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  ADMIN: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.USERS_BAN,
    PERMISSIONS.USERS_RESTORE,
    PERMISSIONS.POSTS_VIEW,
    PERMISSIONS.POSTS_HIDE,
    PERMISSIONS.POSTS_DELETE,
    PERMISSIONS.POSTS_RESTORE,
    PERMISSIONS.COMMENTS_VIEW,
    PERMISSIONS.COMMENTS_HIDE,
    PERMISSIONS.COMMENTS_DELETE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_ASSIGN,
    PERMISSIONS.REPORTS_RESOLVE,
    PERMISSIONS.VERIFICATION_VIEW,
    PERMISSIONS.VERIFICATION_APPROVE,
    PERMISSIONS.VERIFICATION_REJECT,
    PERMISSIONS.ADMINS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
  ],
  SUPER_ADMIN: Object.values(PERMISSIONS),
};

export function hasPermission(role: AdminRole, permission: PermissionKey): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

export function isStaffRole(role: AdminRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MODERATOR;
}

export function isAdminOrHigher(role: AdminRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

export function isSuperAdmin(role: AdminRole): boolean {
  return role === 'SUPER_ADMIN';
}
