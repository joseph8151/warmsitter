-- Add an "urgent" flag to job posts (급구).
ALTER TABLE "JobPost" ADD COLUMN "urgent" BOOLEAN NOT NULL DEFAULT false;
