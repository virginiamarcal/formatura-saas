'use client';

import { useState } from 'react';
import type { Proposal, SendProposalRequest, SendProposalResponse } from '@/src/types/proposal';
import { RecipientSelector } from './RecipientSelector';
import { SendConfirmation } from './SendConfirmation';

interface ProposalSendModalProps {
  proposal: Proposal;
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (response: SendProposalResponse) => void;
}

export function ProposalSendModal({
  proposal,
  eventId,
  isOpen,
  onClose,
  onSuccess,
}: ProposalSendModalProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleRecipientChange = (recipients: string[]) => {
    setSelectedRecipients(recipients);
  };

  const handleMessageChange = (message: string) => {
    if (message.length <= 1000) {
      setCustomMessage(message);
    }
  };

  const handleReviewAndSend = () => {
    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sendRequest: SendProposalRequest = {
        recipient_user_ids: selectedRecipients,
        custom_message: customMessage || undefined,
      };

      const response = await fetch(`/api/proposals/${proposal.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send proposal');
      }

      const result: SendProposalResponse = await response.json();
      onSuccess?.(result);

      // Reset form
      setSelectedRecipients([]);
      setCustomMessage('');
      setShowConfirmation(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
    } else {
      onClose();
    }
  };

  return (
    <>
      {!showConfirmation ? (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg">
              Send Proposal: <span className="text-primary">{proposal.title}</span>
            </h3>

            {/* Proposal Info */}
            <div className="mt-4 alert alert-info">
              <div>
                <p className="text-sm">
                  <strong>Version:</strong> {proposal.version}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong>{' '}
                  <span className="badge badge-gray">{proposal.status}</span>
                </p>
              </div>
            </div>

            {/* Recipient Selection */}
            <div className="mt-6">
              <label className="label">
                <span className="label-text font-semibold">Select Recipients *</span>
              </label>
              <RecipientSelector
                eventId={eventId}
                selectedRecipients={selectedRecipients}
                onChange={handleRecipientChange}
              />
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedRecipients.length} member{selectedRecipients.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Custom Message */}
            <div className="mt-6">
              <label className="label">
                <span className="label-text font-semibold">Optional Message</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24"
                placeholder="Add a custom message for recipients..."
                value={customMessage}
                onChange={(e) => handleMessageChange(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {customMessage.length}/1000 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error mt-4">
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleReviewAndSend}
                disabled={selectedRecipients.length === 0 || isLoading}
              >
                {isLoading ? 'Sending...' : 'Review & Send'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={handleCancel} />
        </div>
      ) : (
        <SendConfirmation
          proposal={proposal}
          recipients={selectedRecipients}
          customMessage={customMessage}
          isLoading={isLoading}
          onConfirm={handleConfirmSend}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
