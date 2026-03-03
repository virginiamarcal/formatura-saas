import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface EmailTemplateData {
  to: string[];
  template: string;
  variables: Record<string, unknown>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BatchSendResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * EmailService - Abstracts email sending across different providers
 * Currently supports Supabase Email
 */
class EmailService {
  private supabase;
  private fromEmail: string;
  private fromName: string;
  private templatesDir: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@formatura-app.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Formatura App';
    this.templatesDir = path.join(process.cwd(), 'src', 'lib', 'emailTemplates');
  }

  /**
   * Send a simple email
   */
  async send(options: EmailOptions): Promise<SendResult> {
    try {
      this.validateEmailOptions(options);

      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      const from = options.from || `${this.fromName} <${this.fromEmail}>`;

      // For Supabase, we'll use the functions API or direct implementation
      // This is a placeholder - actual implementation depends on Supabase auth setup
      const result = await this.sendViaSupabase({
        to: toAddresses,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from,
        replyTo: options.replyTo,
      });

      this.log('email_sent', { to: toAddresses, subject: options.subject, success: true });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log('email_failed', { to: options.to, subject: options.subject, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send email from template with variable substitution
   */
  async sendTemplate(templateName: string, data: EmailTemplateData): Promise<BatchSendResult> {
    const results: BatchSendResult = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [],
    };

    try {
      const templateContent = this.loadTemplate(`${templateName}.html`);
      const templateText = this.loadTemplate(`${templateName}.txt`).catch(() => ''); // Text is optional

      for (const recipient of data.to) {
        try {
          const html = this.renderTemplate(templateContent, { ...data.variables, recipient });
          const text = await templateText.then((t) => this.renderTemplate(t, { ...data.variables, recipient })).catch(() => '');

          const result = await this.send({
            to: recipient,
            subject: this.renderTemplate(data.variables.subject as string, data.variables),
            html,
            text: text || undefined,
          });

          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`${recipient}: ${result.error}`);
            results.success = false;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`${recipient}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.success = false;
        }
      }

      this.log('batch_email_sent', { template: templateName, sent: results.sent, failed: results.failed });
      return results;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log('batch_email_failed', { template: templateName, error: errorMsg });
      return {
        success: false,
        sent: 0,
        failed: data.to.length,
        errors: [errorMsg],
      };
    }
  }

  /**
   * Load template file from emailTemplates directory
   */
  private loadTemplate(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.templatesDir, filename);
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(new Error(`Template not found: ${filename}`));
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Render template with variable substitution
   * Supports {{variable}} syntax
   */
  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    return rendered;
  }

  /**
   * Send via Supabase (placeholder - actual implementation depends on setup)
   */
  private async sendViaSupabase(options: any): Promise<SendResult> {
    // This is a placeholder implementation
    // In production, you would either:
    // 1. Use Supabase Functions (serverless)
    // 2. Use Supabase Realtime + external email service
    // 3. Use a third-party integration

    // For now, we'll simulate with logging
    this.log('supabase_email_queued', options);

    // Return success with simulated message ID
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Validate email options
   */
  private validateEmailOptions(options: EmailOptions): void {
    if (!options.to) {
      throw new Error('Email recipient (to) is required');
    }

    if (!options.subject) {
      throw new Error('Email subject is required');
    }

    if (!options.html && !options.text) {
      throw new Error('Email must have either html or text content');
    }

    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    for (const email of toAddresses) {
      if (!this.isValidEmail(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Log email activity
   */
  private log(action: string, details: unknown): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] EMAIL_SERVICE - ${action}:`, JSON.stringify(details));
  }
}

// Export singleton instance
export const emailService = new EmailService();
export type { EmailOptions, EmailTemplateData, SendResult, BatchSendResult };
