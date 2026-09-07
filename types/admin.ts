import { AdminRole } from './database';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: AdminRole;
  permissions: string[];
}

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'posts' | 'comments' | 'reports' | 'verification' | 'admins' | 'settings' | 'audit';
}

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export interface AdminStaffItem {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: string;
  last_active: string;
  created_at: string;
}
