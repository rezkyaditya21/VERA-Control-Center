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
    const { reportId, action, notes } = body;

    if (!reportId || !action) {
      return NextResponse.json({ success: false, error: 'Missing reportId or action' }, { status: 400 });
    }

    let requiredPermission: PermissionKey = PERMISSIONS.REPORTS_RESOLVE;
    let newStatus = 'resolved';
    let auditAction = 'REPORT_RESOLVED';

    if (action === 'dismiss') {
      newStatus = 'dismissed';
      auditAction = 'REPORT_DISMISSED';
    } else if (action === 'assign') {
      requiredPermission = PERMISSIONS.REPORTS_ASSIGN;
      newStatus = 'reviewing';
      auditAction = 'REPORT_ASSIGNED';
    }

    if (!hasPermission(admin.role, requiredPermission)) {
      return NextResponse.json({ 
        success: false, 
        error: `Forbidden: Admin role '${admin.role}' lacks permission ${requiredPermission}` 
      }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Update report in PostgreSQL
    const { error: reportError } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        assigned_to: admin.id,
        resolution_notes: notes || 'Handled via Control Center',
        resolved_at: newStatus !== 'reviewing' ? new Date().toISOString() : null,
      })
      .eq('id', reportId);

    if (reportError) {
      console.warn('[Moderation Report API] Database update warning:', reportError.message);
    }

    // 2. Audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_type: 'report',
      target_id: reportId,
      metadata: {
        resolution_notes: notes || '',
        new_status: newStatus,
        reviewer_id: admin.id,
      },
    }).select();

    return NextResponse.json({
      success: true,
      message: `Report ${reportId} marked as ${newStatus}`,
      data: {
        reportId,
        status: newStatus,
        action: auditAction,
      },
    });
  } catch (error: any) {
    console.error('[Moderation Report API] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to complete this action.' }, { status: 500 });
  }
}
