import { z } from 'zod';

// Validation schemas
export const ProposalSectionSchema = z.object({
  section_name: z.string().min(1).max(100, 'Section name max 100 chars'),
  content: z.string().min(1).max(10000, 'Content max 10000 chars'),
  field_type: z.enum(['text', 'number', 'date', 'currency', 'textarea']),
  section_order: z.number().int().positive(),
  is_editable: z.boolean().optional().default(true),
});

export const CreateProposalSchema = z.object({
  event_id: z.string().uuid('Invalid event_id'),
  title: z.string().min(1).max(255, 'Title max 255 chars'),
  description: z.string().max(5000, 'Description max 5000 chars').optional(),
  version: z.number().min(1.0).optional().default(1.0),
  sections: z
    .array(ProposalSectionSchema)
    .min(1, 'At least 1 section required')
    .max(50, 'Max 50 sections per proposal'),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;
export type ProposalSectionInput = z.infer<typeof ProposalSectionSchema>;
