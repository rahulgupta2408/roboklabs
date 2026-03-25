<?php
// ===== ROBOK LABS – SMTP CONFIGURATION TEMPLATE =====
// Copy this file to config.php and fill in real credentials.
// config.php is listed in .gitignore and MUST NOT be committed.

// SMTP hostname provided by HostPapa (e.g. mail.yourdomain.com)
define('SMTP_HOST', 'mail.roboklabs.com');

// SMTP port: 465 for implicit SSL, 587 for STARTTLS
define('SMTP_PORT', 465);

// SMTP username – usually the full email address
define('SMTP_USER', 'info@roboklabs.com');

// SMTP password for the mailbox above
define('SMTP_PASS', 'your-smtp-password-here');

// The "From" address shown in outgoing mail (must match SMTP_USER on most hosts)
define('SMTP_FROM', 'info@roboklabs.com');

// Display name shown alongside the From address
define('SMTP_FROM_NAME', 'Robok Labs Website');

// ── Contact-form recipient settings ──────────────────────────────────────────

// Primary recipient for contact-form submissions (REQUIRED)
define('CONTACT_TO',      'info@roboklabs.com');

// Display name for the primary recipient (optional, can be empty string)
define('CONTACT_TO_NAME', 'Robok Labs');

// Additional To recipients – comma-separated list of email addresses (optional).
// These are added alongside CONTACT_TO; they do not replace it.
// Example: 'sales@roboklabs.com,support@roboklabs.com'
// define('CONTACT_TO_LIST', '');

// CC recipients – comma-separated list of email addresses (optional)
// define('CONTACT_CC', '');

// BCC recipients – comma-separated list of email addresses (optional)
// define('CONTACT_BCC', '');
