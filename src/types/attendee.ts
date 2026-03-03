import { z } from 'zod';

// Enums
export type AttendeeRole = 'admin' | 'member' | 'guest';
export type AttendeeStatus = 'pending' | 'accepted' | 'declined';

// Core Types
export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  email: string;
  name: string;
  role: AttendeeRole;
  status: AttendeeStatus;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

// Query & Response Types
export interface AttendeeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: AttendeeRole;
  status?: AttendeeStatus;
}

export interface AttendeeListResponse {
  event_id: string;
  attendees: EventAttendee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BatchAddAttendeesRequest {
  attendees: Array<{
    email: string;
    name: string;
    role?: AttendeeRole;
  }>;
}

// Zod Schemas for Validation
export const CreateAttendeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  role: z.enum(['admin', 'member', 'guest']).optional().default('member'),
});

export const UpdateAttendeeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['admin', 'member', 'guest']).optional(),
  status: z.enum(['pending', 'accepted', 'declined']).optional(),
});

export const AttendeeListQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  role: z.enum(['admin', 'member', 'guest']).optional(),
  status: z.enum(['pending', 'accepted', 'declined']).optional(),
});

export type CreateAttendeeRequest = z.infer<typeof CreateAttendeeSchema>;
export type UpdateAttendeeRequest = z.infer<typeof UpdateAttendeeSchema>;
export type AttendeeListQueryRequest = z.infer<typeof AttendeeListQuerySchema>;
