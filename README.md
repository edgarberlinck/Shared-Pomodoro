# Shared Pomodoro 🍅

A collaborative Pomodoro timer app – work in sync with your team in real-time.

## ✨ Features

- 🔐 **Simple Authentication** – Email/password with secure JWT tokens
- ⏱️ **Customizable Timers** – Configure work duration, short breaks, and long breaks
- 🎯 **Smart Pomodoro Cycles** – Automatic long breaks after configurable number of pomodoros
- 👥 **Multi-User Sessions** – Real-time synchronized timer across all participants
- 🔗 **One-Click Invite** – Share a unique link; anyone can join instantly
- ⏸️ **Full Control** – Start, pause, reset, or cancel pomodoro cycles
- 📊 **Progress Tracking** – See completed pomodoros and countdown to next long break
- 🔄 **Auto-Sync** – Updates every 5 seconds to keep everyone in sync
- 💾 **Smart Persistence** – Only saves to database on meaningful changes

## 🎯 How to Use

### Creating Your First Session

1. **Sign Up** at `/auth/signup` with your email and password
2. **Login** and you'll be redirected to your dashboard
3. **Click "New Session"** button on the dashboard
4. **Configure your session:**
   - Session name (e.g., "Morning Focus", "Sprint Planning")
   - Focus duration (default: 25 minutes)
   - Short break (default: 5 minutes)
   - Long break duration (default: 15 minutes)
   - Pomodoros until long break (default: 4)
5. **Click "Create Session"**

### Starting a Pomodoro

1. On the session page, you'll see:
   - Large circular timer showing remaining time
   - Current phase (🎯 Focus Time or ☕ Break Time)
   - Session configuration cards
   - Progress tracker showing completed pomodoros
2. **Click the Play button** to start the timer
3. The timer counts down on your screen smoothly
4. **Everyone in the session sees the same timer**

### Managing the Timer

- **▶️ Start/Resume** – Begin or continue the timer
- **⏸️ Pause** – Pause the timer (preserves current time)
- **🔄 Reset** – Reset to the beginning of current phase
- **❌ Cancel** – Cancel entire cycle and reset progress (only during work time)

### Inviting Team Members

1. On the session page, click **"Copy Invite Link"**
2. Share the link with your team via Slack, email, etc.
3. Team members click the link and are automatically added to the session
4. They see the same timer, synchronized in real-time

### Understanding Pomodoro Cycles

1. **Work Phase** (25 min default)
   - Focus time - the main work period
   - Timer shows "🎯 Focus Time"
2. **Short Break** (5 min default)
   - Regular break after each pomodoro
   - Timer shows "☕ Break Time"
3. **Long Break** (15 min default)
   - Extended break after X pomodoros (default: 4)
   - Automatically triggered when you reach the target
4. **Progress Tracking**
   - See total completed pomodoros
   - Countdown to next long break

### Example Flow

```
Pomodoro 1: 25 min work → 5 min break
Pomodoro 2: 25 min work → 5 min break  
Pomodoro 3: 25 min work → 5 min break
Pomodoro 4: 25 min work → 15 min LONG break 🎉
(Cycle repeats)
```

### Tips for Best Experience

