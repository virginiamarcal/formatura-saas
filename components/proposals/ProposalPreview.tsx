'use client';

import DOMPurify from 'isomorphic-dompurify';
import type { ProposalResponse } from '@/src/types/proposal';

interface ProposalPreviewProps {
  proposal: ProposalResponse;
  onClose: () => void;
}

export default function ProposalPreview({
  proposal,
  onClose,
}: ProposalPreviewProps) {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * Uses DOMPurify which is battle-tested for XSS prevention
   * Removes:
   * - Script tags
   * - Event handlers (onclick, onerror, etc)
   * - Iframes and other dangerous elements
   * - Keeps safe HTML formatting (p, h1-h6, strong, em, ul, ol, li, br, etc)
   */
  const sanitizeHtml = (html: string): string => {
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 'i', 'b',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      KEEP_CONTENT: true,
    };
    return DOMPurify.sanitize(html, config);
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
