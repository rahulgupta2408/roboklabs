<?php
/**
 * Robok Labs - Contact form handler
 * Receives POST from /contact/index.html
 * Sends email to info@roboklabs.com
 * Redirects back to /contact?sent=1 (or ?error=xxx)
 *
 * Uses PHP's built-in mail() function which works on
 * every standard cPanel / LiteSpeed hosting account.
 */

// =====================================================
//  CONFIGURATION
// =====================================================
$TO          = 'info@roboklabs.com';
$FROM_LOCAL  = 'no-reply@roboklabs.com';           // must match your own domain
$SITE_NAME   = 'Robok Labs';
$SUCCESS_URL = '/contact?sent=1';
$ERROR_URL   = '/contact?error=';
$LOG_FILE    = __DIR__ . '/contact_submissions.log'; // optional, stores a backup

// =====================================================
//  GUARDS
// =====================================================
// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /contact');
    exit;
}

// Helper: safe redirect with error code
function fail($code) {
    global $ERROR_URL;
    header('Location: ' . $ERROR_URL . urlencode($code));
    exit;
}

// Helper: trim + strip dangerous header chars
function clean($v, $max = 500) {
    $v = (string) $v;
    $v = trim($v);
    $v = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $v); // prevent header injection
    return mb_substr($v, 0, $max);
}

// =====================================================
//  ANTI-SPAM
// =====================================================
// Honeypot: hidden field must be empty
if (!empty($_POST['website'])) {
    // Silently pretend success so bot doesn't retry
    header('Location: ' . $SUCCESS_URL);
    exit;
}

// Timestamp: form must be at least 2 seconds old (bots submit instantly)
$ts = isset($_POST['ts']) ? (int) $_POST['ts'] : 0;
if ($ts > 0) {
    $age_ms = (int) (microtime(true) * 1000) - $ts;
    if ($age_ms < 2000) {
        // Again pretend success to not tip off bots
        header('Location: ' . $SUCCESS_URL);
        exit;
    }
}

// =====================================================
//  VALIDATE INPUT
// =====================================================
$name    = clean($_POST['name']    ?? '', 120);
$company = clean($_POST['company'] ?? '', 120);
$email   = clean($_POST['email']   ?? '', 160);
$phone   = clean($_POST['phone']   ?? '',  40);
$service = clean($_POST['service'] ?? '', 120);
$subject = clean($_POST['subject'] ?? '', 200);
$message = (string) ($_POST['message'] ?? '');

// Normalize message (strip script-like bytes, keep newlines)
$message = str_replace(["\r\n", "\r"], "\n", $message);
$message = mb_substr(trim($message), 0, 4000);

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    fail('missing_fields');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('invalid_email');
}

// =====================================================
//  BUILD EMAIL
// =====================================================
$ip        = $_SERVER['REMOTE_ADDR']     ?? 'unknown';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
$referer   = $_SERVER['HTTP_REFERER']    ?? '';
$date      = date('Y-m-d H:i:s T');

$subject_line = "[" . $SITE_NAME . " Contact] " . $subject;

$body  = "You received a new contact-form submission from roboklabs.com\n";
$body .= "=================================================================\n\n";
$body .= "Name:      " . $name . "\n";
$body .= "Company:   " . ($company !== '' ? $company : '-') . "\n";
$body .= "Email:     " . $email . "\n";
$body .= "Phone:     " . ($phone !== '' ? $phone : '-') . "\n";
$body .= "Service:   " . ($service !== '' ? $service : '-') . "\n";
$body .= "Subject:   " . $subject . "\n";
$body .= "-----------------------------------------------------------------\n";
$body .= "Message:\n\n";
$body .= $message . "\n";
$body .= "-----------------------------------------------------------------\n";
$body .= "Submitted: " . $date . "\n";
$body .= "IP:        " . $ip . "\n";
$body .= "User-Agent:" . $userAgent . "\n";
$body .= "Referer:   " . $referer . "\n";

// Build proper, mime-safe headers
$fromName   = '=?UTF-8?B?' . base64_encode($SITE_NAME . ' Website') . '?=';
$subjectEnc = '=?UTF-8?B?' . base64_encode($subject_line) . '?=';

$headers  = 'From: ' . $fromName . ' <' . $FROM_LOCAL . '>' . "\r\n";
$headers .= 'Reply-To: ' . $name . ' <' . $email . '>' . "\r\n";
$headers .= 'Return-Path: ' . $FROM_LOCAL . "\r\n";
$headers .= 'X-Mailer: PHP/' . phpversion() . "\r\n";
$headers .= 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-Type: text/plain; charset=UTF-8' . "\r\n";
$headers .= 'Content-Transfer-Encoding: 8bit' . "\r\n";

// =====================================================
//  SEND
// =====================================================
$sent = @mail($TO, $subjectEnc, $body, $headers, '-f' . $FROM_LOCAL);

// Log to a local file regardless (useful if mail ever fails)
@file_put_contents(
    $LOG_FILE,
    "[" . $date . "] sent=" . ($sent ? '1' : '0') . " from=" . $email . " subject=" . $subject . "\n",
    FILE_APPEND | LOCK_EX
);

if (!$sent) {
    fail('mail_failed');
}

header('Location: ' . $SUCCESS_URL);
exit;
