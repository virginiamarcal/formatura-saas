'use client';

import { useEffect, useState } from 'react';

interface Attendee {
  user_id: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface RecipientSelectorProps {
  eventId: string;
  selectedRecipients: string[];
  onChange: (recipients: string[]) => void;
}

export function RecipientSelector({
  eventId,
  selectedRecipients,
  onChange,
}: RecipientSelectorProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendees = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/events/${eventId}/attendees`);
        if (!response.ok) {
          throw new Error('Failed to fetch attendees');
        }
        const data = await response.json();
        setAttendees(data.attendees || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attendees');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchAttendees();
    }
  }, [eventId]);

  const handleToggle = (userId: string) => {
    if (selectedRecipients.includes(userId)) {
      onChange(selectedRecipients.filter((id) => id !== userId));
    } else {
      onChange([...selectedRecipients, userId]);
    }
  };

  const filteredAttendees = attendees.filter((attendee) =>
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-4">Loading attendees...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="alert alert-warning">
        <span>No attendees found for this event</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name or email..."
        className="input input-bordered w-full"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Attendees List */}
      <div className="border rounded-lg max-h-80 overflow-y-auto">
        {filteredAttendees.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No attendees match your search
          </div>
        ) : (
          filteredAttendees.map((attendee) => (
            <div key={attendee.user_id} className="flex items-center p-3 border-b hover:bg-gray-50">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={selectedRecipients.includes(attendee.user_id)}
                onChange={() => handleToggle(attendee.user_id)}
              />
              <div className="ml-4 flex-1">
                <p className="font-medium text-sm">{attendee.name}</p>
                <p className="text-xs text-gray-500">{attendee.email}</p>
              </div>
              <span className="badge badge-sm">
                {attendee.status === 'accepted' && (
                  <span className="badge-success">Accepted</span>
                )}
                {attendee.status === 'pending' && (
                  <span className="badge-warning">Pending</span>
                )}
                {attendee.status === 'declined' && (
                  <span className="badge-error">Declined</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-600">
        Showing {filteredAttendees.length} of {attendees.length} attendees
      </div>
    </div>
  );
}
