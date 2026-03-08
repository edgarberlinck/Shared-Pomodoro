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

// Track online users per session: sessionId -> Set<userId>
const onlineUsers = new Map<string, Set<string>>();

function getOnlineUsersForSession(sessionId: string): string[] {
  return Array.from(onlineUsers.get(sessionId) || []);
}

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
        completedPomodoros: switchToBreak ? session.completedPomodoros + 1 : session.completedPomodoros,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    const updatedWithOnline = {
      ...updated,
      onlineUsers: getOnlineUsersForSession(sessionId),
    };
    io.to(`session:${sessionId}`).emit("timer-update", updatedWithOnline);
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
    const updatedWithOnline = {
      ...updated,
      onlineUsers: getOnlineUsersForSession(sessionId),
    };
    io.to(`session:${sessionId}`).emit("timer-update", updatedWithOnline);
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
    
    let currentUserId: string | null = null;
    let currentSessionId: string | null = null;

    socket.on("join-session", async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      console.log(`Client ${socket.id} (user: ${userId}) joining session ${sessionId}`);
      socket.join(`session:${sessionId}`);
      
      currentUserId = userId;
      currentSessionId = sessionId;
      
      // Add user to online users
      if (!onlineUsers.has(sessionId)) {
        onlineUsers.set(sessionId, new Set());
      }
      onlineUsers.get(sessionId)!.add(userId);
      
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
        const sessionWithOnline = {
          ...session,
          onlineUsers: getOnlineUsersForSession(sessionId),
        };
        socket.emit("timer-update", sessionWithOnline);
        
        // Notify others about online users update
        socket.to(`session:${sessionId}`).emit("online-users-update", {
          onlineUsers: getOnlineUsersForSession(sessionId),
        });
      }
    });

    socket.on("leave-session", (sessionId: string) => {
      console.log(`Client ${socket.id} leaving session ${sessionId}`);
      socket.leave(`session:${sessionId}`);
      
      // Remove user from online users
      if (currentUserId && onlineUsers.has(sessionId)) {
        onlineUsers.get(sessionId)!.delete(currentUserId);
        if (onlineUsers.get(sessionId)!.size === 0) {
          onlineUsers.delete(sessionId);
        } else {
          // Notify others about online users update
          io.to(`session:${sessionId}`).emit("online-users-update", {
            onlineUsers: getOnlineUsersForSession(sessionId),
          });
        }
      }
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
        
        const updatedWithOnline = {
          ...updated,
          onlineUsers: getOnlineUsersForSession(sessionId),
        };
        
        io.to(`session:${sessionId}`).emit("timer-update", updatedWithOnline);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      
      // Remove user from online users on disconnect
      if (currentUserId && currentSessionId && onlineUsers.has(currentSessionId)) {
        onlineUsers.get(currentSessionId)!.delete(currentUserId);
        if (onlineUsers.get(currentSessionId)!.size === 0) {
          onlineUsers.delete(currentSessionId);
        } else {
          // Notify others about online users update
          io.to(`session:${currentSessionId}`).emit("online-users-update", {
            onlineUsers: getOnlineUsersForSession(currentSessionId),
          });
        }
      }
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
