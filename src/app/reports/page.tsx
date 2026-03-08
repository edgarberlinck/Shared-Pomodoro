"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Timer, Users } from "lucide-react";

type SessionReport = {
  id: string;
  name: string;
  completedPomodoros: number;
  totalParticipants: number;
  owner: { id: string; name: string | null; email: string };
  createdAt: string;
  status: "IDLE" | "RUNNING" | "PAUSED" | "BREAK";
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (res.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        setReports(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [router]);

  const totalPomodoros = reports.reduce((sum, r) => sum + r.completedPomodoros, 0);
  const totalSessions = reports.length;

  const statusColors = {
    IDLE: "secondary",
    RUNNING: "default",
    PAUSED: "outline",
    BREAK: "destructive",
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-10 w-10 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Session Reports
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pomodoros</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPomodoros}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sessions yet. Create one to get started!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-center">
                      <Timer className="h-4 w-4 inline mr-1" />
                      Pomodoros
                    </TableHead>
                    <TableHead className="text-center">
                      <Users className="h-4 w-4 inline mr-1" />
                      Participants
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        {report.owner.name || report.owner.email}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.completedPomodoros}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.totalParticipants}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[report.status]}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/session/${report.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
