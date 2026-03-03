'use client';

import { useState } from 'react';
import type { ProposalSection } from '@/src/types/proposal';

interface SectionBuilderProps {
  sections: ProposalSection[];
  onChange: (sections: ProposalSection[]) => void;
  disabled?: boolean;
  onErrorsChange?: (errors: Record<number, Record<string, string>>) => void;
}

type SectionErrors = Record<number, Record<string, string>>;

export default function SectionBuilder({
  sections,
  onChange,
  disabled = false,
  onErrorsChange,
}: SectionBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>({});

  const validateSection = (section: ProposalSection, index: number): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!section.section_name?.trim()) {
      errors.section_name = 'Section name is required';
    } else if (section.section_name.length > 100) {
      errors.section_name = 'Section name must be 100 characters or less';
    }

    if (!section.content?.trim()) {
      errors.content = 'Section content is required';
    } else if (section.content.length > 10000) {
      errors.content = 'Section content must be 10000 characters or less';
    }

    return errors;
  };

  const updateSectionAndValidate = (index: number, field: keyof ProposalSection, value: any) => {
    const updated = [...sections];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);

    // Validate the updated section
    const errors = validateSection(updated[index], index);
    const newErrors = { ...sectionErrors };
    if (Object.keys(errors).length > 0) {
      newErrors[index] = errors;
    } else {
      delete newErrors[index];
    }
    setSectionErrors(newErrors);
    onErrorsChange?.(newErrors);
  };

  const addSection = () => {
    const newSection: ProposalSection = {
      section_name: `Section ${sections.length + 1}`,
      content: '',
      field_type: 'text',
      section_order: sections.length + 1,
      is_editable: true,
    };
    onChange([...sections, newSection]);
  };


  const deleteSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    // Recalculate order
    updated.forEach((section, i) => {
      section.section_order = i + 1;
    });
    onChange(updated);
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    const updated = [...sections];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    // Recalculate order
    updated.forEach((section, i) => {
      section.section_order = i + 1;
    });
    onChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      moveSection(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="section-builder">
      <button
        type="button"
        onClick={addSection}
        disabled={disabled}
        className="btn-primary mb-4"
      >
        + Add Section
      </button>

      {sections.length === 0 ? (
        <p className="text-muted">No sections yet. Add one to get started.</p>
      ) : (
        <div className="sections-list">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`section-card ${editingIndex === index ? 'expanded' : ''} ${
                sectionErrors[index] ? 'error-state' : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={() => handleDragOver(index)}
              onDragEnd={handleDragEnd}
            >
              {/* Section Header */}
              <div className="section-header">
                <div className="drag-handle">⋮⋮</div>
                <div className="section-info">
                  <h4>
                    {section.section_name}
                    {sectionErrors[index] && (
                      <span className="error-badge" title="This section has validation errors">
                        ⚠️
                      </span>
                    )}
                  </h4>
                  <small className="text-muted">
                    {section.field_type} • Order: {section.section_order}
                  </small>
                </div>
                <div className="section-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingIndex(editingIndex === index ? null : index)
                    }
                    disabled={disabled}
                    className="btn-small"
                  >
                    {editingIndex === index ? 'Collapse' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSection(index)}
                    disabled={disabled}
                    className="btn-small btn-danger-small"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Section Content (Expandable) */}
              {editingIndex === index && (
                <div className="section-content">
                  <div className="form-group">
                    <label>Section Name *</label>
                    <input
                      type="text"
                      value={section.section_name}
                      onChange={(e) =>
                        updateSectionAndValidate(index, 'section_name', e.target.value)
                      }
                      maxLength={100}
                      disabled={disabled}
                      className={sectionErrors[index]?.section_name ? 'input-error' : ''}
                    />
                    {sectionErrors[index]?.section_name && (
                      <small className="error">{sectionErrors[index].section_name}</small>
                    )}
                    <small className="text-muted">
                      {section.section_name.length}/100
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Field Type</label>
                    <select
                      value={section.field_type}
                      onChange={(e) =>
                        updateSectionAndValidate(
                          index,
                          'field_type',
                          e.target.value as ProposalSection['field_type']
                        )
                      }
                      disabled={disabled}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="currency">Currency</option>
                      <option value="textarea">Text Area</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Content *</label>
                    <textarea
                      value={section.content}
                      onChange={(e) =>
                        updateSectionAndValidate(index, 'content', e.target.value)
                      }
                      placeholder="Enter section content (supports HTML)"
                      rows={6}
                      maxLength={10000}
                      disabled={disabled}
                      className={sectionErrors[index]?.content ? 'input-error' : ''}
                    />
                    {sectionErrors[index]?.content && (
                      <small className="error">{sectionErrors[index].content}</small>
                    )}
                    <small className="text-muted">
                      {section.content.length}/10000
                    </small>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={section.is_editable ?? true}
                        onChange={(e) =>
                          updateSectionAndValidate(index, 'is_editable', e.target.checked)
                        }
                        disabled={disabled}
                      />
                      Editable by users
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="sections-count mt-4">
        <small className="text-muted">
          {sections.length} section{sections.length !== 1 ? 's' : ''} (max 50)
        </small>
      </div>
    </div>
  );
}
