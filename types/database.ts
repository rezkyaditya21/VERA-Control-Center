export type UserStatus = 'active' | 'suspended' | 'banned';
export type ContentStatus = 'published' | 'under_review' | 'hidden' | 'removed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type AdminRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  decision_score: number;
  reputation_tier: string;
  decisions_count: number;
  experiences_count: number;
  helpful_count: number;
  status: UserStatus;
  suspended_until?: string | null;
  ban_reason?: string | null;
  created_at: string;
  updated_at: string;
  last_active_at: string;
  roles?: AdminRole[];
}

export interface Post {
  id: string;
  author_id: string;
  author?: Profile;
  title: string;
  category: string;
  description: string;
  min_budget: number;
  max_budget: number;
  priorities: string[];
  condition_preference: string;
  status: ContentStatus;
  participants_count: number;
  experiences_count: number;
  answered_percentage: number;
  top_candidate_name?: string;
  ai_risk_score?: number;
  removal_reason?: string | null;
  removed_by?: string | null;
  removed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  post_id: string;
  name: string;
  brand: string;
  rank: number;
  match_percentage: number;
  price_range: string;
  image_url?: string;
  suitability?: {
    pros: string[];
    cons: string[];
  };
  scores?: Record<string, number>;
}

export interface Comment {
  id: string;
  post_id: string;
  post_title?: string;
  author_id: string;
  author?: Profile;
  content: string;
  usage_duration?: string;
  sentiment: 'positif' | 'negatif' | 'netral';
  verified_owner: boolean;
  likes_count: number;
  status: ContentStatus;
  removal_reason?: string | null;
  created_at: string;
}

export interface UserExperience {
  id: string;
  post_id?: string;
  author_id: string;
  author?: Profile;
  product_name: string;
  usage_duration: string;
  outcome_status: string;
  ratings: Record<string, number>;
  review_text: string;
  proof_photos: string[];
  invoice_url?: string;
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  likes_count: number;
  status: ContentStatus;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter?: Profile;
  target_type: 'user' | 'post' | 'comment' | 'experience' | 'progress' | 'milestone' | 'proof';
  target_id: string;
  target_preview?: string;
  reason: string;
  details?: string;
  evidence_urls?: string[];
  priority: ReportPriority;
  status: ReportStatus;
  assigned_to?: string | null;
  assigned_moderator?: Profile | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  admin_id: string;
  admin?: Profile;
  target_type: string;
  target_id: string;
  target_name?: string;
  action: string;
  reason: string;
  duration_hours?: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  user?: Profile;
  verification_type: 'purchase_invoice' | 'product_serial' | 'id_card' | 'creator';
  title: string;
  submitted_info: Record<string, unknown>;
  document_urls: string[];
  status: VerificationStatus;
  reviewer_id?: string | null;
  reviewer?: Profile | null;
  reviewer_notes?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type?: string;
  target_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  description: string;
  updated_by?: string;
  updated_at: string;
}

// Progress, Milestone, Proof & Timeline System (VERA Core Differentiator)
export type ProgressStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ItemVisibility = 'public' | 'followers' | 'private';
export type ProofType = 'github' | 'website' | 'certificate' | 'image' | 'video' | 'document' | 'other';
export type ProofStatus = 'unverified' | 'verified' | 'rejected';

export interface Progress {
  id: string;
  user_id: string;
  user?: Profile;
  title: string;
  description?: string;
  category: string;
  start_date: string;
  end_date?: string | null;
  status: ProgressStatus;
  visibility: ItemVisibility;
  cover_url?: string | null;
  milestones_count?: number;
  proofs_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Milestone {
  id: string;
  progress_id: string;
  progress?: Progress;
  user_id: string;
  user?: Profile;
  title: string;
  description?: string;
  milestone_date: string;
  media_url?: string | null;
  visibility: ItemVisibility;
  is_shared_to_feed: boolean;
  proofs?: Proof[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Proof {
  id: string;
  milestone_id?: string | null;
  milestone?: Milestone;
  progress_id: string;
  progress?: Progress;
  user_id: string;
  user?: Profile;
  type: ProofType;
  title: string;
  description?: string;
  external_url?: string | null;
  media_url?: string | null;
  visibility: ItemVisibility;
  verification_status: ProofStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  reviewer?: Profile | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

