# Robok Labs Website

Static HTML/CSS/JS website with a PHP contact form that sends email via authenticated SMTP (PHPMailer).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Contact form | PHP 8+ endpoint (`contact.php`) |
| Email transport | PHPMailer 6 over SMTP |
| Hosting | HostPapa cPanel shared hosting |

---

## Quick start (local development)

```bash
# Install PHP dependencies
composer install

# Serve locally (PHP built-in server)
php -S localhost:8080
```

Open `http://localhost:8080/contact.html`.  
For the contact form to send mail locally, create `config.php` in the project root (or one level above) using `config.example.php` as the template.

---

## cPanel / HostPapa deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step guide, including:

- Uploading files to `/home/earthlyf/roboklabs.com/`
- Installing PHPMailer via Composer
- Creating `config.php` **outside** the web root at `/home/earthlyf/config.php`
- SMTP mailbox setup on HostPapa
- File permissions and `.htaccess` hardening

### Config file (`/home/earthlyf/config.php`) — key constants

| Constant | Purpose |
|----------|---------|
| `SMTP_HOST` | HostPapa outgoing mail server, e.g. `mail.roboklabs.com` |
| `SMTP_PORT` | `465` (implicit SSL) or `587` (STARTTLS) |
| `SMTP_USER` | Full mailbox address used to authenticate |
| `SMTP_PASS` | Mailbox password (**never commit this**) |
| `SMTP_FROM` | "From" address on outgoing mail (must match `SMTP_USER`) |
| `SMTP_FROM_NAME` | Display name, e.g. `Robok Labs Website` |
| `CONTACT_TO` | Recipient address for contact form submissions |
| `CONTACT_TO_NAME` | Display name for the recipient |

Copy `config.example.php` to create your own config and fill in real values.  
`config.php` is in `.gitignore` — **never commit credentials**.

---

## Security notes

- `config.php` lives one level **above** the web root so it is never HTTP-accessible.
- `.htaccess` blocks direct browser access to `config.php`, `vendor/`, and other sensitive files as a safety net.
- SPF/DKIM records should be configured in cPanel → **Email Deliverability** to prevent messages landing in spam.
- The contact form sets **Reply-To** to the visitor's email and **From** to the server's own SMTP address to satisfy SPF/DMARC policies.

---

## Node.js alternative

`server.js` is an Express-based backend for Node.js hosting (Render, Railway, Fly.io, etc.).  
It is **not used** on HostPapa cPanel — use `contact.php` instead.  
See `DEPLOYMENT.md` for details.
