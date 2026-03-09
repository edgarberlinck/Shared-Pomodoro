import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pomodoroSession = await prisma.pomodoroSession.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!pomodoroSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Calculate actual timeLeft based on startedAt for running timers
  let calculatedSession = { ...pomodoroSession };
  if (
    pomodoroSession.startedAt &&
    (pomodoroSession.status === "RUNNING" || pomodoroSession.status === "BREAK")
  ) {
    const elapsedSeconds = Math.floor(
      (Date.now() - pomodoroSession.startedAt.getTime()) / 1000
    );
    const duration = pomodoroSession.isBreak
      ? pomodoroSession.breakDuration
      : pomodoroSession.workDuration;
    const calculatedTimeLeft = Math.max(0, duration - elapsedSeconds);
    calculatedSession.timeLeft = calculatedTimeLeft;
  }

  return NextResponse.json(calculatedSession);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pomodoroSession = await prisma.pomodoroSession.findUnique({
    where: { id },
  });

  if (!pomodoroSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (pomodoroSession.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.pomodoroSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
