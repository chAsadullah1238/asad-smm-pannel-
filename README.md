# ASAD SMM — Real backend starter

This is a real server-backed starter, not localStorage-only demo data.

## Run
1. Install Node.js 18+.
2. In this folder run `npm install`.
3. Set a strong environment variable: `JWT_SECRET=your-long-random-secret`.
4. Run `npm start`.
5. Open the displayed local address.

## What is implemented
- Real signup/login with hashed passwords
- SQLite database
- User wallet field
- JazzCash/Easypaisa deposit requests
- Order storage and history
- JWT authentication

## What still requires merchant/provider setup
JazzCash/Easypaisa *automatic* payment confirmation cannot be enabled with invented credentials. You must obtain merchant/API access from the providers and add their official production/sandbox credentials server-side. Never put secrets in frontend JavaScript.

Likewise, actual WhatsApp sending/polls require an authorized WhatsApp Business/Cloud API setup and appropriate permissions.

For production: use HTTPS, a managed database, secure secret storage, rate limiting, CSRF/CORS policy as appropriate, logging, backups, admin roles, payment webhooks, and provider verification.
