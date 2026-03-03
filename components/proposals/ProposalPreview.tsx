'use client';

import type { ProposalResponse } from '@/src/types/proposal';

interface ProposalPreviewProps {
  proposal: ProposalResponse;
  onClose: () => void;
}

export default function ProposalPreview({
  proposal,
  onClose,
}: ProposalPreviewProps) {
  const sanitizeHtml = (html: string) => {
    // Basic HTML sanitization - remove script tags
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  return (
    <div className="modal active">
      <div className="modal-content preview-modal">
        <div className="preview-header">
          <h2>{proposal.title}</h2>
          <button
            onClick={onClose}
            className="btn-small"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className="preview-info">
          <div className="info-row">
            <span>Version:</span>
            <strong>{proposal.version}</strong>
          </div>
          <div className="info-row">
            <span>Status:</span>
            <strong>{proposal.status}</strong>
          </div>
          {proposal.description && (
            <div className="info-row">
              <span>Description:</span>
              <p>{proposal.description}</p>
            </div>
          )}
        </div>

        <div className="preview-content">
          <h3>Sections</h3>
          {proposal.sections && proposal.sections.length > 0 ? (
            proposal.sections
              .sort((a, b) => a.section_order - b.section_order)
              .map((section) => (
                <div key={section.id} className="preview-section">
                  <h4>{section.section_name}</h4>
                  <div
                    className="section-html"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(section.content),
                    }}
                  />
                  <small className="text-muted">
                    Type: {section.field_type} • Editable: {section.is_editable ? 'Yes' : 'No'}
                  </small>
                </div>
              ))
          ) : (
            <p className="text-muted">No sections in this proposal.</p>
          )}
        </div>

        <div className="preview-actions">
          <button onClick={onClose} className="btn-primary">
            Close Preview
          </button>
          <button className="btn-secondary" disabled title="Coming in Story 1.7">
            Export to PDF (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
