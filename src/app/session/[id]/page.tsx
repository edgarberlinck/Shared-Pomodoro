"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Users,
  ArrowLeft,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

type Member = {
  id: string;
  user: { id: string; name: string | null; email: string };
};

type SessionData = {
  id: string;
  name: string;
  inviteToken: string;
  status: "IDLE" | "RUNNING" | "PAUSED" | "BREAK";
  workDuration: number;
  breakDuration: number;
  timeLeft: number;
  isBreak: boolean;
  ownerId: string;
  owner: { id: string; name: string | null; email: string };
  members: Member[];
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const prevSessionRef = useRef<SessionData | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (!res.ok) {
        setError("Session not found");
        return;
      }
      const data = await res.json();
      setSession(data);
    } catch {
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Show notification when timer phase changes
  useEffect(() => {
    if (!session || !prevSessionRef.current) {
      prevSessionRef.current = session;
      return;
    }

    const prev = prevSessionRef.current;
    const current = session;

    // Detect phase change (work -> break or break -> work)
    if (prev.timeLeft > 0 && current.timeLeft === (current.isBreak ? current.breakDuration : current.workDuration)) {
      if (current.isBreak && !prev.isBreak) {
        showNotification("Break Time! 🎉", "Time to take a break and relax.");
      } else if (!current.isBreak && prev.isBreak) {
        showNotification("Back to Work! 💪", "Break is over. Let's focus!");
      }
    }

    prevSessionRef.current = session;
  }, [session]);

  function showNotification(title: string, body: string) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icon.png",
        badge: "/icon.png",
      });
    }
  }

  // Initialize WebSocket connection
  useEffect(() => {
    fetchSession();

    const socket = io({
      path: "/socket.io",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      socket.emit("join-session", sessionId);
    });

    socket.on("timer-update", (updatedSession: SessionData) => {
      console.log("Timer update received:", updatedSession);
      setSession(updatedSession);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    return () => {
      socket.emit("leave-session", sessionId);
      socket.disconnect();
    };
  }, [sessionId, fetchSession]);

  async function sendAction(action: string) {
    if (!socketRef.current) return;
    
    setActionLoading(true);
    socketRef.current.emit("timer-action", { sessionId, action });
    
    // Wait a bit for the response
    setTimeout(() => setActionLoading(false), 500);
  }

  function copyInviteLink() {
    if (!session) return;
    const url = `${window.location.origin}/join/${session.inviteToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Timer className="h-10 w-10 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading session…</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Session not found"}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRunning = session.status === "RUNNING" || session.status === "BREAK";
  const progress =
    session.timeLeft /
    (session.isBreak ? session.breakDuration : session.workDuration);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  const allMembers = [
    { user: session.owner, isOwner: true },
    ...session.members.map((m) => ({ user: m.user, isOwner: false })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span className="font-bold">{session.name}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy Invite Link
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8">
          {/* Phase badge */}
          <Badge
            variant={session.isBreak ? "secondary" : "default"}
            className="text-sm px-4 py-1"
          >
            {session.isBreak ? "☕ Break Time" : "🎯 Focus Time"}
          </Badge>

          {/* Circular timer */}
          <div className="relative">
            <svg width="280" height="280" className="-rotate-90">
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="10"
              />
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke={session.isBreak ? "hsl(var(--secondary-foreground))" : "hsl(var(--primary))"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold font-mono tracking-tight">
                {formatTime(session.timeLeft)}
              </span>
              <span className="text-sm text-muted-foreground mt-1 capitalize">
                {session.status.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => sendAction("reset")}
              disabled={actionLoading || session.status === "IDLE"}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              className="px-10"
              onClick={() => sendAction(isRunning ? "pause" : "start")}
              disabled={actionLoading}
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {session.status === "PAUSED" ? "Resume" : "Start"}
                </>
              )}
            </Button>
          </div>

          {/* Session info */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold">
                  {Math.floor(session.workDuration / 60)}
                </div>
                <div className="text-xs text-muted-foreground">
                  min focus
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold">
                  {Math.floor(session.breakDuration / 60)}
                </div>
                <div className="text-xs text-muted-foreground">
                  min break
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members */}
          <Card className="w-full max-w-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({allMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {allMembers.map(({ user, isOwner }) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{user.name ?? user.email}</span>
                    {isOwner && (
                      <Badge variant="outline" className="text-xs">
                        Owner
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
