import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to verify RLS permissions for proposals
 *
 * RLS Policy (Supabase enforces):
 * - User must be authenticated (auth.uid())
 * - User must be admin of the event
 * - Policy: (auth.uid() = created_by AND event.admin_id = auth.uid())
 */

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const verifyAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Extract auth token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Missing authorization token',
    });
  }

  // In production, validate JWT token with Supabase
  // For now, we'll assume token is valid (Supabase will enforce RLS on queries)
  // TODO: Implement JWT validation with Supabase auth

  next();
};

export const verifyEventAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { event_id } = req.body;

  if (!event_id) {
    return res.status(400).json({
      error: 'Bad Request',
      details: 'event_id is required',
    });
  }

  // Verify that current user is admin of the event
  // This will be enforced by Supabase RLS policies on database level
  // At the API level, we just pass the check to Supabase

  next();
};
