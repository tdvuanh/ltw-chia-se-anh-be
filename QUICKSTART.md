# Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- pnpm (or npm)

## Setup in 5 Minutes

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database and email credentials:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

### 3. Setup Database

```bash
pnpm prisma migrate dev
```

### 4. Start Server

```bash
pnpm dev
```

Server runs at: `http://localhost:3000/api/v1`

## API Endpoints

### 1. **Register**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "full_name": "John Doe"
  }'
```

### 2. **Verify Email**

```bash
# Get token from email, then:
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification-token-from-email"
  }'
```

### 3. **Login**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response includes JWT token:**

```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 4. **Forgot Password**

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### 5. **Reset Password**

```bash
# Get token from reset email, then:
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "password": "NewPass456!",
    "confirmPassword": "NewPass456!"
  }'
```

## Using Authentication

Include JWT token in request headers:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/protected-endpoint
```

## Project Files

| File                                 | Purpose                    |
| ------------------------------------ | -------------------------- |
| `src/services/auth.service.ts`       | Core authentication logic  |
| `src/controllers/auth.controller.ts` | Request handlers           |
| `src/routes/auth.routes.ts`          | API endpoints definition   |
| `src/services/email.service.ts`      | Email sending (Nodemailer) |
| `src/services/token.service.ts`      | JWT token generation       |
| `src/middlewares/auth.middleware.ts` | JWT verification           |
| `src/utils/validation.ts`            | Input validation schemas   |
| `prisma/schema.prisma`               | Database schema            |

## Features Implemented

✅ **User Registration** with email verification
✅ **Email Verification** before login access
✅ **JWT Login** with secure tokens
✅ **Forgot Password** with reset email links
✅ **Reset Password** with single-use tokens
✅ **Password Hashing** with bcrypt
✅ **Input Validation** with Joi
✅ **Error Handling** with proper HTTP codes
✅ **Database Audit** tracking with timestamps

## Troubleshooting

**Email not sending?**

- Check SMTP credentials in `.env`
- Ensure "Less secure app access" is enabled (Gmail)
- Use app-specific passwords for Gmail

**Database connection fails?**

- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check connection permissions

**Build fails?**

- Run `pnpm install` again
- Delete `node_modules` and `.pnpm-store` then reinstall
- Check Node.js version (requires 18+)

## Support

See `API.md` for detailed API documentation.

## Next Steps

1. Configure email provider (Gmail/SendGrid/AWS SES)
2. Add refresh token support
3. Implement rate limiting
4. Add 2FA/MFA support
5. Set up CI/CD pipeline
6. Deploy to production

---

Happy coding! 🚀
