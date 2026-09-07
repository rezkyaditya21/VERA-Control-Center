import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/session';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local-admin';
    const rateCheck = checkRateLimit(`mod-progress:${ip}`, 45, 60);

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
    const { progressId, action, reason } = body;

    if (!progressId || !action) {
      return NextResponse.json({ success: false, error: 'Missing progressId or action' }, { status: 400 });
    }

    if (!hasPermission(admin.role, PERMISSIONS.PROGRESS_MODERATE)) {
      return NextResponse.json({ 
        success: false, 
        error: `Forbidden: Admin role '${admin.role}' lacks permission ${PERMISSIONS.PROGRESS_MODERATE}` 
      }, { status: 403 });
    }

    let auditAction = 'PROGRESS_HIDDEN';
    let updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'hide') {
      auditAction = 'PROGRESS_HIDDEN';
      updateFields.deleted_at = new Date().toISOString();
    } else if (action === 'restore') {
      auditAction = 'PROGRESS_RESTORED';
      updateFields.deleted_at = null;
    } else if (action === 'archive') {
      auditAction = 'PROGRESS_ARCHIVED';
      updateFields.status = 'archived';
    } else {
      return NextResponse.json({ success: false, error: `Unsupported progress action: ${action}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Update progress in PostgreSQL
    const { error: progressError } = await supabase
      .from('progresses')
      .update(updateFields)
      .eq('id', progressId);

    if (progressError) {
      console.warn('[Moderation Progress API] Database update warning:', progressError.message);
    }

    // 2. Audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_type: 'progress',
      target_id: progressId,
      metadata: {
        action,
        reason: reason || 'Progress moderated by administrator',
        admin_role: admin.role,
        fields: updateFields,
      },
    }).select();

    return NextResponse.json({
      success: true,
      message: `Progress ${progressId} successfully processed (${action})`,
      data: {
        progressId,
        action,
        auditAction,
      },
    });
  } catch (error: any) {
    console.error('[Moderation Progress API] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to process progress' }, { status: 500 });
  }
}
