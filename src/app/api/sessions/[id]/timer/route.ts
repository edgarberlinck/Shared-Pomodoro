import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionStatus } from "@/generated/prisma/enums";
import { sseManager } from "@/lib/sse-manager";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pomodoroSession = await prisma.pomodoroSession.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!pomodoroSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Only owner and members can control the timer
  const isMember =
    pomodoroSession.ownerId === session.user.id ||
    pomodoroSession.members.some(
      (m: { userId: string }) => m.userId === session.user.id
    );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await request.json();

  let updateData: Partial<{
    status: SessionStatus;
    timeLeft: number;
    isBreak: boolean;
    startedAt: Date | null;
    completedPomodoros: number;
  }> = {};

  switch (action) {
    case "start":
      if (pomodoroSession.status === "IDLE" || pomodoroSession.status === "PAUSED") {
        updateData = {
          status: SessionStatus.RUNNING,
          startedAt: new Date(),
        };
      }
      break;
    case "pause":
      if (pomodoroSession.status === "RUNNING" || pomodoroSession.status === "BREAK") {
        // Calculate current timeLeft before pausing
        if (pomodoroSession.startedAt) {
          const elapsedSeconds = Math.floor(
            (Date.now() - pomodoroSession.startedAt.getTime()) / 1000
          );
          const duration = pomodoroSession.isBreak
            ? pomodoroSession.breakDuration
            : pomodoroSession.workDuration;
          const calculatedTimeLeft = Math.max(0, duration - elapsedSeconds);
          
          updateData = {
            status: SessionStatus.PAUSED,
            startedAt: null,
            timeLeft: calculatedTimeLeft,
          };
        } else {
          updateData = {
            status: SessionStatus.PAUSED,
            startedAt: null,
          };
        }
      }
      break;
    case "reset":
      updateData = {
        status: SessionStatus.IDLE,
        isBreak: false,
        timeLeft: pomodoroSession.workDuration,
        startedAt: null,
      };
      break;
    case "cancel":
      // Cancel current pomodoro - only works during work time
      if (!pomodoroSession.isBreak && pomodoroSession.status !== "IDLE") {
        updateData = {
          status: SessionStatus.IDLE,
          isBreak: false,
          timeLeft: pomodoroSession.workDuration,
          startedAt: null,
          completedPomodoros: 0,
        };
      }
      break;
    case "tick": {
      // Server-side tick: check if phase should transition
      if (
        pomodoroSession.status !== "RUNNING" &&
        pomodoroSession.status !== "BREAK"
      ) {
        return NextResponse.json(pomodoroSession);
      }
      
      // Calculate actual time left based on startedAt
      if (!pomodoroSession.startedAt) {
        return NextResponse.json(pomodoroSession);
      }
      
      const elapsedSeconds = Math.floor(
        (Date.now() - pomodoroSession.startedAt.getTime()) / 1000
      );
      const duration = pomodoroSession.isBreak
        ? pomodoroSession.breakDuration
        : pomodoroSession.workDuration;
      const calculatedTimeLeft = Math.max(0, duration - elapsedSeconds);
      
      if (calculatedTimeLeft <= 0) {
        // Switch phase - SAVE TO DB
        const switchToBreak = !pomodoroSession.isBreak;
        
        if (switchToBreak) {
          // Determine if it's time for a long break
          const newCompletedCount = pomodoroSession.completedPomodoros + 1;
          const isLongBreak = newCompletedCount % pomodoroSession.pomodorosUntilLongBreak === 0;
          const breakDuration = isLongBreak ? pomodoroSession.longBreakDuration : pomodoroSession.breakDuration;
          
          updateData = {
            isBreak: true,
            status: SessionStatus.BREAK,
            timeLeft: breakDuration,
            startedAt: new Date(),
            completedPomodoros: newCompletedCount,
          };
        } else {
          // Switch from break to work
          updateData = {
            isBreak: false,
            status: SessionStatus.RUNNING,
            timeLeft: pomodoroSession.workDuration,
            startedAt: new Date(),
          };
        }
      } else {
        // No phase transition - don't save to DB, just return calculated state
        return NextResponse.json({
          ...pomodoroSession,
          timeLeft: calculatedTimeLeft,
        });
      }
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Only save to DB when there's actual data to update
  // This happens on:
  // 1. Status changes (start, pause, reset, cancel)
  // 2. Phase transitions (work -> break, break -> work)
  // 3. Pomodoro completion
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(pomodoroSession);
  }

  const updated = await prisma.pomodoroSession.update({
    where: { id },
    data: updateData,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  // Broadcast update to all SSE clients
  sseManager.broadcast(id, { type: "session-update", data: updated });

  return NextResponse.json(updated);
}
