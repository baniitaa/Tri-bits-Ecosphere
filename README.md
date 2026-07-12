# EcoSphere ESG Management Platform

Single-organization ESG management platform for environmental, social, and governance operations.

## Start

1. `DATABASE_URL` is already configured for local SQLite in `.env`.
2. Install dependencies with `npm install`
3. Generate Prisma client with `npm run prisma:generate`
4. Push the schema with `npx prisma db push --schema server/prisma/schema.prisma`
5. Seed demo data with `npm run seed`
6. Run the app with `npm run dev`

## Demo Credentials

- Admin: `admin@ecosphere.local`
- Password: `Admin@12345`

## Verify

1. `npm run build`
2. Open `http://localhost:5173`
3. Log in with the admin credentials
4. Check Dashboard, Environmental, Social, Governance, Gamification, Reports, and Notifications

## Stack

- React, Vite, TypeScript, TailwindCSS, shadcn-style UI
- Node.js, Express, TypeScript
- PostgreSQL, Prisma ORM
- JWT authentication and RBAC
