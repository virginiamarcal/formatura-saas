import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CreateProposalSchema } from '../src/db/schema.js';
import { ProposalController } from '../src/controllers/proposalController.js';

// Mock Express request/response
const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  headers: { authorization: 'Bearer token' },
  ...overrides,
});

const createMockResponse = () => {
  const res: any = {
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    json: function (data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

describe('Proposal Validation Tests', () => {
  describe('CreateProposalSchema', () => {
    test('should accept valid proposal with all fields', () => {
      const validProposal = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Annual Gala Proposal',
        description: 'Proposal for the 2026 Annual Gala',
        version: 1.0,
        sections: [
          {
            section_name: 'Event Overview',
            content: '<p>Event details here...</p>',
            field_type: 'text',
            section_order: 1,
          },
        ],
      };

      const result = CreateProposalSchema.safeParse(validProposal);
      assert.strictEqual(result.success, true, 'Valid proposal should pass validation');
    });

    test('should accept proposal without optional fields', () => {
      const minimalProposal = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Simple Proposal',
        sections: [
          {
            section_name: 'Content',
            content: 'Basic content',
            field_type: 'text',
            section_order: 1,
          },
        ],
      };

      const result = CreateProposalSchema.safeParse(minimalProposal);
      assert.strictEqual(result.success, true, 'Minimal proposal should pass validation');
    });

    test('should reject proposal without title', () => {
      const missingTitle = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        sections: [
          {
            section_name: 'Content',
            content: 'Content',
            field_type: 'text',
            section_order: 1,
          },
        ],
      };

      const result = CreateProposalSchema.safeParse(missingTitle);
      assert.strictEqual(result.success, false, 'Proposal without title should fail');
    });

    test('should reject proposal without event_id', () => {
      const missingEventId = {
        title: 'Proposal',
        sections: [
          {
            section_name: 'Content',
            content: 'Content',
            field_type: 'text',
            section_order: 1,
          },
        ],
      };

      const result = CreateProposalSchema.safeParse(missingEventId);
      assert.strictEqual(result.success, false, 'Proposal without event_id should fail');
    });

    test('should reject proposal with invalid event_id (not UUID)', () => {
      const invalidEventId = {
        event_id: 'not-a-uuid',
        title: 'Proposal',
        sections: [
          {
            section_name: 'Content',
            content: 'Content',
            field_type: 'text',
            section_order: 1,
          },
        ],
      };

      const result = CreateProposalSchema.safeParse(invalidEventId);
      assert.strictEqual(result.success, false, 'Invalid UUID should fail validation');
    });

    test('should reject proposal with title > 255 chars', () => {
      const longTitle = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'a'.repeat(256),
        sections: [
          {
            section_name: 'Content',
            content: 'Content',
            field_type: 'text',
            section_order: 1,
          },
        ],
      };

      const result = CreateProposalSchema.safeParse(longTitle);
      assert.strictEqual(result.success, false, 'Title > 255 chars should fail');
    });

    test('should reject proposal without sections', () => {
      const noSections = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Proposal',
        sections: [],
      };

      const result = CreateProposalSchema.safeParse(noSections);
      assert.strictEqual(result.success, false, 'Proposal without sections should fail');
    });

    test('should reject proposal with invalid field_type', () => {
      const invalidFieldType = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Proposal',
        sections: [
          {
            section_name: 'Content',
            content: 'Content',
            field_type: 'invalid_type',
            section_order: 1,
          },
        ],
      };

      const result = CreateProposalSchema.safeParse(invalidFieldType);
      assert.strictEqual(result.success, false, 'Invalid field_type should fail');
    });

    test('should accept proposal with 50 sections (max)', () => {
      const sections = Array.from({ length: 50 }, (_, i) => ({
        section_name: `Section ${i + 1}`,
        content: `Content ${i + 1}`,
        field_type: 'text' as const,
        section_order: i + 1,
      }));

      const proposal = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Big Proposal',
        sections,
      };

      const result = CreateProposalSchema.safeParse(proposal);
      assert.strictEqual(result.success, true, '50 sections should pass');
    });

    test('should reject proposal with > 50 sections', () => {
      const sections = Array.from({ length: 51 }, (_, i) => ({
        section_name: `Section ${i + 1}`,
        content: `Content ${i + 1}`,
        field_type: 'text' as const,
        section_order: i + 1,
      }));

      const proposal = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Too Many Sections',
        sections,
      };

      const result = CreateProposalSchema.safeParse(proposal);
      assert.strictEqual(result.success, false, '> 50 sections should fail');
    });
  });

  describe('GET /api/proposals/:id Endpoint', () => {
    test('should reject invalid proposal ID (not UUID)', async () => {
      const req = createMockRequest({
        params: { id: 'invalid-id' },
      });
      const res = createMockResponse();

      await ProposalController.getProposal(req as any, res, () => {});

      assert.strictEqual(res.statusCode, 400, 'Should return 400 for invalid ID');
      assert.match(res.jsonData.error, /Validation Error/, 'Error message should be Validation Error');
    });

    test('should accept valid UUID format', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const req = createMockRequest({
        params: { id: validUUID },
      });
      const res = createMockResponse();

      await ProposalController.getProposal(req as any, res, () => {});

      assert.strictEqual(res.statusCode, 200, 'Should return 200 for valid UUID');
      assert.strictEqual(res.jsonData.id, validUUID, 'Response should contain correct ID');
    });

    test('should return proposal with sections', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const req = createMockRequest({
        params: { id: validUUID },
      });
      const res = createMockResponse();

      await ProposalController.getProposal(req as any, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert(Array.isArray(res.jsonData.sections), 'Response should have sections array');
      assert(res.jsonData.sections.length > 0, 'Sections should not be empty');
    });

    test('should include required proposal fields', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const req = createMockRequest({
        params: { id: validUUID },
      });
      const res = createMockResponse();

      await ProposalController.getProposal(req as any, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.match(res.jsonData.id, /^[0-9a-f-]+$/, 'Should have UUID id');
      assert.strictEqual(typeof res.jsonData.title, 'string', 'Should have title');
      assert.strictEqual(typeof res.jsonData.status, 'string', 'Should have status');
      assert(res.jsonData.created_at, 'Should have created_at timestamp');
      assert(res.jsonData.updated_at, 'Should have updated_at timestamp');
    });

    test('should reject UUID with incorrect format (wrong length)', async () => {
      const invalidUUID = '550e8400-e29b-41d4-a716'; // Too short
      const req = createMockRequest({
        params: { id: invalidUUID },
      });
      const res = createMockResponse();

      await ProposalController.getProposal(req as any, res, () => {});

      assert.strictEqual(res.statusCode, 400, 'Should reject malformed UUID');
    });

    test('should handle server errors gracefully', async () => {
      // Create a request that might cause an error
      const req = createMockRequest({
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
      const res = createMockResponse();

      // This should not throw
      await assert.doesNotReject(
        () => ProposalController.getProposal(req as any, res, () => {}),
        'Should handle errors gracefully'
      );
    });
  });
});
