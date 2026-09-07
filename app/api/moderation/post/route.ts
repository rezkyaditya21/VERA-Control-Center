import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/session';
import { hasPermission, PERMISSIONS, PermissionKey } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin session required' }, { status: 401 });
    }

    const body = await req.json();
    const { postId, action, reason } = body;

    if (!postId || !action) {
      return NextResponse.json({ success: false, error: 'Missing postId or action' }, { status: 400 });
    }

    let requiredPermission: PermissionKey = PERMISSIONS.POSTS_HIDE;
    let newStatus = 'hidden';
    let auditAction = 'POST_HIDDEN';

    if (action === 'remove') {
      requiredPermission = PERMISSIONS.POSTS_DELETE;
      newStatus = 'removed';
      auditAction = 'POST_REMOVED';
    } else if (action === 'restore') {
      requiredPermission = PERMISSIONS.POSTS_RESTORE;
      newStatus = 'published';
      auditAction = 'POST_RESTORED';
    }

    if (!hasPermission(admin.role, requiredPermission)) {
      return NextResponse.json({ 
        success: false, 
        error: `Forbidden: Role ${admin.role} lacks permission ${requiredPermission}` 
      }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Update post status in PostgreSQL
    const { error: postError } = await supabase
      .from('posts')
      .update({
        status: newStatus,
        removed_reason: reason || null,
        removed_by: newStatus !== 'published' ? admin.id : null,
        removed_at: newStatus !== 'published' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (postError) {
      console.warn('[Moderation Post API] Database update warning:', postError.message);
    }

    // 2. Write immutable audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_type: 'post',
      target_id: postId,
      metadata: {
        reason: reason || 'Action taken by administrator',
        new_status: newStatus,
        admin_role: admin.role,
      },
    }).select();

    return NextResponse.json({
      success: true,
      message: `Post ${postId} status successfully updated to ${newStatus}`,
      data: {
        postId,
        status: newStatus,
        action: auditAction,
      },
    });
  } catch (error: any) {
    console.error('[Moderation Post API] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to complete this action.' }, { status: 500 });
  }
}
