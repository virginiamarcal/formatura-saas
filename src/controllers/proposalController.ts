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
import type { Proposal, ProposalResponse } from '../types/proposal.js';

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
}
