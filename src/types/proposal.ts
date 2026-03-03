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
