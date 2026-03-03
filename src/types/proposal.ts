// Proposal Types
export interface ProposalSection {
  section_name: string;
  content: string;
  field_type: 'text' | 'number' | 'date' | 'currency' | 'textarea';
  section_order: number;
  is_editable?: boolean;
}

export interface CreateProposalRequest {
  event_id: string;
  title: string;
  description?: string;
  version?: number;
  sections: ProposalSection[];
}

export interface Proposal {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  version: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ProposalResponse extends Proposal {
  sections: (ProposalSection & { id: string })[];
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// === PROPOSAL SEND TYPES (Story 1.2) ===

export interface RecipientStatus {
  user_id: string;
  email: string;
  name?: string;
  status: 'pending' | 'viewed' | 'approved' | 'rejected';
  sent_date: string;
}

export interface ProposalSend {
  id: string;
  proposal_id: string;
  sent_at: string;
  sent_by: string;
  recipient_list: RecipientStatus[];
  custom_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendProposalRequest {
  recipient_user_ids: string[];
  custom_message?: string;
}

export interface SendProposalResponse {
  success: boolean;
  proposal_id: string;
  send_id: string;
  recipients_count: number;
  emails_sent: number;
  failed_emails: string[];
  sent_at: string;
  message: string;
}

export interface ProposalSendHistory {
  proposal_id: string;
  sends: ProposalSend[];
}
