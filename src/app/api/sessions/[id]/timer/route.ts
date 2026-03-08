import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionStatus } from "@/generated/prisma/enums";

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
        updateData = {
          status: SessionStatus.PAUSED,
          startedAt: null,
        };
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
    case "tick": {
      // Server-side tick: decrement timeLeft
      if (
        pomodoroSession.status !== "RUNNING" &&
        pomodoroSession.status !== "BREAK"
      ) {
        return NextResponse.json(pomodoroSession);
      }
      const newTimeLeft = pomodoroSession.timeLeft - 1;
      if (newTimeLeft <= 0) {
        // Switch phase
        const switchToBreak = !pomodoroSession.isBreak;
        updateData = {
          isBreak: switchToBreak,
          status: switchToBreak ? SessionStatus.BREAK : SessionStatus.RUNNING,
          timeLeft: switchToBreak
            ? pomodoroSession.breakDuration
            : pomodoroSession.workDuration,
          startedAt: new Date(),
        };
      } else {
        updateData = { timeLeft: newTimeLeft };
      }
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

  return NextResponse.json(updated);
}
