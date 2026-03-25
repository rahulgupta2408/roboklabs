<?php
// ===== ROBOK LABS – CONTACT FORM ENDPOINT =====
// Accepts JSON or form-encoded POST, validates, sanitises, and sends email
// via authenticated SMTP (PHPMailer) to the configured recipients.
// Returns JSON: { ok: true } on success, { ok: false, error: "..." } on failure.

declare(strict_types=1);

// ── PHPMailer autoloader ──────────────────────────────────────────────────────
$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'Server configuration error: dependencies missing. Run composer install.']);
    exit;
}
require_once $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as MailerException;

// ── Load SMTP credentials ─────────────────────────────────────────────────────
// Preferred location: ONE LEVEL ABOVE the web root so it is never web-accessible.
// e.g. /home/earthlyf/config.php  when the site lives at /home/earthlyf/roboklabs.com/
// Falls back to the same directory as this file (for local dev / alternative layouts).
$configFile = dirname(__DIR__) . '/config.php';
if (!file_exists($configFile)) {
    $configFile = __DIR__ . '/config.php';   // fallback: same directory as contact.php
}
if (!file_exists($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'Server configuration error: config.php not found.']);
    exit;
}
require_once $configFile;

// ── Response helper ───────────────────────────────────────────────────────────
header('Content-Type: application/json');

function jsonResponse(bool $ok, string $message = '', int $status = 200): void
{
    http_response_code($status);
    if ($ok) {
        echo json_encode(['ok' => true]);
    } else {
        echo json_encode(['ok' => false, 'error' => $message]);
    }
    exit;
}

// ── Accept POST only ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Method Not Allowed', 405);
}

// ── Parse input (JSON or form-encoded) ───────────────────────────────────────
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $raw   = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        jsonResponse(false, 'Invalid JSON.', 400);
    }
} else {
    $input = $_POST;
}

// ── Extract and trim fields ───────────────────────────────────────────────────
$firstName = trim((string)($input['firstName'] ?? ''));
$lastName  = trim((string)($input['lastName']  ?? ''));
$email     = trim((string)($input['email']     ?? ''));
$phone     = trim((string)($input['phone']     ?? ''));
$company   = trim((string)($input['company']   ?? ''));
$service   = trim((string)($input['service']   ?? ''));
$budget    = trim((string)($input['budget']    ?? ''));
$message   = trim((string)($input['message']   ?? ''));

// ── Validate required fields ──────────────────────────────────────────────────
if (!$firstName || !$lastName || !$email || !$message) {
    jsonResponse(false, 'Required fields are missing.', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, 'Invalid email address.', 400);
}

// ── Sanitise inputs (prevent header injection) ────────────────────────────────
// Strip CR/LF from every field that may appear in mail headers (Subject, From,
// Reply-To, etc.).  Variables are mutated in-place so all subsequent uses are
// already sanitised.
$sanitiseHeader = fn(string $v): string => preg_replace('/[\r\n]+/', ' ', $v);

$firstName = $sanitiseHeader($firstName);
$lastName  = $sanitiseHeader($lastName);
$email     = $sanitiseHeader($email);
$phone     = $sanitiseHeader($phone);
$company   = $sanitiseHeader($company);
$service   = $sanitiseHeader($service);
$budget    = $sanitiseHeader($budget);
// $message intentionally keeps its original newlines for the body; CR-only
// sequences are normalised so no bare CR can appear in the plain-text part.
$messageSafe = str_replace("\r", '', $message);

// HTML-escape values destined for the email body.
$e = fn(string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// ── Build email ───────────────────────────────────────────────────────────────
// At this point $firstName, $lastName, $email, $phone, $company, $service,
// $budget are all header-safe (CR/LF stripped above).
$safeName = $e($firstName) . ' ' . $e($lastName);
// Compose subject using the already-sanitised first/last name variables.
$subject  = 'New Contact Form Submission from ' . $firstName . ' ' . $lastName;

$htmlBody = <<<HTML
<h2 style="color:#003366">New Contact Form Submission – Robok Labs</h2>
<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px">
  <tr style="background:#f2f2f2">
    <td style="padding:8px 14px;font-weight:bold;width:120px">Name</td>
    <td style="padding:8px 14px">{$safeName}</td>
  </tr>
  <tr>
    <td style="padding:8px 14px;font-weight:bold">Email</td>
    <td style="padding:8px 14px"><a href="mailto:{$e($email)}">{$e($email)}</a></td>
  </tr>
  <tr style="background:#f2f2f2">
    <td style="padding:8px 14px;font-weight:bold">Phone</td>
    <td style="padding:8px 14px">{$e($phone ?: '—')}</td>
  </tr>
  <tr>
    <td style="padding:8px 14px;font-weight:bold">Company</td>
    <td style="padding:8px 14px">{$e($company ?: '—')}</td>
  </tr>
  <tr style="background:#f2f2f2">
    <td style="padding:8px 14px;font-weight:bold">Service</td>
    <td style="padding:8px 14px">{$e($service ?: '—')}</td>
  </tr>
  <tr>
    <td style="padding:8px 14px;font-weight:bold">Budget</td>
    <td style="padding:8px 14px">{$e($budget ?: '—')}</td>
  </tr>
  <tr style="background:#f2f2f2">
    <td style="padding:8px 14px;font-weight:bold;vertical-align:top">Message</td>
    <td style="padding:8px 14px;white-space:pre-wrap">{$e($message)}</td>
  </tr>
</table>
HTML;

// ── Send via PHPMailer (SMTP / SSL) ───────────────────────────────────────────
// Determine SMTPSecure mode from port: 465 = implicit SSL, anything else = STARTTLS.
$smtpSecure = (defined('SMTP_PORT') && (int)SMTP_PORT === 465)
    ? PHPMailer::ENCRYPTION_SMTPS
    : PHPMailer::ENCRYPTION_STARTTLS;

try {
    $mail = new PHPMailer(true);   // true = throw exceptions

    // Server settings
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = $smtpSecure;
    $mail->Port       = SMTP_PORT;

    // From / Reply-To
    // $firstName and $lastName are already sanitised (CR/LF stripped).
    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addReplyTo($email, $firstName . ' ' . $lastName);

    // Recipients — driven by config constants so no credentials are hardcoded.
    $mail->addAddress(CONTACT_TO, CONTACT_TO_NAME);

    // Content
    $mail->isHTML(true);
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->Subject = $subject;
    $mail->Body    = $htmlBody;
    $mail->AltBody = "Name: {$firstName} {$lastName}\nEmail: {$email}\nPhone: {$phone}\nCompany: {$company}\nService: {$service}\nBudget: {$budget}\n\nMessage:\n{$messageSafe}";

    $mail->send();

    jsonResponse(true);
} catch (MailerException $ex) {
    error_log('contact.php mailer error: ' . $mail->ErrorInfo);
    jsonResponse(false, 'Failed to send message. Please try again later.', 500);
} catch (\Throwable $ex) {
    error_log('contact.php unexpected error: ' . $ex->getMessage());
    jsonResponse(false, 'Failed to send message. Please try again later.', 500);
}
