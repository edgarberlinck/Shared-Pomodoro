"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Timer, Users } from "lucide-react";

type InviteInfo = {
  sessionId: string;
  sessionName: string;
  owner: { id: string; name: string | null; email: string };
};

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/join/${token}`)
      .then(async (res) => {
        if (res.status === 401) {
          // Not authenticated – redirect to sign in with return URL
          router.push(`/auth/signin?callbackUrl=/join/${token}`);
          return;
        }
        if (!res.ok) {
          setError("Invalid or expired invite link");
          return;
        }
        const data = await res.json();
        setInfo(data);
      })
      .catch(() => setError("Failed to load invite"))
      .finally(() => setLoading(false));
  }, [token, router]);

  async function handleJoin() {
    if (!info) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/sessions/${info.sessionId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/session/${info.sessionId}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join session");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Timer className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Timer className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Shared Pomodoro</span>
          </Link>
        </div>

        {error ? (
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <p className="text-destructive mb-4">{error}</p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : info ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>You&apos;re invited!</CardTitle>
              <CardDescription>
                {info.owner.name ?? info.owner.email} invited you to join their
                Pomodoro session
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="font-semibold text-lg">{info.sessionName}</p>
              </div>
              <Button className="w-full" onClick={handleJoin} disabled={joining}>
                {joining ? "Joining…" : "Join Session"}
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
