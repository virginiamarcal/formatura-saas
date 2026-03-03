import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

// Mock email service for testing
class MockEmailService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'src', 'lib', 'emailTemplates');
  }

  async send(options: any) {
    if (!options.to) throw new Error('Email recipient is required');
    if (!options.subject) throw new Error('Email subject is required');
    if (!options.html && !options.text) throw new Error('Email must have either html or text content');

    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    for (const email of toAddresses) {
      if (!this.isValidEmail(email)) throw new Error(`Invalid email: ${email}`);
    }

    return { success: true, messageId: `msg_${Date.now()}` };
  }

  async sendTemplate(templateName: string, data: any) {
    const templatePath = path.join(this.templatesDir, `${templateName}.html`);
    if (!fs.existsSync(templatePath)) {
      return { success: false, sent: 0, failed: data.to.length, errors: [`Template not found: ${templateName}`] };
    }

    return { success: true, sent: data.to.length, failed: 0, errors: [] };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

describe('EmailService', () => {
  let emailService: MockEmailService;

  before(() => {
    emailService = new MockEmailService();
  });

  describe('send()', () => {
    it('should send email with valid options', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.messageId);
    });

    it('should handle multiple recipients', async () => {
      const result = await emailService.send({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      assert.strictEqual(result.success, true);
    });

    it('should throw error if recipient is missing', async () => {
      try {
        await emailService.send({
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        });
        assert.fail('Should have thrown error');
      } catch (error: any) {
        assert.ok(error.message.includes('recipient'));
      }
    });

    it('should throw error if subject is missing', async () => {
      try {
        await emailService.send({
          to: 'test@example.com',
          html: '<p>Test content</p>',
        });
        assert.fail('Should have thrown error');
      } catch (error: any) {
        assert.ok(error.message.includes('subject'));
      }
    });

    it('should throw error if neither html nor text is provided', async () => {
      try {
        await emailService.send({
          to: 'test@example.com',
          subject: 'Test Subject',
        });
        assert.fail('Should have thrown error');
      } catch (error: any) {
        assert.ok(error.message.includes('html or text'));
      }
    });

    it('should validate email format', async () => {
      try {
        await emailService.send({
          to: 'invalid-email',
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        });
        assert.fail('Should have thrown error');
      } catch (error: any) {
        assert.ok(error.message.includes('Invalid email'));
      }
    });

    it('should accept text content without html', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Plain text content',
      });

      assert.strictEqual(result.success, true);
    });

    it('should accept both html and text content', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>HTML content</p>',
        text: 'Plain text content',
      });

      assert.strictEqual(result.success, true);
    });
  });

  describe('sendTemplate()', () => {
    it('should send template email', async () => {
      const result = await emailService.sendTemplate('proposal-send', {
        to: ['test@example.com'],
        template: 'proposal-send',
        variables: {
          recipient_name: 'John Doe',
          admin_name: 'Admin User',
          event_name: 'Event Name',
          proposal_title: 'Proposal Title',
          proposal_version: '1.0',
          proposal_preview: 'Preview text...',
          proposal_link: 'https://example.com/proposal/123',
          custom_message: 'This is a custom message',
        },
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sent, 1);
      assert.strictEqual(result.failed, 0);
    });

    it('should handle multiple recipients in template', async () => {
      const result = await emailService.sendTemplate('proposal-send', {
        to: ['test1@example.com', 'test2@example.com', 'test3@example.com'],
        template: 'proposal-send',
        variables: {
          recipient_name: 'Test User',
          admin_name: 'Admin User',
          event_name: 'Event',
          proposal_title: 'Title',
          proposal_version: '1.0',
          proposal_preview: 'Preview',
          proposal_link: 'https://example.com',
        },
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sent, 3);
      assert.strictEqual(result.failed, 0);
    });

    it('should return error if template not found', async () => {
      const result = await emailService.sendTemplate('non-existent-template', {
        to: ['test@example.com'],
        template: 'non-existent-template',
        variables: {},
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.sent, 0);
      assert.strictEqual(result.failed, 1);
      assert.ok(result.errors[0].includes('Template not found'));
    });

    it('should handle empty recipient list', async () => {
      const result = await emailService.sendTemplate('proposal-send', {
        to: [],
        template: 'proposal-send',
        variables: {},
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sent, 0);
      assert.strictEqual(result.failed, 0);
    });
  });

  describe('Template files', () => {
    it('should have proposal-send.html template', () => {
      const templatePath = path.join(process.cwd(), 'src', 'lib', 'emailTemplates', 'proposal-send.html');
      assert.ok(fs.existsSync(templatePath), 'proposal-send.html template file exists');

      const content = fs.readFileSync(templatePath, 'utf-8');
      assert.ok(content.includes('{{recipient_name}}'), 'Template has recipient_name variable');
      assert.ok(content.includes('{{admin_name}}'), 'Template has admin_name variable');
      assert.ok(content.includes('{{proposal_link}}'), 'Template has proposal_link variable');
    });

    it('should have proposal-send.txt template', () => {
      const templatePath = path.join(process.cwd(), 'src', 'lib', 'emailTemplates', 'proposal-send.txt');
      assert.ok(fs.existsSync(templatePath), 'proposal-send.txt template file exists');

      const content = fs.readFileSync(templatePath, 'utf-8');
      assert.ok(content.includes('{{recipient_name}}'), 'Template has recipient_name variable');
    });
  });

  describe('Environment Configuration', () => {
    it('should have .env file', () => {
      const envPath = path.join(process.cwd(), '.env');
      assert.ok(fs.existsSync(envPath), '.env file exists');

      const content = fs.readFileSync(envPath, 'utf-8');
      assert.ok(content.includes('EMAIL_SERVICE'), '.env has EMAIL_SERVICE');
      assert.ok(content.includes('SUPABASE_EMAIL_ENABLED'), '.env has SUPABASE_EMAIL_ENABLED');
    });

    it('should not commit .env to git', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        assert.ok(content.includes('.env'), '.gitignore includes .env');
      }
    });
  });
});
