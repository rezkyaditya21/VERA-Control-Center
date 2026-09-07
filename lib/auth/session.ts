import { headers } from 'next/headers';
import { CURRENT_ADMIN } from '@/lib/mockData';
import { AdminUser } from '@/types/admin';
import { AdminRole } from '@/types/database';

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const headersList = await headers();
    const testRole = headersList.get('x-test-role') as AdminRole | null;
    if (testRole) {
      if (testRole === 'USER') {
        return null; // Regular user has no admin session
      }
      return {
        ...CURRENT_ADMIN,
        id: `usr-${testRole.toLowerCase()}-01`,
        role: testRole,
      };
    }
  } catch {
    // Non-request context fallback
  }

  return CURRENT_ADMIN;
}

export async function requireAdminSession(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error('UNAUTHORIZED');
  }
  return admin;
}
