'use client';

import { useState } from 'react';
import ProposalForm from './ProposalForm';
import type { ProposalResponse } from '@/src/types/proposal';

interface ProposalCreateModalProps {
  eventId: string;
  onClose: () => void;
  onProposalCreated: (proposal: ProposalResponse) => void;
}

export default function ProposalCreateModal({
  eventId,
  onClose,
  onProposalCreated,
}: ProposalCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_TOKEN || ''}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to create proposal');
      }

      const proposal = await response.json();
      onProposalCreated(proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <h2>Create New Proposal</h2>

        {error && <div className="alert alert-error mt-4">{error}</div>}

        <ProposalForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
