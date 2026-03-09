-- AlterTable
ALTER TABLE "PomodoroSession" ADD COLUMN     "longBreakDuration" INTEGER NOT NULL DEFAULT 900,
ADD COLUMN     "pomodorosUntilLongBreak" INTEGER NOT NULL DEFAULT 4;
