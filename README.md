# EcoSphere ESG Management Platform

EcoSphere is a web app for tracking environmental, social, and governance activity in one place. It pairs a React front end with a Node.js and Express API, Prisma, and a relational database.

## Repository Layout

```text
.
├── client/
├── server/
├── shared/
├── package.json
├── docker-compose.yml
└── README.md
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run prisma:generate
```

3. Apply the database schema:

```bash
npx prisma db push --schema server/prisma/schema.prisma
```

4. Seed demo data:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

## Demo Flow

1. Build the project:

```bash
npm run build
```

2. Open `http://localhost:5173`
3. Log in with the local demo account defined in the seed data
4. Review the Dashboard, Environmental, Social, Governance, Gamification, Reports, and Notifications sections

## Stack

- Front end: React, Vite, TypeScript, Tailwind CSS
- Back end: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma ORM
- Auth: JWT and RBAC

## Notes

- `.env` is configured for local SQLite during development.
- `shared/` holds code reused across the client and server.
- The app is set up for a straightforward local demo flow, not a large multi-tenant deployment.
