import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/session';
import { hasPermission, PERMISSIONS, PermissionKey } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local-admin';
    const rateCheck = checkRateLimit(`mod-proof:${ip}`, 45, 60);

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
    const { proofId, action, reason } = body;

    if (!proofId || !action) {
      return NextResponse.json({ success: false, error: 'Missing proofId or action' }, { status: 400 });
    }

    let requiredPermission: PermissionKey = PERMISSIONS.PROOFS_VERIFY;
    let auditAction = 'PROOF_VERIFIED';
    let updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'verify') {
      requiredPermission = PERMISSIONS.PROOFS_VERIFY;
      auditAction = 'PROOF_VERIFIED';
      updateFields.verification_status = 'verified';
      updateFields.verified_at = new Date().toISOString();
      updateFields.verified_by = admin.id;
    } else if (action === 'reject') {
      requiredPermission = PERMISSIONS.PROOFS_REJECT;
      auditAction = 'PROOF_REJECTED';
      updateFields.verification_status = 'rejected';
      updateFields.verified_at = new Date().toISOString();
      updateFields.verified_by = admin.id;
    } else if (action === 'hide') {
      requiredPermission = PERMISSIONS.PROGRESS_MODERATE;
      auditAction = 'PROOF_HIDDEN';
      updateFields.deleted_at = new Date().toISOString();
    } else if (action === 'restore') {
      requiredPermission = PERMISSIONS.PROGRESS_MODERATE;
      auditAction = 'PROOF_RESTORED';
      updateFields.deleted_at = null;
    } else {
      return NextResponse.json({ success: false, error: `Unsupported proof action: ${action}` }, { status: 400 });
    }

    if (!hasPermission(admin.role, requiredPermission)) {
      return NextResponse.json({ 
        success: false, 
        error: `Forbidden: Admin role '${admin.role}' lacks permission ${requiredPermission}` 
      }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Update proof in PostgreSQL
    const { error: proofError } = await supabase
      .from('proofs')
      .update(updateFields)
      .eq('id', proofId);

    if (proofError) {
      console.warn('[Moderation Proof API] Database update warning:', proofError.message);
    }

    // 2. Audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_type: 'proof',
      target_id: proofId,
      metadata: {
        action,
        reason: reason || 'Reviewed by administrator',
        admin_role: admin.role,
        fields: updateFields,
      },
    }).select();

    return NextResponse.json({
      success: true,
      message: `Proof ${proofId} successfully processed (${action})`,
      data: {
        proofId,
        action,
        auditAction,
      },
    });
  } catch (error: any) {
    console.error('[Moderation Proof API] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to process proof' }, { status: 500 });
  }
}