- 🔔 **Enable browser notifications** for phase change alerts
- 👥 **Keep the tab open** for accurate timer synchronization
- 📱 **Multiple devices?** Each syncs independently every 5 seconds
- ⚡ **Quick actions?** Changes sync immediately for instant feedback
- 🎵 **Background music?** Timer keeps running even if you switch tabs

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** – React framework with App Router
- **[NextAuth.js v5](https://authjs.dev/)** – Authentication (credentials-based JWT)
- **[Prisma 7](https://www.prisma.io/)** – Database ORM with PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** – Relational database
- **[Shadcn UI](https://ui.shadcn.com/)** – Beautiful UI components
- **[Tailwind CSS v4](https://tailwindcss.com/)** – Utility-first styling
- **[TypeScript](https://www.typescriptlang.org/)** – Type-safe development

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL database** ([Download](https://www.postgresql.org/download/))
  - Or use a cloud provider like [Supabase](https://supabase.com/) or [Neon](https://neon.tech/)

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/edgarberlinck/Shared-Pomodoro.git
   cd Shared-Pomodoro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/shared_pomodoro?schema=public"

   # Authentication (generate secret with: openssl rand -base64 32)
   AUTH_SECRET="your-secret-here"
   AUTH_URL="http://localhost:3000"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Setup the database**

   ```bash
   # Run migrations
   npx prisma migrate dev
   
   # (Optional) Open Prisma Studio to view your data
   npx prisma studio
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment (Vercel)

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - Add `DATABASE_URL` (use your production database)
   - Add `AUTH_SECRET` (generate a new one for production)
   - Add `AUTH_URL` (your Vercel URL)
   - Add `NEXTAUTH_URL` (same as AUTH_URL)

4. **Deploy!**
   - Vercel will automatically deploy
   - Migrations run automatically on build

### Alternative Hosting

Works on any Node.js hosting platform:
- **Railway** – Free tier, auto-deploys from Git
- **Render** – Free PostgreSQL + web service
- **Fly.io** – Global edge deployment
- **DigitalOcean** – Traditional VPS hosting

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth authentication handler
│   │   ├── register/              # User registration endpoint
│   │   ├── sessions/              # Session CRUD operations
│   │   │   └── [id]/
│   │   │       ├── timer/         # Timer actions (start/pause/reset/cancel/tick)
│   │   │       ├── join/          # Join session endpoint
│   │   │       └── route.ts       # Get/delete session
│   │   └── join/[token]/          # Resolve invite token
│   ├── auth/
│   │   ├── signin/                # Sign-in page
│   │   └── signup/                # Sign-up page
│   ├── dashboard/                 # User dashboard with session list
│   ├── join/[token]/              # Public join page via invite link
│   └── session/
│       ├── new/                   # Create new session form
│       └── [id]/                  # Live session timer page
├── components/ui/                 # Reusable UI components (Shadcn)
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── prisma.ts                  # Prisma client singleton
│   └── utils.ts                   # Utility functions (cn, etc)
├── generated/prisma/              # Generated Prisma client types
├── auth.config.ts                 # Auth config for Edge runtime
└── middleware.ts                  # Route protection middleware
prisma/
├── schema.prisma                  # Database schema definition
└── migrations/                    # Database migration history
```

## 🏗️ Architecture & Design Decisions

### Timer Synchronization

**Challenge:** Keep timer synchronized across multiple users without overloading the server.

**Solution:** Hybrid client-server approach
- **Client-side countdown:** Timer runs on each client for smooth UX
- **Server calculates truth:** Uses `startedAt` timestamp to calculate actual time
- **Smart polling:** Syncs with server every 5 seconds
- **Immediate feedback:** Actions (start/pause) fetch instantly

**Why not WebSockets/SSE?**
- Vercel Free tier has 25-second timeout for long-lived connections
- Polling is more reliable and simpler for this use case
- 5-second polling is acceptable latency for a timer app

### Database Optimization

**Challenge:** Minimize database writes for real-time timer.

**Solution:** Only write to DB when state changes
- ✅ Status changes (idle → running → paused)
- ✅ Phase transitions (work → break → work)
- ✅ Pomodoro completion (increment counter)
- ❌ NOT on every tick (would be 1 write/second)

**Result:** ~99% reduction in database writes

### State Management

- **Server state:** Stored in PostgreSQL via Prisma
- **Client state:** React useState with useCallback for timer
- **Sync strategy:** Server is source of truth, client interpolates

## 🔒 Security Features

- 🔐 **Password hashing** with bcrypt
- 🎫 **JWT tokens** for session management
- 🛡️ **Middleware protection** on protected routes
- 🔑 **Invite tokens** for controlled session access
- ✅ **Type safety** with TypeScript throughout

## 🎨 UI/UX Highlights

- **Circular timer** with smooth animations
- **Real-time status** badges (Focus Time / Break Time)
- **Progress indicators** for pomodoro cycles
- **Responsive design** works on mobile and desktop
- **Browser notifications** for phase changes
- **Clean, minimal interface** based on Shadcn UI

## 📊 Performance

- ⚡ **Client-side timer** - 60fps smooth countdown
- 🔄 **0.2 req/s** per user (polling every 5s)
- 💾 **Minimal DB writes** - only on state changes
- 🚀 **Edge-ready** - works on Vercel Free tier
- 📦 **Small bundle** - optimized Next.js build

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Test your changes locally before submitting
- Update documentation if needed

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? [Open an issue](https://github.com/edgarberlinck/Shared-Pomodoro/issues)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Edgar Berlinck**
- GitHub: [@edgarberlinck](https://github.com/edgarberlinck)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Inspired by the Pomodoro Technique® by Francesco Cirillo

---

Made with ❤️ for productive teams
