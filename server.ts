import { config } from "dotenv";
config();

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { prisma } from "@/lib/prisma";
import { SessionStatus } from "@/generated/prisma/enums";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Active timers per session
const activeTimers = new Map<string, NodeJS.Timeout>();

async function tickSession(sessionId: string, io: Server) {
  const session = await prisma.pomodoroSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    stopTimer(sessionId);
    return;
  }

  if (session.status !== SessionStatus.RUNNING && session.status !== SessionStatus.BREAK) {
    stopTimer(sessionId);
    return;
  }

  const newTimeLeft = session.timeLeft - 1;

  if (newTimeLeft <= 0) {
    // Switch phase
    const switchToBreak = !session.isBreak;
    const updated = await prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: {
        isBreak: switchToBreak,
        status: switchToBreak ? SessionStatus.BREAK : SessionStatus.RUNNING,
        timeLeft: switchToBreak ? session.breakDuration : session.workDuration,
        startedAt: new Date(),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    io.to(`session:${sessionId}`).emit("timer-update", updated);
  } else {
    const updated = await prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: { timeLeft: newTimeLeft },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    io.to(`session:${sessionId}`).emit("timer-update", updated);
  }
}

function startTimer(sessionId: string, io: Server) {
  if (activeTimers.has(sessionId)) return;
  
  const interval = setInterval(() => {
    tickSession(sessionId, io);
  }, 1000);
  
  activeTimers.set(sessionId, interval);
}

function stopTimer(sessionId: string) {
  const interval = activeTimers.get(sessionId);
  if (interval) {
    clearInterval(interval);
    activeTimers.delete(sessionId);
  }
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    path: "/socket.io",
    addTrailingSlash: false,
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-session", async (sessionId: string) => {
      console.log(`Client ${socket.id} joining session ${sessionId}`);
      socket.join(`session:${sessionId}`);
      
      // Send current session state
      const session = await prisma.pomodoroSession.findUnique({
        where: { id: sessionId },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
      
      if (session) {
        socket.emit("timer-update", session);
      }
    });

    socket.on("leave-session", (sessionId: string) => {
      console.log(`Client ${socket.id} leaving session ${sessionId}`);
      socket.leave(`session:${sessionId}`);
    });

    socket.on("timer-action", async ({ sessionId, action }) => {
      console.log(`Timer action: ${action} for session ${sessionId}`);
      
      const session = await prisma.pomodoroSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) return;

      let updateData: any = {};

      switch (action) {
        case "start":
          if (session.status === SessionStatus.IDLE || session.status === SessionStatus.PAUSED) {
            updateData = {
              status: SessionStatus.RUNNING,
              startedAt: new Date(),
            };
            startTimer(sessionId, io);
          }
          break;
        case "pause":
          if (session.status === SessionStatus.RUNNING || session.status === SessionStatus.BREAK) {
            updateData = {
              status: SessionStatus.PAUSED,
              startedAt: null,
            };
            stopTimer(sessionId);
          }
          break;
        case "reset":
          updateData = {
            status: SessionStatus.IDLE,
            isBreak: false,
            timeLeft: session.workDuration,
            startedAt: null,
          };
          stopTimer(sessionId);
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const updated = await prisma.pomodoroSession.update({
          where: { id: sessionId },
          data: updateData,
          include: {
            owner: { select: { id: true, name: true, email: true } },
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        });
        
        io.to(`session:${sessionId}`).emit("timer-update", updated);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Restore active timers on server start
  prisma.pomodoroSession.findMany({
    where: {
      OR: [
        { status: SessionStatus.RUNNING },
        { status: SessionStatus.BREAK },
      ],
    },
  }).then((sessions) => {
    sessions.forEach((session) => {
      startTimer(session.id, io);
    });
    console.log(`Restored ${sessions.length} active timers`);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
