# dom-pl-marketplace-demo

Headless e-commerce store. Backend: **Medusa v2** + PostgreSQL (Docker). Frontend: **Nuxt 4** + **@nuxt/ui v4**.

---

## Setup

### Full Stack (Docker Compose)

To run everything at once from the project root:

```bash
docker compose up --build -d
```

Create the first admin user (after containers are up):

```bash
docker compose run --rm medusa yarn medusa user -e admin@admin.com -p admin
```

### Backend (Docker)

```bash
yarn docker:up
```

Create the first admin user:

```bash
docker compose run --rm medusa yarn medusa user -e admin@admin.com -p admin
```

- Medusa admin: http://localhost:9000/app
- pgAdmin: http://localhost:8080 — login: `admin@admin.com` / `admin`

### Frontend users
Customer account:
- Anna Nowak
- anowak@gmail.com
- ZAQ!2wsx

Vendor account:
- Jan Kowalski
- jkowalski@gmail.com
- ZAQ!2wsx

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at http://localhost:3000.

---

## LLM Skills

Load these before working on specific areas (type the slash command in Claude Code):

- `/medusa-dev:building-with-medusa` — backend modules, routes, workflows
- `/medusa-dev:building-storefronts` — storefront SDK usage and data fetching
- `/medusa-dev:building-admin-dashboard-customizations` — admin UI widgets/pages
- `/nuxt-ui` — Nuxt UI components and theming

See `AGENTS.md` for the full guide including service layer architecture.

---

## Workflow

**Always work on a branch. Never commit directly to `main`.**

```bash
git checkout -b feat/your-feature
# do work
git push -u origin feat/your-feature
# open a PR
```

## Seeder

To seed database with basic house plans run this command

```bash
docker exec medusa_backend npm run seed:house-plans
```

## Sketch

To see local sketches in medusa admin panel add this this backend .env

```bash
VITE_STOREFRONT_URL=http://localhost:3000
```

## Publishable Key

To ensure the frontend communicates correctly with the backend, generate a publishable key in the Medusa admin dashboard and add it to the frontend's `.env` file as `NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
