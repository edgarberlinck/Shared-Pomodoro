import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sseManager } from "@/lib/sse-manager";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify user has access to this session
  const pomodoroSession = await prisma.pomodoroSession.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!pomodoroSession) {
    return new Response("Not Found", { status: 404 });
  }

  const isMember =
    pomodoroSession.ownerId === session.user.id ||
    pomodoroSession.members.some((m) => m.userId === session.user.id);

  if (!isMember) {
    return new Response("Forbidden", { status: 403 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;

      // Register this connection
      sseManager.addConnection(id, controller, encoder);

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Send initial session state
      sendSessionUpdate(id, controller, encoder);

      // Keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
        sseManager.removeConnection(id, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function sendSessionUpdate(
  sessionId: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  try {
    const session = await prisma.pomodoroSession.findUnique({
      where: { id: sessionId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!session) return;

    // Calculate actual timeLeft based on startedAt
    let calculatedSession = { ...session };
    if (
      session.startedAt &&
      (session.status === "RUNNING" || session.status === "BREAK")
    ) {
      const elapsedSeconds = Math.floor(
        (Date.now() - session.startedAt.getTime()) / 1000
      );
      const duration = session.isBreak
        ? session.breakDuration
        : session.workDuration;
      const calculatedTimeLeft = Math.max(0, duration - elapsedSeconds);
      calculatedSession.timeLeft = calculatedTimeLeft;
    }

    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ type: "session-update", data: calculatedSession })}\n\n`
      )
    );
  } catch (error) {
    console.error("Error sending session update:", error);
  }
}
