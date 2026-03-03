'use client';

import { useState } from 'react';
import type { ProposalResponse } from '@/src/types/proposal';

interface ProposalsListProps {
  proposals: ProposalResponse[];
  eventId: string;
}

type SortField = 'title' | 'version' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'draft' | 'sent' | 'approved' | 'rejected';

export default function ProposalsList({ proposals, eventId }: ProposalsListProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter proposals
  const filteredProposals = proposals.filter(
    (p) => statusFilter === 'all' || p.status === statusFilter
  );

  // Sort proposals
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'badge badge-gray';
      case 'sent':
        return 'badge badge-blue';
      case 'approved':
        return 'badge badge-green';
      case 'rejected':
        return 'badge badge-red';
      default:
        return 'badge';
    }
  };

  if (proposals.length === 0) {
    return (
      <div className="proposals-list empty">
        <p>No proposals created yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="proposals-list">
      {/* Filter controls */}
      <div className="filters mt-4 mb-4">
        <label>Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
              Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('version')} style={{ cursor: 'pointer' }}>
              Version {sortField === 'version' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
              Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
              Created {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProposals.map((proposal) => (
            <tr key={proposal.id}>
              <td>
                <strong>{proposal.title}</strong>
                {proposal.description && (
                  <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {proposal.description.substring(0, 50)}...
                  </div>
                )}
              </td>
              <td>{proposal.version}</td>
              <td>
                <span className={getStatusBadgeClass(proposal.status)}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </td>
              <td>{new Date(proposal.created_at).toLocaleDateString()}</td>
              <td>
                <div className="actions">
                  <button className="btn-small">Edit</button>
                  <button className="btn-small">Preview</button>
                  <button className="btn-small btn-danger-small">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="proposals-count mt-4">
        <p className="text-muted">
          Showing {sortedProposals.length} of {proposals.length} proposals
        </p>
      </div>
    </div>
  );
}
