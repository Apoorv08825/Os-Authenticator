# Secure Authentication Framework for Operating Systems

Production-style full-stack project that combines:
- Real secure authentication with Supabase Auth
- JWT-backed API sessions
- TOTP MFA (Google Authenticator compatible)
- OS authentication pipeline simulation UI
- Attack simulation and detection logging
- Realtime admin telemetry dashboard

## Stack
- Frontend: React (Vite), Tailwind CSS, Framer Motion, Recharts
- Backend: Node.js, Express.js
- Database/Auth: Supabase (PostgreSQL + Auth + Realtime)
- Security: bcrypt, jsonwebtoken, speakeasy, helmet, rate limiting, RBAC, sanitization

## Project Structure
```text
client/
  src/
    animations/
    components/
    hooks/
    pages/
    services/
server/
  src/
    controllers/
    middleware/
    routes/
    utils/
supabase/
  schema.sql
```

## Features Implemented
- Signup/Login with Supabase Auth
- bcrypt fallback credential verification via `local_credentials`
- JWT session issuing + secure logout with server-side session revocation
- MFA enable/disable with TOTP + QR code provisioning
- OS Auth Simulator flow:
  - Input validation
  - Credential verification
  - Token generation
  - Kernel authorization
  - Resource access
- Attack Simulation Panel:
  - Buffer overflow
  - Privilege escalation
  - Trapdoor/backdoor
- Attack and auth logging in Supabase tables
- Admin dashboard:
  - users
  - active sessions
  - failed logins
  - attack logs
  - realtime updates from Supabase Realtime

## 1) Supabase Setup
1. Create a Supabase project.
2. Open SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Ensure Email/Password auth is enabled.
4. (Optional) Promote a user to admin:
```sql
update public.profiles
set role = 'admin'
where id = '<USER_UUID>';
```

## 2) Backend Setup
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Set `server/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=1h
```

## 3) Frontend Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Set `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The Supabase client uses these placeholders by default:
```js
const SUPABASE_URL = "YOUR_SUPABASE_URL"
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY"
```

## 4) Authentication Flow
1. User signs up
2. User logs in
3. User enables MFA from Configuration panel
4. Subsequent login requires OTP
5. User runs OS auth simulation
6. User triggers attack simulations
7. Admin monitors all telemetry in realtime dashboard

## API Endpoints
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/mfa/setup`
- `POST /api/mfa/enable`
- `POST /api/mfa/disable`
- `POST /api/simulator/auth-flow`
- `POST /api/simulator/attack`
- `GET /api/admin/summary` (admin only)

## Security Notes
- Helmet secure headers enabled
- Global API rate limiter + stricter auth limiter
- Input sanitization middleware
- JWT verification tied to server-side `sessions` table
- RBAC middleware for admin routes
- Attack and auth events audited in `attack_logs` and `auth_logs`

## Troubleshooting / Development Tips
- **Missing Tables / Signup Fails**: If you get a 500 server error or a `relation "public.profiles" does not exist` error during signup, you **must** execute the `supabase/schema.sql` file in your Supabase SQL Editor. The custom tables are required for the fallback authentication mechanism.
- **Email Rate Limit Exceeded**: Supabase free tier strictly limits auth emails (approx. 3 per hour). While testing locally, it is highly recommended to go to **Supabase Dashboard -> Authentication -> Providers -> Email** and disable the **"Confirm email"** option to prevent rate-limit blocks.
- **Environment Variables Caching**: The Node.js server explicitly uses `dotenv.config({ override: true })` in `src/env.js` to prevent terminal sessions (like PowerShell) from caching stale environment variables. Always update your `.env` directly and restart `npm run dev`.
