import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Plus, Users, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { SessionStatus } from "@/generated/prisma/enums";

function statusLabel(status: SessionStatus): string {
  switch (status) {
    case "RUNNING":
      return "Running";
    case "PAUSED":
      return "Paused";
    case "BREAK":
      return "Break";
    default:
      return "Idle";
  }
}

function statusVariant(
  status: SessionStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "RUNNING":
      return "default";
    case "BREAK":
      return "secondary";
    case "PAUSED":
      return "outline";
    default:
      return "outline";
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const sessions = await prisma.pomodoroSession.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <span className="font-bold">Shared Pomodoro</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name ?? session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Sessions</h1>
            <p className="text-muted-foreground">
              Manage and join your Pomodoro sessions
            </p>
          </div>
          <Link href="/session/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </Link>
        </div>

        {sessions.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first shared Pomodoro session and invite your team.
              </p>
              <Link href="/session/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <Link key={s.id} href={`/session/${s.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <Badge variant={statusVariant(s.status)}>
                        {statusLabel(s.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      by {s.owner.name ?? s.owner.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {s.isBreak ? "Break" : "Focus"} •{" "}
                        {formatTime(s.timeLeft)} left
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {s.members.length + 1}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
