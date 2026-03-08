import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all sessions where user is owner or member
  const sessions = await prisma.pomodoroSession.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const reports = sessions.map((session) => ({
    id: session.id,
    name: session.name,
    completedPomodoros: session.completedPomodoros,
    totalParticipants: session.members.length + 1, // +1 for owner
    owner: session.owner,
    createdAt: session.createdAt,
    status: session.status,
  }));

  return NextResponse.json(reports);
}
