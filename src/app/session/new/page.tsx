"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Timer, ArrowLeft } from "lucide-react";

export default function NewSessionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          workDuration: workMinutes * 60,
          breakDuration: breakMinutes * 60,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create session");
        return;
      }

      router.push(`/session/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <span className="font-bold">Shared Pomodoro</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Create Session</CardTitle>
            <CardDescription>
              Set up a new shared Pomodoro session for your team
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Morning Focus, Sprint Planning"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work">Focus duration (min)</Label>
                  <Input
                    id="work"
                    type="number"
                    min={1}
                    max={60}
                    value={workMinutes}
                    onChange={(e) => setWorkMinutes(parseInt(e.target.value) || 25)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="break">Break duration (min)</Label>
                  <Input
                    id="break"
                    type="number"
                    min={1}
                    max={30}
                    value={breakMinutes}
                    onChange={(e) =>
                      setBreakMinutes(parseInt(e.target.value) || 5)
                    }
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">
                    {workMinutes} min focus
                  </strong>{" "}
                  followed by{" "}
                  <strong className="text-foreground">
                    {breakMinutes} min break
                  </strong>
                </p>
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Session"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
