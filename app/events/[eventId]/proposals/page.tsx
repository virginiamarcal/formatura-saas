'use client';

import { useState, useEffect } from 'react';
import ProposalsList from '@/components/proposals/ProposalsList';
import ProposalCreateModal from '@/components/proposals/ProposalCreateModal';
import type { ProposalResponse } from '@/src/types/proposal';

interface ProposalsPageProps {
  params: {
    eventId: string;
  };
}

export default function ProposalsPage({ params }: ProposalsPageProps) {
  const { eventId } = params;
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load proposals from API
  const loadProposals = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from /api/proposals?event_id={eventId}
      // For now, use mock data
      setProposals([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [eventId]);

  const handleProposalCreated = (proposal: ProposalResponse) => {
    setProposals([...proposals, proposal]);
    setIsModalOpen(false);
  };

  return (
    <div className="proposals-page">
      <h1>Proposals for Event: {eventId}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <button
        className="btn-primary"
        onClick={() => setIsModalOpen(true)}
      >
        + Create Proposal
      </button>

      {loading ? (
        <p>Loading proposals...</p>
      ) : (
        <ProposalsList proposals={proposals} eventId={eventId} />
      )}

      {isModalOpen && (
        <ProposalCreateModal
          eventId={eventId}
          onClose={() => setIsModalOpen(false)}
          onProposalCreated={handleProposalCreated}
        />
      )}
    </div>
  );
}
