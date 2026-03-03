import { describe, test } from 'node:test';
import assert from 'node:assert';
import DOMPurify from 'isomorphic-dompurify';

/**
 * XSS Prevention Tests for Story 1.1
 * Verifies that HTML content is properly sanitized to prevent XSS attacks
 */

describe('XSS Prevention - HTML Sanitization', () => {
  const sanitizeHtml = (html: string): string => {
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 'i', 'b',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      KEEP_CONTENT: true,
    };
    return DOMPurify.sanitize(html, config);
  };

  test('should remove script tags', async () => {
    const malicious = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
    const sanitized = sanitizeHtml(malicious);

    assert.strictEqual(
      sanitized.includes('<script>'),
      false,
      'Script tags should be removed'
    );
    assert.strictEqual(
      sanitized.includes('alert'),
      false,
      'Script content should be removed'
    );
    assert.strictEqual(
      sanitized.includes('<p>Hello</p>'),
      true,
      'Safe content should be preserved'
    );
  });

  test('should remove event handlers', async () => {
    const malicious = '<p onclick="alert(\'XSS\')">Click me</p>';
    const sanitized = sanitizeHtml(malicious);

    assert.strictEqual(
      sanitized.includes('onclick'),
      false,
      'Event handlers should be removed'
    );
    assert.strictEqual(
      sanitized.includes('Click me'),
      true,
      'Text content should be preserved'
    );
  });

  test('should remove img tags with onerror handler', async () => {
    const malicious = '<img src="x" onerror="alert(\'XSS\')">';
    const sanitized = sanitizeHtml(malicious);

    assert.strictEqual(
      sanitized.includes('<img'),
      false,
      'Img tag should be removed (not in allowed tags)'
    );
    assert.strictEqual(
      sanitized.includes('onerror'),
      false,
      'Event handlers should be removed'
    );
  });

  test('should preserve safe links with href', async () => {
    const safe = '<p>Visit <a href="https://example.com" target="_blank">example</a></p>';
    const sanitized = sanitizeHtml(safe);

    assert.strictEqual(
      sanitized.includes('href="https://example.com"'),
      true,
      'Safe href attributes should be preserved'
    );
    assert.strictEqual(
      sanitized.includes('example'),
      true,
      'Link text should be preserved'
    );
  });

  test('should remove javascript: protocol in links', async () => {
    const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
    const sanitized = sanitizeHtml(malicious);

    assert.strictEqual(
      sanitized.includes('javascript:'),
      false,
      'javascript: protocol should be removed'
    );
    assert.strictEqual(
      sanitized.includes('Click'),
      true,
      'Link text should be preserved'
    );
  });

  test('should preserve safe HTML formatting', async () => {
    const safe = `
      <h2>Section Title</h2>
      <p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <blockquote>A famous quote</blockquote>
    `;
    const sanitized = sanitizeHtml(safe);

    assert.strictEqual(
      sanitized.includes('<h2>Section Title</h2>'),
      true,
      'Headers should be preserved'
    );
    assert.strictEqual(
      sanitized.includes('<strong>bold</strong>'),
      true,
      'Bold text should be preserved'
    );
    assert.strictEqual(
      sanitized.includes('<em>italic</em>'),
      true,
      'Italic text should be preserved'
    );
    assert.strictEqual(
      sanitized.includes('<ul>'),
      true,
      'Lists should be preserved'
    );
  });

  test('should handle iframe injection attempts', async () => {
    const malicious = '<p>Content</p><iframe src="https://malicious.com"></iframe>';
    const sanitized = sanitizeHtml(malicious);

    assert.strictEqual(
      sanitized.includes('<iframe'),
      false,
      'Iframe tags should be removed'
    );
    assert.strictEqual(
      sanitized.includes('Content'),
      true,
      'Safe content should be preserved'
    );
  });

  test('should handle style injection attempts', async () => {
    const malicious = '<p style="background-image: url(javascript:alert(\'XSS\'))">Click</p>';
    const sanitized = sanitizeHtml(malicious);

    // Style attribute is not in ALLOWED_ATTR, so it should be removed
    assert.strictEqual(
      sanitized.includes('style='),
      false,
      'Style attributes should be removed'
    );
    assert.strictEqual(
      sanitized.includes('Click'),
      true,
      'Text content should be preserved'
    );
  });

  test('should handle svg injection attempts', async () => {
    const malicious = '<svg><script>alert("XSS")</script></svg>';
    const sanitized = sanitizeHtml(malicious);

    assert.strictEqual(
      sanitized.includes('alert'),
      false,
      'Script content should be removed'
    );
  });

  test('should preserve tables for data display', async () => {
    const safe = `
      <table>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </tbody>
      </table>
    `;
    const sanitized = sanitizeHtml(safe);

    assert.strictEqual(
      sanitized.includes('<table>'),
      true,
      'Tables should be preserved'
    );
    assert.strictEqual(
      sanitized.includes('Header 1'),
      true,
      'Table headers should be preserved'
    );
  });
});
