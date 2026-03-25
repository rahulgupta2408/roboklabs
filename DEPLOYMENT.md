# Deployment Guide – Robok Labs on HostPapa cPanel Shared Hosting

This guide explains how to deploy the Robok Labs website with a working contact form on HostPapa cPanel shared hosting.

Your site root on HostPapa is: **`/home/earthlyf/roboklabs.com/`**

---

## Prerequisites

- HostPapa cPanel account for `roboklabs.com`
- FTP/SFTP access **or** cPanel File Manager
- A mailbox already created in cPanel (e.g. `info@roboklabs.com`)
- SSH or cPanel Terminal (for Composer — see Step 3)

---

## Step 1 – Upload website files

Upload the repository contents into **`/home/earthlyf/roboklabs.com/`** (your domain's document root), **excluding**:

- `.git/`
- `node_modules/`
- `vendor/` (installed in Step 3)
- `.env` (Node only)

Files that **must** be uploaded:

```
contact.php
config.example.php
composer.json
.htaccess
index.html
contact.html
script.js
style.css
(+ all other .html / image files)
```

> `server.js` can be uploaded too but is **not** used on shared hosting.

---

## Step 2 – Create the SMTP mailbox (if not done)

1. cPanel → **Email Accounts** → create `info@roboklabs.com`.
2. Note the password you set.

Your HostPapa outgoing SMTP settings:

| Setting   | Value                  |
|-----------|------------------------|
| SMTP host | `mail.roboklabs.com`   |
| SMTP port | `465` (implicit SSL)   |
| Username  | `info@roboklabs.com`   |
| Password  | *(your mailbox password)* |

---

## Step 3 – Install PHP dependencies (PHPMailer)

PHPMailer is installed via [Composer](https://getcomposer.org/).

### Option A – SSH (recommended)

```bash
cd ~/roboklabs.com
composer install --no-dev --optimize-autoloader
```

### Option B – cPanel Terminal

cPanel → **Terminal**:

```bash
cd ~/roboklabs.com
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --quiet
php composer.phar install --no-dev --optimize-autoloader
rm composer-setup.php composer.phar
```

A `vendor/` directory will appear inside `~/roboklabs.com/` containing PHPMailer.

---

## Step 4 – Create `config.php` with your SMTP credentials (private, outside the web root)

> **Why outside the web root?**  
> Your web root is `/home/earthlyf/roboklabs.com/`. Any file inside it *could* theoretically be served over HTTP. Placing `config.php` one level up — at `/home/earthlyf/config.php` — makes it completely inaccessible from the internet, no matter what. Think of it like the keychain on your iPhone: it holds your credentials privately and nothing external can read it directly.

### Create the private config file

**Via SSH:**

```bash
cp ~/roboklabs.com/config.example.php ~/config.php
nano ~/config.php          # or use any editor
```

**Via cPanel File Manager:**

1. Navigate to `/home/earthlyf/` (one level *above* `roboklabs.com/`).
2. Click **+ File** → name it `config.php`.
3. Right-click → **Edit** and paste the following:

```php
<?php
define('SMTP_HOST',      'mail.roboklabs.com');
define('SMTP_PORT',      465);
define('SMTP_USER',      'info@roboklabs.com');
define('SMTP_PASS',      'YOUR-ACTUAL-MAILBOX-PASSWORD');   // ← only thing to change
define('SMTP_FROM',      'info@roboklabs.com');
define('SMTP_FROM_NAME', 'Robok Labs Website');
define('CONTACT_TO',     'instatrades2408@gmail.com,info@roboklabs.com');
define('CONTACT_TO_NAME','Robok Labs');
```

4. Save. The file now lives at `/home/earthlyf/config.php` — above the web root and completely private.

> ⚠️ **Never commit `config.php` to Git.** It is listed in `.gitignore`.  
> ⚠️ The `.htaccess` in your web root also blocks HTTP access to any `config.php` that might accidentally end up there.

---

## Step 5 – Verify sending

1. Open `https://www.roboklabs.com/contact.html`.
2. Fill in the form and click **Send Message**.
3. You should see **✓ Message Sent!** and receive emails at:
   - `info@roboklabs.com`
   - `instatrades2408@gmail.com`

If you see **Send Failed – Try Again**, check cPanel → **Errors** (PHP error log) for details.

---

## File layout on the server

```
/home/earthlyf/
│
├── config.php              ← YOUR PRIVATE CREDENTIALS (above web root, not in Git)
│
└── roboklabs.com/          ← web root (everything here is potentially web-accessible)
    ├── .htaccess           ← blocks direct access to config.php / vendor / etc.
    ├── contact.php         ← PHP email endpoint
    ├── config.example.php  ← credential template (no real passwords)
    ├── composer.json
    ├── vendor/             ← PHPMailer (installed by Composer, not in Git)
    ├── index.html
    ├── contact.html
    ├── script.js
    └── style.css
```

`contact.php` automatically looks for your config at `/home/earthlyf/config.php` first, then falls back to the same directory as itself if needed.

---

## Architecture summary

| File | Purpose |
|------|---------|
| `/home/earthlyf/config.php` | SMTP credentials — **private, above web root** |
| `contact.php` | PHP endpoint: validates, sends via SMTP, returns JSON |
| `config.example.php` | Credential template (committed to Git, no real passwords) |
| `.htaccess` | Blocks browser access to config / vendor files |
| `vendor/` | PHPMailer library (installed by Composer, not committed) |
| `server.js` | Node/Express backend — **for Node hosting only**, not used here |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `500` "dependencies missing" | `vendor/` not present | Run `composer install` in `~/roboklabs.com/` |
| `500` "config.php not found" | Config not created | Create `~/config.php` (Step 4) |
| `500` "Failed to send" | Wrong SMTP credentials or port | Double-check `~/config.php`; check PHP error log |
| Email arrives in spam | SPF/DKIM not set up | Add SPF record; enable DKIM in cPanel → Email Deliverability |

