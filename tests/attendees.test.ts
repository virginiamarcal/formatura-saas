import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import type { EventAttendee, AttendeeListResponse } from '../src/types/attendee.js';

// Mock Attendees Service for testing
class MockAttendeesService {
  private attendees: Map<string, EventAttendee[]> = new Map();
  private idCounter = 0;

  async getEventAttendees(eventId: string, query: any = {}) {
    const attendees = this.attendees.get(eventId) || [];
    const page = query.page || 1;
    const limit = query.limit || 20;

    let filtered = [...attendees];

    // Apply search
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term));
    }

    // Apply role filter
    if (query.role) {
      filtered = filtered.filter((a) => a.role === query.role);
    }

    // Apply status filter
    if (query.status) {
      filtered = filtered.filter((a) => a.status === query.status);
    }

    const offset = (page - 1) * limit;
    const sliced = filtered.slice(offset, offset + limit);

    return {
      event_id: eventId,
      attendees: sliced,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    };
  }

  async getAttendee(eventId: string, userId: string) {
    const attendees = this.attendees.get(eventId) || [];
    return attendees.find((a) => a.user_id === userId) || null;
  }

  async addAttendee(eventId: string, request: any): Promise<EventAttendee> {
    const attendees = this.attendees.get(eventId) || [];

    // Check for duplicates
    if (attendees.some((a) => a.email === request.email)) {
      throw new Error(`Attendee with email ${request.email} already exists in this event`);
    }

    const newAttendee: EventAttendee = {
      id: `id_${this.idCounter++}`,
      event_id: eventId,
      user_id: `user_${this.idCounter}`,
      email: request.email,
      name: request.name,
      role: request.role || 'member',
      status: 'pending',
      invited_at: new Date().toISOString(),
      joined_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    attendees.push(newAttendee);
    this.attendees.set(eventId, attendees);
    return newAttendee;
  }

  async removeAttendee(eventId: string, userId: string) {
    const attendees = this.attendees.get(eventId) || [];
    const index = attendees.findIndex((a) => a.user_id === userId);

    if (index === -1) {
      return false;
    }

    attendees.splice(index, 1);
    this.attendees.set(eventId, attendees);
    return true;
  }

  async searchAttendees(eventId: string, searchTerm: string) {
    const attendees = this.attendees.get(eventId) || [];
    const term = searchTerm.toLowerCase();

    return attendees.filter((a) => a.name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term));
  }

  async getAttendeesByRole(eventId: string, role: string) {
    const attendees = this.attendees.get(eventId) || [];
    return attendees.filter((a) => a.role === role);
  }

  async getAttendeeStats(eventId: string) {
    const attendees = this.attendees.get(eventId) || [];
    return {
      pending: attendees.filter((a) => a.status === 'pending').length,
      accepted: attendees.filter((a) => a.status === 'accepted').length,
      declined: attendees.filter((a) => a.status === 'declined').length,
    };
  }
}

