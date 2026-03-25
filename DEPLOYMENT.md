# Deployment Guide – Robok Labs on HostPapa cPanel Shared Hosting

This guide explains how to deploy the Robok Labs website with a working contact form on HostPapa cPanel shared hosting.

---

## Prerequisites

- HostPapa cPanel shared hosting account
- FTP/SFTP access or cPanel File Manager
- A mailbox already created in cPanel (e.g. `info@roboklabs.com`)
- SSH access **or** a way to run PHP Composer on the server (see Step 3)

---

## Step 1 – Upload website files

Upload the entire repository to the `public_html` directory (or your domain's document root) on HostPapa, **excluding** these paths (they are not needed on production):

- `.git/`
- `node_modules/`
- `vendor/` (will be installed in Step 3)
- `.env` (Node only)

Files that **must** be uploaded:

```
contact.php
config.example.php   ← rename / copy as config.php on the server
composer.json
composer.lock        ← generated in Step 3; upload after running
index.html
contact.html
script.js
style.css
(+ all other .html files, images, etc.)
```

> `server.js` can be uploaded too (harmless) but is **not** used on shared hosting.

---

## Step 2 – Create the SMTP mailbox (if not done)

1. Log in to HostPapa cPanel → **Email Accounts**.
2. Create `info@roboklabs.com` (or confirm it already exists).
3. Note the SMTP password you set.

HostPapa's outgoing SMTP settings are:

| Setting | Value |
|---------|-------|
| SMTP host | `mail.roboklabs.com` |
| SMTP port | `465` (SSL/TLS) |
| Username | `info@roboklabs.com` |
| Password | *(the mailbox password)* |

---

## Step 3 – Install PHP dependencies (PHPMailer)

PHPMailer must be installed via [Composer](https://getcomposer.org/).

### Option A – SSH (recommended)

```bash
# Connect via SSH then:
cd ~/public_html          # adjust path to your site root
composer install --no-dev --optimize-autoloader
```

### Option B – cPanel Terminal

cPanel → **Terminal** (if available):

```bash
cd ~/public_html
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --quiet
php composer.phar install --no-dev --optimize-autoloader
rm composer-setup.php composer.phar
```

After this step a `vendor/` directory will appear, containing PHPMailer.

---

## Step 4 – Create `config.php` with SMTP credentials

On the server (via File Manager or SSH), copy the template:

```bash
cp config.example.php config.php
```

Then edit `config.php` and fill in your real credentials:

```php
define('SMTP_HOST', 'mail.roboklabs.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'info@roboklabs.com');
define('SMTP_PASS', 'YOUR-ACTUAL-MAILBOX-PASSWORD');
define('SMTP_FROM', 'info@roboklabs.com');
define('SMTP_FROM_NAME', 'Robok Labs Website');
```

> ⚠️ **Never commit `config.php` to Git.** It is listed in `.gitignore`.

---

## Step 5 – Verify sending

1. Open `https://www.roboklabs.com/contact.html` in a browser.
2. Fill in the form and click **Send Message**.
3. You should see **✓ Message Sent!** and receive the email at both:
   - `info@roboklabs.com`
   - `instatrades2408@gmail.com`

If you see **Send Failed – Try Again**, check the PHP error log in cPanel → **Errors** for details.

---

## Architecture summary

| File | Purpose |
|------|---------|
| `contact.php` | PHP endpoint; validates input, sends via SMTP, returns JSON |
| `config.php` | SMTP credentials (**server-only**, not committed) |
| `config.example.php` | Template committed to Git; fill in and rename to `config.php` |
| `vendor/` | PHPMailer library installed by Composer (**not committed**) |
| `server.js` | Node/Express backend – **for Node hosting only**, not used on HostPapa |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `500` error, "dependencies missing" | `vendor/` not present | Run `composer install` (Step 3) |
| `500` error, "config.php not found" | Config not created | Copy template (Step 4) |
| `500` error, "Failed to send" | Wrong SMTP credentials or port | Double-check `config.php`; check PHP error log |
| Email arrives in spam | Sender domain not in SPF/DKIM | Add SPF record; enable DKIM in cPanel |
