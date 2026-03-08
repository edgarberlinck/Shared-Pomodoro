# Shared Pomodoro

A collaborative Pomodoro timer app – work in sync with your team.

## Features

- **Create an account** – Simple email/password authentication
- **Create a Pomodoro session** – Configure focus and break durations
- **Invite teammates** – Share a unique invite link; anyone can join in one click
- **Shared timer** – Everyone in a session sees the same timer, synced in real-time

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** – React framework with App Router
- **[NextAuth.js v5](https://authjs.dev/)** – Authentication (credentials-based JWT)
- **[Prisma 7](https://www.prisma.io/)** – Database ORM
- **[PostgreSQL](https://www.postgresql.org/)** – Database
- **[Shadcn UI](https://ui.shadcn.com/)** – UI components (Radix UI + Tailwind)
- **[Tailwind CSS v4](https://tailwindcss.com/)** – Styling

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd shared-pomodoro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/shared_pomodoro?schema=public"
   AUTH_SECRET="your-secret-here"   # generate with: openssl rand -base64 32
   AUTH_URL="http://localhost:3000"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run database migrations**

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Usage Flow

1. **Sign up** at `/auth/signup`
2. **Create a session** from the dashboard – set a name, focus duration, and break duration
3. **Copy the invite link** from the session page and share it with your team
4. **Everyone joins** and the timer is synchronized in real-time across all participants

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   ├── register/            # User registration
│   │   ├── sessions/            # CRUD for sessions
│   │   │   └── [id]/
│   │   │       ├── timer/       # Timer control (start/pause/reset)
│   │   │       └── join/        # Join a session
│   │   └── join/[token]/        # Resolve invite token
│   ├── auth/
│   │   ├── signin/              # Sign-in page
│   │   └── signup/              # Sign-up page
│   ├── dashboard/               # User dashboard
│   ├── join/[token]/            # Join via invite link
│   └── session/
│       ├── new/                 # Create session
│       └── [id]/                # Shared timer page
├── components/ui/               # Shadcn-style UI components
├── lib/
│   ├── auth.ts                  # NextAuth configuration (Node.js)
│   ├── prisma.ts                # Prisma client singleton
│   └── utils.ts                 # Utility functions
├── auth.config.ts               # Lightweight auth config (Edge runtime)
└── proxy.ts                     # Route protection middleware
prisma/
└── schema.prisma                # Database schema
```