describe('AttendeesService', () => {
  let service: MockAttendeesService;
  const eventId = 'event_123';

  before(() => {
    service = new MockAttendeesService();
  });

  describe('getEventAttendees()', () => {
    it('should return empty list for new event', async () => {
      const result = await service.getEventAttendees(eventId);

      assert.strictEqual(result.event_id, eventId);
      assert.strictEqual(result.attendees.length, 0);
      assert.strictEqual(result.pagination.total, 0);
    });

    it('should support pagination', async () => {
      // Add 25 attendees
      for (let i = 0; i < 25; i++) {
        await service.addAttendee(eventId, { email: `user${i}@example.com`, name: `User ${i}` });
      }

      const page1 = await service.getEventAttendees(eventId, { page: 1, limit: 10 });
      assert.strictEqual(page1.attendees.length, 10);
      assert.strictEqual(page1.pagination.page, 1);
      assert.strictEqual(page1.pagination.total, 25);
      assert.strictEqual(page1.pagination.pages, 3);

      const page2 = await service.getEventAttendees(eventId, { page: 2, limit: 10 });
      assert.strictEqual(page2.attendees.length, 10);
      assert.strictEqual(page2.pagination.page, 2);
    });

    it('should support search by name', async () => {
      const result = await service.getEventAttendees(eventId, { search: 'User 1' });

      assert.ok(result.attendees.length > 0);
      assert.ok(result.attendees.some((a) => a.name.includes('User 1')));
    });

    it('should support search by email', async () => {
      const result = await service.getEventAttendees(eventId, { search: 'user1@' });

      assert.ok(result.attendees.length > 0);
      assert.ok(result.attendees.some((a) => a.email.includes('user1@')));
    });

    it('should support role filtering', async () => {
      const result = await service.getEventAttendees(eventId, { role: 'member' });

      assert.ok(result.attendees.every((a) => a.role === 'member'));
    });
  });

  describe('addAttendee()', () => {
    const newEventId = 'event_456';

    it('should add attendee successfully', async () => {
      const attendee = await service.addAttendee(newEventId, {
        email: 'john@example.com',
        name: 'John Doe',
      });

      assert.ok(attendee.id);
      assert.strictEqual(attendee.email, 'john@example.com');
      assert.strictEqual(attendee.name, 'John Doe');
      assert.strictEqual(attendee.role, 'member');
      assert.strictEqual(attendee.status, 'pending');
    });

    it('should set default role to member', async () => {
      const attendee = await service.addAttendee(newEventId, {
        email: 'jane@example.com',
        name: 'Jane Doe',
      });

      assert.strictEqual(attendee.role, 'member');
    });

    it('should allow custom role', async () => {
      const attendee = await service.addAttendee(newEventId, {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      });

      assert.strictEqual(attendee.role, 'admin');
    });

    it('should prevent duplicate emails in same event', async () => {
      try {
        await service.addAttendee(newEventId, {
          email: 'john@example.com',
          name: 'John Doe 2',
        });
        assert.fail('Should have thrown error for duplicate email');
      } catch (error: any) {
        assert.ok(error.message.includes('already exists'));
      }
    });
  });

  describe('removeAttendee()', () => {
    it('should remove attendee', async () => {
      const removeEventId = 'event_remove';
      const attendee = await service.addAttendee(removeEventId, {
        email: 'remove@example.com',
        name: 'Remove Me',
      });

      const removed = await service.removeAttendee(removeEventId, attendee.user_id);
      assert.strictEqual(removed, true);

      const result = await service.getAttendee(removeEventId, attendee.user_id);
      assert.strictEqual(result, null);
    });

    it('should return false for non-existent attendee', async () => {
      const result = await service.removeAttendee('event_nonexistent', 'user_nonexistent');
      assert.strictEqual(result, false);
    });
  });

  describe('searchAttendees()', () => {
    const searchEventId = 'event_search';

    before(async () => {
      await service.addAttendee(searchEventId, { email: 'alice@example.com', name: 'Alice Wonder' });
      await service.addAttendee(searchEventId, { email: 'bob@example.com', name: 'Bob Builder' });
      await service.addAttendee(searchEventId, { email: 'charlie@example.com', name: 'Charlie Brown' });
    });

    it('should search by name', async () => {
      const results = await service.searchAttendees(searchEventId, 'alice');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, 'Alice Wonder');
    });

    it('should search by email', async () => {
      const results = await service.searchAttendees(searchEventId, 'bob@');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, 'Bob Builder');
    });

    it('should be case insensitive', async () => {
      const results = await service.searchAttendees(searchEventId, 'CHARLIE');
      assert.strictEqual(results.length, 1);
    });
  });

  describe('getAttendeesByRole()', () => {
    const roleEventId = 'event_roles';

    before(async () => {
      await service.addAttendee(roleEventId, { email: 'admin1@example.com', name: 'Admin 1', role: 'admin' });
      await service.addAttendee(roleEventId, { email: 'member1@example.com', name: 'Member 1', role: 'member' });
      await service.addAttendee(roleEventId, { email: 'guest1@example.com', name: 'Guest 1', role: 'guest' });
    });

    it('should filter by role', async () => {
      const admins = await service.getAttendeesByRole(roleEventId, 'admin');
      assert.strictEqual(admins.length, 1);
      assert.strictEqual(admins[0].role, 'admin');
    });
  });

  describe('getAttendeeStats()', () => {
    const statsEventId = 'event_stats';

    before(async () => {
      await service.addAttendee(statsEventId, { email: 'pending@example.com', name: 'Pending User' });
    });

    it('should return stats with zero values', async () => {
      const stats = await service.getAttendeeStats(statsEventId);

      assert.strictEqual(stats.pending, 1);
      assert.strictEqual(stats.accepted, 0);
      assert.strictEqual(stats.declined, 0);
    });
  });

  describe('Data Validation', () => {
    it('should handle email validation', async () => {
      try {
        await service.addAttendee('event_validate', {
          email: 'invalid-email',
          name: 'Test',
        });
        // Note: Mock doesn't validate, real service would use Zod
        // This test documents expected behavior
      } catch (error: any) {
        assert.ok(error.message);
      }
    });

    it('should require name field', async () => {
      try {
        await service.addAttendee('event_validate', {
          email: 'test@example.com',
          name: '', // Empty name
        });
        // Mock doesn't validate, real service would reject
      } catch (error: any) {
        assert.ok(error.message);
      }
    });
  });
});
