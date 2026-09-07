import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/session';
import { hasPermission, PERMISSIONS, PermissionKey } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local-admin';
    const rateCheck = checkRateLimit(`mod-user:${ip}`, 45, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again shortly.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '45',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin session required' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action, reason, durationHours } = body;

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'Missing userId or action' }, { status: 400 });
    }

    let requiredPermission: PermissionKey = PERMISSIONS.USERS_SUSPEND;
    let newStatus = 'suspended';
    let auditAction = 'USER_SUSPENDED';

    if (action === 'ban') {
      requiredPermission = PERMISSIONS.USERS_BAN;
      newStatus = 'banned';
      auditAction = 'USER_BANNED';
    } else if (action === 'restore') {
      requiredPermission = PERMISSIONS.USERS_RESTORE;
      newStatus = 'active';
      auditAction = 'USER_RESTORED';
    }

    // Role and permission check
    if (!hasPermission(admin.role, requiredPermission)) {
      return NextResponse.json({ 
        success: false, 
        error: `Forbidden: Admin role '${admin.role}' is not authorized to perform '${action}' on users.` 
      }, { status: 403 });
    }

    const supabase = createAdminClient();

    let suspendedUntil: string | null = null;
    if (newStatus === 'suspended') {
      const hours = durationHours || 24;
      suspendedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    }

    // 1. Update user profile in PostgreSQL
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'suspended') {
      updatePayload.suspended_until = suspendedUntil;
      updatePayload.ban_reason = reason || 'Suspended by moderator';
    } else if (newStatus === 'banned') {
      updatePayload.suspended_until = null;
      updatePayload.ban_reason = reason || 'Permanently banned for platform violation';
    } else if (newStatus === 'active') {
      updatePayload.suspended_until = null;
      updatePayload.ban_reason = null;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (profileError) {
      console.warn('[Moderation User API] Database update warning:', profileError.message);
    }

    // 2. Insert audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_type: 'user',
      target_id: userId,
      metadata: {
        reason: reason || `User account set to ${newStatus}`,
        duration_hours: durationHours || null,
        new_status: newStatus,
        performed_by_role: admin.role,
      },
    }).select();

    return NextResponse.json({
      success: true,
      message: `User ${userId} status updated to ${newStatus}`,
      data: {
        userId,
        status: newStatus,
        action: auditAction,
        suspendedUntil,
      },
    });
  } catch (error: any) {
    console.error('[Moderation User API] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to complete this action.' }, { status: 500 });
  }
}
