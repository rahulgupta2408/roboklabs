<?php
// ===== ROBOK LABS – SMTP CONFIGURATION TEMPLATE =====
// Copy this file to /home/earthlyf/config.php (one level ABOVE the web root)
// and fill in your real credentials.
// config.php is listed in .gitignore and MUST NOT be committed.

// ── SMTP outgoing mail server ─────────────────────────────────────────────────

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

// ── Contact form recipient ────────────────────────────────────────────────────

// Email address that receives contact form submissions (the site owner's inbox)
define('CONTACT_TO', 'info@roboklabs.com');

// Display name for the recipient (can be empty string '')
define('CONTACT_TO_NAME', 'Robok Labs');
