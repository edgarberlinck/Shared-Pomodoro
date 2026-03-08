import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pomodoroSession = await prisma.pomodoroSession.findUnique({
    where: { inviteToken: token },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!pomodoroSession) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: pomodoroSession.id,
    sessionName: pomodoroSession.name,
    owner: pomodoroSession.owner,
  });
}
