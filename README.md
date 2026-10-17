# Bahati Portfolio

A production-minded cybersecurity portfolio built with Next.js, Tailwind CSS, and a lightweight Node.js backend surface.

## Stack

- Frontend: Next.js
- Styling: Tailwind CSS with custom theme tokens
- API surface: Next.js API route for contact submissions
- Optional backend service: Express server in `backend/server.js`
- Deployment target: Vercel for the frontend, optional Node host for the standalone backend

## Sections

- Home
- About Me
- Projects
- Blogs
- Contacts

## Features

- Sticky glass navigation with active section highlighting
- Persisted dark and light theme toggle
- Cybersecurity-inspired visual system with responsive layout
- Data-driven projects and blog cards
- Contact form with validation, honeypot spam field, and rate limiting
- Security headers for both frontend and backend surfaces
- Downloadable profile brief placeholder at `public/Bahati-L-Eusebius-CV.txt`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run start
npm run backend
npm run dev:full
```

## Environment Variables

Copy `.env.example` to `.env` if you want to override defaults.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PORT=4000
CONTACT_RATE_LIMIT_WINDOW_MS=60000
CONTACT_RATE_LIMIT_MAX=6
```

### Database (Prisma)

If you want full database-backed data (projects, blogs, etc.) set a `DATABASE_URL` in your `.env` (see `.env.example`). Example:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

After setting `DATABASE_URL`, run:

```bash
npm install
npx prisma generate
# optionally apply migrations if you have them
npx prisma migrate dev
```

If you don't set `DATABASE_URL` the app will run in development with safe fallbacks (empty lists) so you can still work on the UI.

## Notes

- The frontend contact form posts to `src/pages/api/contact.js`.
- `backend/server.js` mirrors the contact contract if you want a dedicated API service.
- Placeholder social links are intentionally disabled until your final profile URLs are added.
- Replace `public/Bahati-L-Eusebius-CV.txt` with your final CV file when ready.

### Quick local Postgres (Docker)

If you don't have Postgres installed locally, you can use the included `docker-compose.yml` to start one:

```bash
# Start Postgres in the background
docker compose up -d

# Set your DATABASE_URL (example matching docker-compose defaults)
export DATABASE_URL="postgresql://prisma:prisma@localhost:5432/portfolio_dev?schema=public"

# Generate Prisma client and apply migrations
npx prisma generate
npx prisma migrate dev --name init

# Start the app
npm run dev
```

When finished, stop Postgres with:

```bash
docker compose down
```
