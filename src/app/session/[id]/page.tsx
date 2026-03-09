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
  X,
} from "lucide-react";

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
  longBreakDuration: number;
  pomodorosUntilLongBreak: number;
  timeLeft: number;
  isBreak: boolean;
  completedPomodoros: number;
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
  const prevSessionRef = useRef<SessionData | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio();
    // Using a simple beep sound (data URI for a short beep)
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSiK0/LTgjMGHm7A7+OZRQ0PVqzn77BdGAg+ltrzxnMiBSuFzvLaizsIGGS57OihUBELTKXh8bllHAU2jdXyzn4vBSF+zPDajzsKElyx6OyrWBUIQ5zd8sFuIAMrgtDx1IU2Bhxqvu7mnEsODlOq5O+zYBoGO5PY88p1JAQogM/w2Ys6CRZhtuvpoFITC0mi4PK8aR4EL4fS8dmNPwgVX7bs7KVVEwlCm93yv28gAy2D0fHWiTcIGme97OecSw4NUqjk77ReFwY7k9jzy3YjBCh+zvDakzsJFmC16+mjUhILS6Hh8r1sHwQthtLx2I0+BxVetuzspVUUCUGb3fK/cCEDLYPR8daKOAcZZ73s56BODQ5Rp+TvtWAbBjuS1/PMeCUDKH7N8NqTOwoVYLbr6qNSEwtJoODywm8gBC2F0fHXjj4HFV627OylVRQJQJrd8sBxIQMtg9Hx1oo4BxlmvOznn04ODlCn5O+2YRsGOpLX88t5JgMnfszw2pM7ChVfterqpFMSC0ig4PLEcCEELIPR8deOPwcUXbXs7KZWFAk/mdzywnIiAy2D0fHWizcHGWW77OafTg4OT6bk77dmHAY6kdfzy3snAyd9y/DajDsKFV627OumVRQLSJ/g8sVxIgQrgtHx1408BxRctOzsplYUCT6Y2/LDcyIDLoTR8daMOAcZZLrs6J9ODg5QpuTwuGccBjmQ1vLMeygEKHzK8NuNOwkUXLXr66dWFApHnuDyxnMkAyuB0PHXjTwHE1u07OymVxQJPZjb88R0JQMuhNDx1407BxljuOvpn1AODk+l5PC5aB4GOY/V8sx8KQQnd8nw241ACRJasuvqqFgUCkae3/LHdSUDKoDQ8diOPQcTWrPr7KdYFAk8l9ryw3YmBC2Dz/HVjz0IE1iz6+qoWRQKRZ3e8sZ1JgMqf9Dw2I49BxJZsuvsp1kUCTyW2vLEeScELYLO8dWQPwgSV7Hq66lZFQpEnN7yxnUmAyp+z/DYjj4HElmx6+yoWRUKPJXa8sN5KAQsgs7x1JBACBJWsOrqqlkVCkOc3fLFdiYDKn3P8NiOPwcSWLDr7KlZFQo8ldryw3knBCuBzvHUkUEIEVWv6uqrWhUKQpvd8sR2JwMpfM/v2I9ACBFXr+rqq1oVCkKa3fPEdygEK4HN8dSRQggRVa/p6qxbFQpCmt3yxHYoBSl7z+/Xj0EJEFau6eurWxYLQprc88R3KAQrfczw1ZFCCRFUrujrrFwWC0GZ3PLDdykFKXvO79aQQgkRVa7o66xcFgtBmNzyxXgpBCp7zO/VkUMJEVOu6OusXBYLQZjc8cV4KQQqeszv1ZFDCRFTrujrrFwWC0CX3fLEeCoFKXrM79WRQwkRU67n66xdFgtAl9zxxHkqBSl6zO/UkUQJEVKt6OyvXhULQZfc8cN5KgUpeszv1JFECRBR";
  }, []);

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

  /**
   * Client-Side Timer Tick Function
   * 
   * Decrements the timer locally every second. When it reaches 0,
   * notifies the server to handle phase transitions.
   * 
   * This hybrid approach provides:
   * - Smooth countdown without network delay
   * - Server authority over phase changes
   * - Minimal server load (only on phase transitions)
   */
  const tickTimer = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.status !== "RUNNING" && prev.status !== "BREAK") return prev;
      
      const newTimeLeft = prev.timeLeft - 1;
      
      if (newTimeLeft <= 0) {
        // Phase transition detected - let server handle it
        // Server will calculate if it's time for break/work/long break
        fetch(`/api/sessions/${sessionId}/timer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tick" }),
        }).catch(console.error);
        
        // Keep current state, polling will update with server's decision
        return prev;
      }
      
      return { ...prev, timeLeft: newTimeLeft };
    });
  }, [sessionId]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Show notification and play sound when timer phase changes
  useEffect(() => {
    if (!session || !prevSessionRef.current) {
      prevSessionRef.current = session;
      return;
    }

    const prev = prevSessionRef.current;
    const current = session;

    // Detect phase change by checking if isBreak changed
    if (prev.isBreak !== current.isBreak) {
      if (current.isBreak && !prev.isBreak) {
        // Work -> Break
        playNotificationSound();
        showNotification("Break Time! 🎉", "Time to take a break and relax.");
      } else if (!current.isBreak && prev.isBreak) {
        // Break -> Work
        playNotificationSound();
        showNotification("Back to Work! 💪", "Break is over. Let's focus!");
      }
    }

    prevSessionRef.current = session;
  }, [session]);

  function playNotificationSound() {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.log("Could not play sound:", err);
      });
    }
  }

  function showNotification(title: string, body: string) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  }

  /**
   * Smart Polling Strategy for Multi-User Sync
   * 
   * WHY POLLING INSTEAD OF WEBSOCKETS/SSE?
   * Vercel Free tier has a 25-second timeout for long-lived connections,
   * making WebSockets and Server-Sent Events unreliable. Polling is the
   * only reliable real-time sync strategy that works on Vercel Free.
   * 
   * HOW IT WORKS:
   * 1. Poll server every 5 seconds to fetch latest session state
   * 2. Client-side timer runs independently for smooth countdown
   * 3. Server calculates actual time based on `startedAt` timestamp
   * 4. When actions occur (start/pause), immediate fetch for instant feedback
   * 
   * PERFORMANCE:
   * - 0.2 requests/second per user (1 request every 5 seconds)
   * - Only reads from DB during polling (no writes)
   * - Acceptable latency for timer app (5s sync delay)
   * 
   * ALTERNATIVES (if not on Vercel Free):
   * - WebSockets: Real-time bidirectional communication
   * - Server-Sent Events (SSE): Server push updates to clients
   * - Pusher/Ably: Third-party real-time services
   */
  useEffect(() => {
    fetchSession();

    // Start polling interval
    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Poll every 5 seconds to sync with server
      // This catches updates from other users in the same session
      pollingIntervalRef.current = setInterval(() => {
        fetchSession();
      }, 5000);
    };

    startPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchSession]);

  /**
   * Client-Side Timer for Smooth Countdown
   * 
   * WHY CLIENT-SIDE TIMER?
   * Running the countdown on the client provides 60fps smooth updates
   * without hammering the server. The server remains the source of truth
   * via the `startedAt` timestamp.
   * 
   * HOW IT WORKS:
   * 1. Timer decrements `timeLeft` every second locally
   * 2. When reaching 0, sends "tick" action to server
   * 3. Server handles phase transitions (work -> break)
   * 4. Polling syncs any drift every 5 seconds
   * 
   * PHASE TRANSITIONS:
   * - Client detects timeLeft === 0
   * - Sends "tick" action to server
   * - Server calculates if phase should change
   * - Server updates DB and returns new state
   * - Client receives update and continues countdown
   */
  useEffect(() => {
    if (!session) return;

    // Clear existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Start timer if running
    if (session.status === "RUNNING" || session.status === "BREAK") {
      // Tick every second on client
      timerIntervalRef.current = setInterval(tickTimer, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [session?.status, session?.id, tickTimer]);

  async function sendAction(action: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        // Immediately poll to sync with other clients
        setTimeout(() => fetchSession(), 100);
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionLoading(false);
    }
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
              title="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            {!session.isBreak && session.status !== "IDLE" && (
              <Button
                size="lg"
                variant="destructive"
                onClick={() => sendAction("cancel")}
                disabled={actionLoading}
                title="Cancel current pomodoro cycle"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
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
          <div className="w-full max-w-sm space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
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
                    short break
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold">
                    {Math.floor(session.longBreakDuration / 60)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    long break
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Pomodoro progress */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">
                    {session.completedPomodoros}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    completed pomodoros
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.pomodorosUntilLongBreak - (session.completedPomodoros % session.pomodorosUntilLongBreak)} more until long break
                  </div>
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
                {allMembers.map(({ user, isOwner }) => {
                  return (
                    <li
                      key={user.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{user.name ?? user.email}</span>
                      </div>
                      {isOwner && (
                        <Badge variant="outline" className="text-xs">
                          Owner
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
