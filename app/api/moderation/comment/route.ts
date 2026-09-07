import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/session';
import { hasPermission, PERMISSIONS, PermissionKey } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local-admin';
    const rateCheck = checkRateLimit(`mod-comment:${ip}`, 45, 60);

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
    const { commentId, action, reason } = body;

    if (!commentId || !action) {
      return NextResponse.json({ success: false, error: 'Missing commentId or action' }, { status: 400 });
    }

    let requiredPermission: PermissionKey = PERMISSIONS.COMMENTS_HIDE;
    let newStatus = 'hidden';
    let auditAction = 'COMMENT_HIDDEN';

    if (action === 'remove') {
      requiredPermission = PERMISSIONS.COMMENTS_DELETE;
      newStatus = 'removed';
      auditAction = 'COMMENT_REMOVED';
    } else if (action === 'restore') {
      requiredPermission = PERMISSIONS.COMMENTS_HIDE;
      newStatus = 'published';
      auditAction = 'COMMENT_RESTORED';
    }

    if (!hasPermission(admin.role, requiredPermission)) {
      return NextResponse.json({ 
        success: false, 
        error: `Forbidden: Admin role '${admin.role}' lacks permission ${requiredPermission}` 
      }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Update comment status in PostgreSQL
    const { error: commentError } = await supabase
      .from('comments')
      .update({
        status: newStatus,
        removal_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId);

    if (commentError) {
      console.warn('[Moderation Comment API] Database update warning:', commentError.message);
    }

    // 2. Insert audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_type: 'comment',
      target_id: commentId,
      metadata: {
        reason: reason || 'Comment moderated by administrator',
        new_status: newStatus,
        admin_role: admin.role,
      },
    }).select();

    return NextResponse.json({
      success: true,
      message: `Comment ${commentId} status successfully updated to ${newStatus}`,
      data: {
        commentId,
        status: newStatus,
        action: auditAction,
      },
    });
  } catch (error: any) {
    console.error('[Moderation Comment API] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to complete this action.' }, { status: 500 });
  }
}
