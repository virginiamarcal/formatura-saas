import express from 'express';
import { attendeesService } from '../lib/attendees.js';
import { CreateAttendeeSchema, AttendeeListQuerySchema } from '../types/attendee.js';
import type { EventAttendee, AttendeeListResponse } from '../types/attendee.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/events/:eventId/attendees
 * List attendees for an event with pagination, search, and filters
 */
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate query parameters
    const query = AttendeeListQuerySchema.parse(req.query);

    // Get attendees
    const result: AttendeeListResponse = await attendeesService.getEventAttendees(eventId, query);

    res.json(result);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /attendees error:', errorMsg);

    if (errorMsg.includes('Invalid')) {
      return res.status(400).json({ error: 'Bad Request', message: errorMsg });
    }

    res.status(500).json({ error: 'Internal Server Error', message: errorMsg });
  }
});

/**
 * GET /api/events/:eventId/attendees/:userId
 * Get a specific attendee
 */
router.get('/:userId', async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const attendee: EventAttendee | null = await attendeesService.getAttendee(eventId, userId);

    if (!attendee) {
      return res.status(404).json({ error: 'Not Found', message: 'Attendee not found' });
    }

    res.json(attendee);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /attendees/:userId error:', errorMsg);
    res.status(500).json({ error: 'Internal Server Error', message: errorMsg });
  }
});

/**
 * POST /api/events/:eventId/attendees
 * Add new attendee to event
 */
router.post('/', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate request body
    const attendeeData = CreateAttendeeSchema.parse(req.body);

    // Add attendee
    const attendee: EventAttendee = await attendeesService.addAttendee(eventId, attendeeData);

    res.status(201).json(attendee);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /attendees error:', errorMsg);

    if (errorMsg.includes('Invalid') || errorMsg.includes('already exists')) {
      return res.status(400).json({ error: 'Bad Request', message: errorMsg });
    }

    res.status(500).json({ error: 'Internal Server Error', message: errorMsg });
  }
});

/**
 * DELETE /api/events/:eventId/attendees/:userId
 * Remove attendee from event
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const success = await attendeesService.removeAttendee(eventId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Not Found', message: 'Attendee not found' });
    }

    res.json({ success: true, message: 'Attendee removed' });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('DELETE /attendees/:userId error:', errorMsg);
    res.status(500).json({ error: 'Internal Server Error', message: errorMsg });
  }
});

/**
 * GET /api/events/:eventId/attendees/search
 * Search attendees by name or email
 */
router.get('/search/:term', async (req, res) => {
  try {
    const { eventId, term } = req.params;

    const attendees = await attendeesService.searchAttendees(eventId, term);

    res.json({ results: attendees, count: attendees.length });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /attendees/search/:term error:', errorMsg);
    res.status(500).json({ error: 'Internal Server Error', message: errorMsg });
  }
});

/**
 * GET /api/events/:eventId/attendees/stats
 * Get attendee statistics by status
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { eventId } = req.params;

    const stats = await attendeesService.getAttendeeStats(eventId);

    res.json({ event_id: eventId, stats });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /attendees/stats error:', errorMsg);
    res.status(500).json({ error: 'Internal Server Error', message: errorMsg });
  }
});

export default router;
