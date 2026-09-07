import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/session';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin session required' }, { status: 401 });
    }

    const body = await req.json();
    const { verificationId, action, notes } = body;

    if (!verificationId || !action) {
      return NextResponse.json({ success: false, error: 'Missing verificationId or action' }, { status: 400 });
    }

    const isApprove = action === 'approve';
    const requiredPermission = isApprove ? PERMISSIONS.VERIFICATION_APPROVE : PERMISSIONS.VERIFICATION_REJECT;
    const newStatus = isApprove ? 'approved' : 'rejected';
    const auditAction = isApprove ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED';

    if (!hasPermission(admin.role, requiredPermission)) {
      return NextResponse.json({ 
        success: false, 
        error: `Forbidden: Admin role '${admin.role}' lacks permission ${requiredPermission}` 
      }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Update verification request in PostgreSQL
    const { error: verifyError } = await supabase
      .from('verification_requests')
      .update({
        status: newStatus,
        reviewer_id: admin.id,
        reviewer_notes: notes || (isApprove ? 'Approved verified evidence' : 'Evidence insufficient or fraudulent'),
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', verificationId);

    if (verifyError) {
      console.warn('[Moderation Verification API] Database update warning:', verifyError.message);
    }

    // 2. Audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_type: 'verification',
      target_id: verificationId,
      metadata: {
        reviewer_notes: notes || '',
        new_status: newStatus,
        reviewer_id: admin.id,
      },
    }).select();

    return NextResponse.json({
      success: true,
      message: `Verification ${verificationId} status updated to ${newStatus}`,
      data: {
        verificationId,
        status: newStatus,
        action: auditAction,
      },
    });
  } catch (error: any) {
    console.error('[Moderation Verification API] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to complete this action.' }, { status: 500 });
  }
}
