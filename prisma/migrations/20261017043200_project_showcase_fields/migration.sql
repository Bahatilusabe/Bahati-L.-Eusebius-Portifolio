ALTER TABLE "Project"
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "demoVideoUrl" TEXT,
  ADD COLUMN "repoVisibility" TEXT NOT NULL DEFAULT 'public';
