# TransitOps

Fleet-ops platform. Monorepo with Express API + React/Vite frontend.

## Quick start

```bash
cp .env.example .env        # fill in JWT_SECRET (DATABASE_URL is pre-filled for Docker)
npm install
npm run db:up               # start Postgres in Docker
npm run db:migrate
npm run dev                 # starts api on :3001 and web on :5173
```

## Apps

| App | Port | Description |
|-----|------|-------------|
| `apps/api` | 3001 | Express + Prisma REST API |
| `apps/web` | 5173 | React + Vite frontend |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both apps concurrently |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run build` | Build both apps |
