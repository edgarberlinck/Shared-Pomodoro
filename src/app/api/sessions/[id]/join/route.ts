import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

  // If already owner, just return the session
  if (pomodoroSession.ownerId === session.user.id) {
    return NextResponse.json({ sessionId: id });
  }

  // Upsert member
  await prisma.sessionMember.upsert({
    where: {
      userId_sessionId: {
        userId: session.user.id,
        sessionId: id,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      sessionId: id,
    },
  });

  return NextResponse.json({ sessionId: id });
}
