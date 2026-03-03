'use client';

import { useState } from 'react';
import SectionBuilder from './SectionBuilder';
import type { ProposalSection } from '@/src/types/proposal';

interface ProposalFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    version: number;
    sections: ProposalSection[];
  }) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export default function ProposalForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: ProposalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0');
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [sectionErrors, setSectionErrors] = useState<Record<number, Record<string, string>>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 255) {
      errors.title = 'Title must be 255 characters or less';
    }

    if (description && description.length > 5000) {
      errors.description = 'Description must be 5000 characters or less';
    }

    if (sections.length === 0) {
      errors.sections = 'At least one section is required';
    }

    // Check if there are any section errors
    const hasSectionErrors = Object.keys(sectionErrors).length > 0;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0 && !hasSectionErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      title,
      description: description || undefined,
      version: parseFloat(version),
      sections,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="proposal-form">
      {/* Title Field */}
      <div className="form-group">
        <label htmlFor="title">Proposal Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Annual Gala Proposal"
          maxLength={255}
          disabled={isSubmitting}
        />
        {validationErrors.title && (
          <small className="error">{validationErrors.title}</small>
        )}
        <small className="text-muted">
          {title.length}/255
        </small>
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional proposal description"
          rows={4}
          maxLength={5000}
          disabled={isSubmitting}
        />
        {validationErrors.description && (
          <small className="error">{validationErrors.description}</small>
        )}
        <small className="text-muted">
          {description.length}/5000
        </small>
      </div>

      {/* Version Field */}
      <div className="form-group">
        <label htmlFor="version">Version</label>
        <input
          id="version"
          type="number"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          step="0.1"
          min="1.0"
          disabled={isSubmitting}
        />
        <small className="text-muted">Read-only after creation</small>
      </div>

      {/* Sections Builder */}
      <div className="form-group">
        <label>Proposal Sections *</label>
        <SectionBuilder
          sections={sections}
          onChange={setSections}
          disabled={isSubmitting}
          onErrorsChange={setSectionErrors}
        />
        {validationErrors.sections && (
          <small className="error">{validationErrors.sections}</small>
        )}
      </div>

      {/* Form Actions */}
      <div className="form-actions" style={{ marginTop: '2rem' }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || Object.keys(sectionErrors).length > 0}
          title={Object.keys(sectionErrors).length > 0 ? 'Please fix section errors before submitting' : ''}
        >
          {isSubmitting ? 'Creating...' : 'Create Proposal'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
