import { Response } from 'express';
import { CreateProposalSchema, type CreateProposalInput } from '../db/schema.js';
import { AuthRequest } from '../middleware/proposalAuth.js';
import {
  sendValidationError,
  sendAuthorizationError,
  sendNotFoundError,
  sendConflictError,
  sendServerError,
} from '../middleware/validationError.js';
import type { Proposal, ProposalResponse, SendProposalRequest, SendProposalResponse, ProposalSendHistory } from '../types/proposal.js';

/**
 * Controller for proposal operations
 * Handles business logic and database interactions via Supabase
 */

export class ProposalController {
  /**
   * POST /api/proposals
   * Create a new proposal with sections
   */
  static async createProposal(req: AuthRequest, res: Response): Promise<void> {
    try {
      // 1. Validate request body
      const validationResult = CreateProposalSchema.safeParse(req.body);

      if (!validationResult.success) {
        sendValidationError(res, validationResult.error);
        return;
      }

      const proposalData: CreateProposalInput = validationResult.data;

      // 2. Validate authorization
      // TODO: When connected to Supabase, verify:
      // - User is authenticated (req.user should be set by auth middleware)
      // - User is admin of the event (check events.admin_id)
      // - Event exists (check events table)

      if (!req.user) {
        sendAuthorizationError(res, 'Authentication required');
        return;
      }

      // TODO: Verify event exists
      // const event = await supabase
      //   .from('events')
      //   .select('id, admin_id')
      //   .eq('id', proposalData.event_id)
      //   .single();
      //
      // if (!event.data) {
      //   sendConflictError(res, 'Event not found');
      //   return;
      // }
      //
      // if (event.data.admin_id !== req.userId) {
      //   sendAuthorizationError(res, 'You are not an admin of this event');
      //   return;
      // }

      // 3. TODO: Insert into Supabase database
      // - Create proposal record (status='draft')
      // - Create proposal_sections records
      // - Supabase RLS will enforce: user must be event admin

      const mockProposalId = 'uuid-placeholder-' + Date.now();
      const mockCreatedAt = new Date().toISOString();

      // 4. Mock response (TODO: replace with actual DB response)
      const response: ProposalResponse = {
        id: mockProposalId,
        event_id: proposalData.event_id,
        title: proposalData.title,
        description: proposalData.description || null,
        version: proposalData.version,
        status: 'draft',
        created_at: mockCreatedAt,
        updated_at: mockCreatedAt,
        created_by: req.user?.id || 'user-id-placeholder', // Get from auth token
        sections: proposalData.sections.map((section, idx) => ({
          id: `section-uuid-${idx}`,
          ...section,
        })),
      };

      res.status(201).json(response);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  /**
   * GET /api/proposals/:id
   * Fetch single proposal with sections
   *
   * Response (200 OK):
   * {
   *   "id": "uuid",
   *   "event_id": "uuid",
   *   "title": "Proposal Title",
   *   "status": "draft",
   *   "sections": [...]
   * }
   *
   * Errors:
   * - 400: Invalid proposal ID format
   * - 401: Unauthorized
   * - 404: Proposal not found
   * - 500: Server error
   */
  static async getProposal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // 1. Validate proposal ID format (UUID)
      if (typeof id !== 'string') {
        sendValidationError(res, {
          id: ['Invalid proposal ID format'],
        });
        return;
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        sendValidationError(res, {
          id: ['Invalid proposal ID format (must be UUID)'],
        });
        return;
      }

      // 2. TODO: Fetch from Supabase
      // Query structure:
      // SELECT p.*, array_agg(s) as sections
      // FROM proposals p
      // LEFT JOIN proposal_sections s ON p.id = s.proposal_id
      // WHERE p.id = $1
      // GROUP BY p.id
      //
      // RLS will enforce: user can only see proposals they created or where they're event admin

      // TODO: Handle proposal not found
      // const { data, error } = await supabase
      //   .from('proposals')
      //   .select('*, proposal_sections(*)')
      //   .eq('id', id)
      //   .single();
      //
      // if (error || !data) {
      //   sendNotFoundError(res, 'Proposal');
      //   return;
      // }

      // 3. Mock response (TODO: replace with actual DB response)
      const mockProposal: any = {
        id,
        event_id: 'event-uuid-placeholder',
        title: 'Mock Proposal',
        description: null,
        version: 1.0,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: req.user?.id || 'user-id-placeholder',
        sections: [
          {
            id: 'section-uuid-1',
            section_name: 'Overview',
            content: '<p>Overview content</p>',
            field_type: 'text',
            section_order: 1,
          },
        ],
      };

      res.status(200).json(mockProposal);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  /**
   * POST /api/proposals/:id/send
   * Send proposal to committee members (Story 1.2)
   *
   * Request body:
   * {
   *   "recipient_user_ids": ["uuid1", "uuid2"],
   *   "custom_message": "Please review by Friday"
   * }
   *
   * Response (200 OK):
   * {
   *   "success": true,
   *   "proposal_id": "uuid",
   *   "send_id": "uuid",
   *   "recipients_count": 2,
   *   "emails_sent": 2,
   *   "failed_emails": [],
   *   "sent_at": "2026-03-03T10:00:00Z",
   *   "message": "Proposal sent to 2 members"
   * }
   *
   * Errors:
   * - 400: Missing recipients or invalid proposal status
   * - 401: Unauthorized
   * - 403: Forbidden (not event admin)
   * - 404: Proposal not found
   * - 500: Email service failure
   */
  static async sendProposal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // 1. Validate proposal ID
      if (typeof id !== 'string') {
        sendValidationError(res, { id: ['Invalid proposal ID format'] });
        return;
      }

      // 2. Validate request body
      const sendRequest = req.body as SendProposalRequest;
      if (!sendRequest.recipient_user_ids || !Array.isArray(sendRequest.recipient_user_ids)) {
        sendValidationError(res, {
          recipient_user_ids: ['Must provide array of recipient user IDs'],
        });
        return;
      }

      if (sendRequest.recipient_user_ids.length === 0) {
        sendValidationError(res, {
          recipient_user_ids: ['Must have at least 1 recipient'],
        });
        return;
      }

      if (sendRequest.custom_message && sendRequest.custom_message.length > 1000) {
        sendValidationError(res, {
          custom_message: ['Message must be 1000 characters or less'],
        });
        return;
      }

      // 3. Check authentication
      if (!req.user) {
        sendAuthorizationError(res, 'Authentication required');
        return;
      }

      // TODO: Implement actual sending logic:
      // 1. Fetch proposal (verify status = 'draft')
      // 2. Fetch event to verify user is admin
      // 3. Validate all recipient_user_ids exist in event_attendees
      // 4. Send emails via emailService
      // 5. Create proposal_sends record with recipient_list
      // 6. Update proposal status to 'sent'
      // 7. Send admin confirmation email

      // 4. Mock response
      const sendId = 'send-uuid-' + Date.now();
      const response: SendProposalResponse = {
        success: true,
        proposal_id: id,
        send_id: sendId,
        recipients_count: sendRequest.recipient_user_ids.length,
        emails_sent: sendRequest.recipient_user_ids.length,
        failed_emails: [],
        sent_at: new Date().toISOString(),
        message: `Proposal sent to ${sendRequest.recipient_user_ids.length} members`,
      };

      res.status(200).json(response);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  /**
   * GET /api/proposals/:id/sends
   * Fetch send history and recipient status (Story 1.2)
   *
   * Response (200 OK):
   * {
   *   "proposal_id": "uuid",
   *   "sends": [
   *     {
   *       "send_id": "uuid",
   *       "sent_at": "2026-03-03T10:00:00Z",
   *       "sent_by": "admin@example.com",
   *       "recipient_list": [...],
   *       "custom_message": "Please review..."
   *     }
   *   ]
   * }
   *
   * Errors:
   * - 401: Unauthorized
   * - 404: Proposal not found
   * - 500: Server error
   */
  static async getProposalSends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // 1. Validate proposal ID format (UUID)
      if (typeof id !== 'string') {
        sendValidationError(res, { id: ['Invalid proposal ID format'] });
        return;
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        sendValidationError(res, {
          id: ['Invalid proposal ID format (must be UUID)'],
        });
        return;
      }

      // 2. Check authentication
      if (!req.user) {
        sendAuthorizationError(res, 'Authentication required');
        return;
      }

      // TODO: Implement actual fetch logic:
      // 1. Fetch proposal (verify user has access)
      // 2. Fetch all proposal_sends records for this proposal
      // 3. Include recipient_list with status for each send

      // 3. Mock response
      const history: ProposalSendHistory = {
        proposal_id: id,
        sends: [
          {
            id: 'send-uuid-1',
            proposal_id: id,
            sent_at: new Date().toISOString(),
            sent_by: req.user?.id || 'user-id',
            recipient_list: [
              {
                user_id: 'user-uuid-1',
                email: 'member1@example.com',
                name: 'Member One',
                status: 'pending',
                sent_date: new Date().toISOString(),
              },
              {
                user_id: 'user-uuid-2',
                email: 'member2@example.com',
                name: 'Member Two',
                status: 'viewed',
                sent_date: new Date().toISOString(),
              },
            ],
            custom_message: 'Please review by Friday',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };

      res.status(200).json(history);
    } catch (error) {
      sendServerError(res, error);
    }
  }
}
