import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Timer, Users, Link as LinkIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Shared Pomodoro</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/auth/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Stay focused,{" "}
          <span className="text-primary">together</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Create a shared Pomodoro session, invite your team with a link, and
          stay in sync. Same timer, same rhythm — everyone focused at once.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">Start for free</Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="p-6 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Shared Timer</h3>
            <p className="text-muted-foreground">
              Everyone in the session sees the same timer in real-time. Start,
              pause, or reset — all in sync.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Invite by Link</h3>
            <p className="text-muted-foreground">
              Share a simple invite link with your team. No sign-up required to
              join — just click and focus.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Team Focused</h3>
            <p className="text-muted-foreground">
              See who&apos;s in the session with you. Build better habits and
              accountability with your team.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
