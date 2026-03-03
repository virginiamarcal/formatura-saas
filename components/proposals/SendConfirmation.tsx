'use client';

import { useEffect, useState } from 'react';
import type { Proposal } from '@/src/types/proposal';

interface SendConfirmationProps {
  proposal: Proposal;
  recipients: string[];
  customMessage: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface RecipientInfo {
  user_id: string;
  email: string;
  name: string;
}

export function SendConfirmation({
  proposal,
  recipients,
  customMessage,
  isLoading,
  onConfirm,
  onCancel,
}: SendConfirmationProps) {
  const [recipientDetails, setRecipientDetails] = useState<RecipientInfo[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    // Fetch recipient details
    const fetchDetails = async () => {
      setIsLoadingDetails(true);
      // Mock data - in real implementation, fetch from API
      setRecipientDetails(
        recipients.map((id, idx) => ({
          user_id: id,
          email: `member${idx + 1}@example.com`,
          name: `Committee Member ${idx + 1}`,
        }))
      );
      setIsLoadingDetails(false);
    };

    if (recipients.length > 0) {
      fetchDetails();
    }
  }, [recipients]);

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <h3 className="font-bold text-lg">Confirm Proposal Send</h3>

        {/* Proposal Summary */}
        <div className="mt-4 space-y-3">
          <div className="bg-base-200 p-4 rounded">
            <p className="text-sm">
              <strong>Proposal:</strong> {proposal.title} (v{proposal.version})
            </p>
            <p className="text-sm mt-2">
              <strong>Recipients:</strong> {recipients.length} member
              {recipients.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Recipients List */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Recipients:</h4>
            {isLoadingDetails ? (
              <p className="text-sm text-gray-500">Loading recipient details...</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recipientDetails.slice(0, 3).map((recipient) => (
                  <div key={recipient.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{recipient.name}</p>
                      <p className="text-xs text-gray-500">{recipient.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">pending</span>
                  </div>
                ))}
                {recipients.length > 3 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    ... and {recipients.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Email Preview */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Email Preview:</h4>
            <div className="bg-white border rounded p-4 text-sm space-y-2">
              <p>
                <strong>From:</strong> proposals@formatura-app.com
              </p>
              <p>
                <strong>Subject:</strong> Admin sent you a proposal: {proposal.title}
              </p>
              <div className="border-t pt-2 mt-2">
                <p className="text-gray-700">Hi {'{recipient_name}'},</p>
                <p className="text-gray-700 mt-2">
                  An admin has shared a proposal for review: <strong>{proposal.title}</strong> (v
                  {proposal.version})
                </p>
                {customMessage && (
                  <p className="text-gray-700 mt-2 italic">
                    <strong>Message:</strong> {customMessage}
                  </p>
                )}
                <p className="text-gray-700 mt-2">View Proposal: [Link]</p>
              </div>
            </div>
          </div>

          {/* Custom Message Info */}
          {!customMessage && (
            <div className="alert alert-info">
              <span>ℹ️ No custom message provided. Recipients will receive the default email.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Back
          </button>
          <button
            className="btn btn-success"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Sending...
              </>
            ) : (
              `Send to ${recipients.length} Member${recipients.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </div>
  );
}
