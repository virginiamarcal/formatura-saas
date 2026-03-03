import { Router } from 'express';
import { ProposalController } from '../controllers/proposalController.js';
import { verifyAuth, verifyEventAdmin } from '../middleware/proposalAuth.js';

const router = Router();

/**
 * POST /api/proposals
 * Create a new proposal template
 *
 * Request body:
 * {
 *   "event_id": "uuid",
 *   "title": "Proposal Title",
 *   "description": "Optional description",
 *   "version": 1.0,
 *   "sections": [
 *     {
 *       "section_name": "Section 1",
 *       "content": "<p>HTML content</p>",
 *       "field_type": "text",
 *       "section_order": 1
 *     }
 *   ]
 * }
 *
 * Responses:
 * - 201: Proposal created successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not event admin)
 * - 409: Event not found
 * - 500: Server error
 */
router.post('/', verifyAuth, verifyEventAdmin, ProposalController.createProposal);

/**
 * GET /api/proposals/:id
 * Fetch a single proposal with all sections
 *
 * Responses:
 * - 200: Proposal found
 * - 401: Unauthorized
 * - 404: Proposal not found
 * - 500: Server error
 */
router.get('/:id', verifyAuth, ProposalController.getProposal);

/**
 * POST /api/proposals/:id/send
 * Send a proposal to committee members (Story 1.2)
 *
 * Request body:
 * {
 *   "recipient_user_ids": ["uuid1", "uuid2"],
 *   "custom_message": "Optional message"
 * }
 *
 * Responses:
 * - 200: Proposal sent successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not event admin)
 * - 404: Proposal not found
 * - 500: Server error
 */
router.post('/:id/send', verifyAuth, verifyEventAdmin, ProposalController.sendProposal);

/**
 * GET /api/proposals/:id/sends
 * Fetch send history and recipient status (Story 1.2)
 *
 * Responses:
 * - 200: Send history retrieved
 * - 401: Unauthorized
 * - 404: Proposal not found
 * - 500: Server error
 */
router.get('/:id/sends', verifyAuth, ProposalController.getProposalSends);

export default router;
