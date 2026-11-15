# CP Times

A dashboard for competitive programming contests, problems, and platform statistics.

[Live demo](https://cp-cave.vercel.app) · [Report an issue](https://github.com/CyberKun/CP-Times/issues)

## Features

- Contest schedules across competitive programming platforms.
- Problem browsing and filtering.
- Linked platform handles and submission statistics.
- Profile customization and practice navigation.

Platform data availability and freshness depend on the upstream services and synchronization jobs.

## Stack

Next.js, TypeScript, React, Tailwind CSS, PostgreSQL, and Prisma. Authentication uses JWTs and bcrypt; deployment is configured for Vercel.

## Run locally

Use a Node.js version supported by the installed Next.js release and a PostgreSQL database. The application lives in `frontend/`.

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/CyberKun/CP-Times.git
   cd CP-Times/frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the `frontend` directory and add your credentials:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/cptimes"
   JWT_SECRET="your-super-secret-key-change-in-production"
   ```

4. **Sync the Database Schema**
   Push the Prisma schema to your database and generate the client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).


## Checks

From `frontend/`, run `npm run lint` and `npm run build` before submitting changes.

## Contributing

Check existing issues before starting a change. For a bug report, include reproduction steps, expected behavior, and the affected platform. Discuss larger feature proposals before implementing them.
