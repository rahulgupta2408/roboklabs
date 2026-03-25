// ===== ROBOK LABS – Contact API Tests =====
// Run with: node --test server.test.js
'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http   = require('node:http');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Make a lightweight JSON POST to the running test server.
 */
function jsonPost(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const { hostname, port, pathname } = new URL(url);
    const req = http.request(
      { hostname, port, path: pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json',
                   'Content-Length': Buffer.byteLength(payload) } },
      (res) => {
        let raw = '';
        res.on('data', d => { raw += d; });
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Stub nodemailer so no real SMTP calls are made ────────────────────────────

const sentMessages = [];

// Override require('nodemailer') before loading server.js
const Module = require('module');
const _origLoad = Module._load.bind(Module);
Module._load = function (request, parent, isMain) {
  if (request === 'nodemailer') {
    return {
      createTransport: () => ({
        sendMail: (opts) => {
          sentMessages.push(opts);
          return Promise.resolve({ messageId: 'stub-id' });
        },
      }),
    };
  }
  return _origLoad(request, parent, isMain);
};

// ── Load server under test ────────────────────────────────────────────────────

const { app, RECIPIENTS } = require('./server.js');

// ── Test suite ────────────────────────────────────────────────────────────────

describe('Contact form API', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Set stub SMTP credentials so the credential check passes in all tests.
    // The nodemailer transport is already mocked above; these values are never
    // used to make a real SMTP connection.
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'test-password';

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  });

  // ── Recipient configuration ────────────────────────────────────────────────

  test('RECIPIENTS list contains info@roboklabs.com', () => {
    assert.ok(
      RECIPIENTS.includes('info@roboklabs.com'),
      `Expected RECIPIENTS to include info@roboklabs.com, got: ${RECIPIENTS}`
    );
  });

  test('RECIPIENTS list contains instatrades2408@gmail.com', () => {
    assert.ok(
      RECIPIENTS.includes('instatrades2408@gmail.com'),
      `Expected RECIPIENTS to include instatrades2408@gmail.com, got: ${RECIPIENTS}`
    );
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  test('POST /api/contact returns 503 when SMTP credentials are not configured', async () => {
    // Temporarily remove SMTP credentials to simulate an unconfigured server.
    const savedUser = process.env.SMTP_USER;
    const savedPass = process.env.SMTP_PASS;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    try {
      const { status, body } = await jsonPost(`${baseUrl}/api/contact`, {
        firstName: 'John', lastName: 'Doe', email: 'john@example.com',
        message: 'Hello from the test suite.',
      });
      assert.equal(status, 503);
      assert.equal(body.ok, false);
      assert.ok(typeof body.error === 'string' && body.error.length > 0,
        `Response should include a non-empty error string, got: ${JSON.stringify(body.error)}`);
      assert.ok(
        body.error.toLowerCase().includes('unavailable') || body.error.toLowerCase().includes('service'),
        `Error message should indicate the service is unavailable, got: ${body.error}`,
      );
    } finally {
      // Always restore the credentials so subsequent tests are unaffected.
      process.env.SMTP_USER = savedUser;
      process.env.SMTP_PASS = savedPass;
    }
  });

  test('POST /api/contact returns 400 when required fields are missing', async () => {
    const { status, body } = await jsonPost(`${baseUrl}/api/contact`, {
      firstName: '', lastName: '', email: '', message: '',
    });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
  });

  test('POST /api/contact returns 400 when email is missing', async () => {
    const { status, body } = await jsonPost(`${baseUrl}/api/contact`, {
      firstName: 'John', lastName: 'Doe', email: '', message: 'Hello',
    });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
  });

  // ── Successful submission ──────────────────────────────────────────────────

  test('POST /api/contact returns 200 with valid payload', async () => {
    sentMessages.length = 0;   // reset stub capture

    const { status, body } = await jsonPost(`${baseUrl}/api/contact`, {
      firstName: 'Jane',
      lastName:  'Smith',
      email:     'jane@example.com',
      phone:     '+1 416 000 0000',
      company:   'ACME Corp',
      service:   'Firmware Development',
      budget:    '$10,000 – $50,000',
      message:   'We need help with our firmware.',
    });

    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  test('Email is sent to BOTH info@roboklabs.com AND instatrades2408@gmail.com', async () => {
    sentMessages.length = 0;

    await jsonPost(`${baseUrl}/api/contact`, {
      firstName: 'Jane',
      lastName:  'Smith',
      email:     'jane@example.com',
      message:   'Test message for dual recipient check.',
    });

    assert.equal(sentMessages.length, 1, 'Exactly one sendMail call should be made');

    const { to } = sentMessages[0];
    assert.ok(
      to.includes('info@roboklabs.com'),
      `Expected "to" to contain info@roboklabs.com, got: ${to}`
    );
    assert.ok(
      to.includes('instatrades2408@gmail.com'),
      `Expected "to" to contain instatrades2408@gmail.com, got: ${to}`
    );
  });

  test('Email subject contains the sender name', async () => {
    sentMessages.length = 0;

    await jsonPost(`${baseUrl}/api/contact`, {
      firstName: 'Alice',
      lastName:  'Wonder',
      email:     'alice@example.com',
      message:   'Hello from Alice.',
    });

    assert.ok(
      sentMessages[0].subject.includes('Alice Wonder'),
      `Subject should include sender name, got: ${sentMessages[0].subject}`
    );
  });

  test('ReplyTo header is set to the sender email', async () => {
    sentMessages.length = 0;

    await jsonPost(`${baseUrl}/api/contact`, {
      firstName: 'Bob',
      lastName:  'Builder',
      email:     'bob@builder.com',
      message:   'Can we fix it?',
    });

    assert.equal(
      sentMessages[0].replyTo,
      'bob@builder.com',
      'replyTo should be set to the senders email address'
    );
  });

  // ── /contact.php alias (used by script.js) ─────────────────────────────────

  test('POST /contact.php returns 400 when required fields are missing', async () => {
    const { status, body } = await jsonPost(`${baseUrl}/contact.php`, {
      firstName: '', lastName: '', email: '', message: '',
    });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
  });

  test('POST /contact.php returns 200 with valid payload', async () => {
    sentMessages.length = 0;

    const { status, body } = await jsonPost(`${baseUrl}/contact.php`, {
      firstName: 'Jane',
      lastName:  'Smith',
      email:     'jane@example.com',
      message:   'Testing the PHP-compatible alias route.',
    });

    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  test('POST /contact.php sends email to both recipients', async () => {
    sentMessages.length = 0;

    await jsonPost(`${baseUrl}/contact.php`, {
      firstName: 'Jane',
      lastName:  'Smith',
      email:     'jane@example.com',
      message:   'Alias route dual-recipient check.',
    });

    assert.equal(sentMessages.length, 1, 'Exactly one sendMail call should be made');
    const { to } = sentMessages[0];
    assert.ok(to.includes('info@roboklabs.com'), `Expected to include info@roboklabs.com, got: ${to}`);
    assert.ok(to.includes('instatrades2408@gmail.com'), `Expected to include instatrades2408@gmail.com, got: ${to}`);
  });
});
