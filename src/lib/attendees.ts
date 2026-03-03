import { createClient } from '@supabase/supabase-js';
import type {
  EventAttendee,
  AttendeeListResponse,
  AttendeeListQuery,
  AttendeeRole,
  CreateAttendeeRequest,
} from '../types/attendee.js';

/**
 * AttendeesService - Manages event attendees/members
 * Integrates with Supabase for storage and RLS policies
 */
class AttendeesService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get list of attendees for an event with pagination and filters
   */
  async getEventAttendees(eventId: string, query: AttendeeListQuery = {}): Promise<AttendeeListResponse> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      // Build query
      let q = this.supabase.from('event_attendees').select('*', { count: 'exact' }).eq('event_id', eventId);

      // Apply search filter
      if (query.search) {
        q = q.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
      }

      // Apply role filter
      if (query.role) {
        q = q.eq('role', query.role);
      }

      // Apply status filter
      if (query.status) {
        q = q.eq('status', query.status);
      }

      // Apply pagination
      const { data, error, count } = await q.range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch attendees: ${error.message}`);
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        event_id: eventId,
        attendees: data as EventAttendee[],
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      };
    } catch (error) {
      this.log('get_attendees_failed', { eventId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get a single attendee by event and user ID
   */
  async getAttendee(eventId: string, userId: string): Promise<EventAttendee | null> {
    try {
      const { data, error } = await this.supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (which is fine, return null)
        throw new Error(`Failed to fetch attendee: ${error.message}`);
      }

      return (data as EventAttendee) || null;
    } catch (error) {
      this.log('get_attendee_failed', { eventId, userId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Add new attendee to event
   */
  async addAttendee(eventId: string, request: CreateAttendeeRequest): Promise<EventAttendee> {
    try {
      const { data, error } = await this.supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          email: request.email,
          name: request.name,
          role: request.role || 'member',
          status: 'pending',
          // user_id will be set later when user accepts/joins
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          throw new Error(`Attendee with email ${request.email} already exists in this event`);
        }
        throw new Error(`Failed to add attendee: ${error.message}`);
      }

      this.log('attendee_added', { eventId, email: request.email });
      return data as EventAttendee;
    } catch (error) {
      this.log('add_attendee_failed', { eventId, email: request.email, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Remove attendee from event
   */
  async removeAttendee(eventId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove attendee: ${error.message}`);
      }

      this.log('attendee_removed', { eventId, userId });
      return true;
    } catch (error) {
      this.log('remove_attendee_failed', { eventId, userId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Search attendees by name or email
   */
  async searchAttendees(eventId: string, searchTerm: string): Promise<EventAttendee[]> {
    try {
      const { data, error } = await this.supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(50);

      if (error) {
        throw new Error(`Failed to search attendees: ${error.message}`);
      }

      return (data as EventAttendee[]) || [];
    } catch (error) {
      this.log('search_attendees_failed', { eventId, searchTerm, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get attendees by role
   */
  async getAttendeesByRole(eventId: string, role: AttendeeRole): Promise<EventAttendee[]> {
    try {
      const { data, error } = await this.supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('role', role);

      if (error) {
        throw new Error(`Failed to fetch attendees by role: ${error.message}`);
      }

      return (data as EventAttendee[]) || [];
    } catch (error) {
      this.log('get_attendees_by_role_failed', { eventId, role, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update attendee status (pending → accepted/declined)
   */
  async updateAttendeeStatus(eventId: string, userId: string, status: 'accepted' | 'declined'): Promise<EventAttendee> {
    try {
      const { data, error } = await this.supabase
        .from('event_attendees')
        .update({
          status,
          joined_at: status === 'accepted' ? new Date().toISOString() : null,
        })
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update attendee status: ${error.message}`);
      }

      this.log('attendee_status_updated', { eventId, userId, status });
      return data as EventAttendee;
    } catch (error) {
      this.log('update_attendee_status_failed', {
        eventId,
        userId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get count of attendees by status
   */
  async getAttendeeStats(eventId: string): Promise<{ pending: number; accepted: number; declined: number }> {
    try {
      const { data, error } = await this.supabase.from('event_attendees').select('status').eq('event_id', eventId);

      if (error) {
        throw new Error(`Failed to fetch attendee stats: ${error.message}`);
      }

      const stats = { pending: 0, accepted: 0, declined: 0 };
      (data as Array<{ status: string }>).forEach((attendee) => {
        if (attendee.status in stats) {
          stats[attendee.status as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (error) {
      this.log('get_attendee_stats_failed', { eventId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Log service activity
   */
  private log(action: string, details: unknown): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ATTENDEES_SERVICE - ${action}:`, JSON.stringify(details));
  }
}

// Export singleton instance
export const attendeesService = new AttendeesService();
