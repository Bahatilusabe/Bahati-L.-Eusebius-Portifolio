-- Migration: 2026-06-09_init
-- Creates enums and tables for the portfolio CMS

-- Enums
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN','EDITOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContentStatus" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  bio TEXT,
  "avatarUrl" TEXT,
  role "UserRole" NOT NULL DEFAULT 'ADMIN',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

-- Projects
CREATE TABLE IF NOT EXISTS "Project" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  technologies TEXT[] DEFAULT '{}',
  "githubUrl" TEXT,
  "liveUrl" TEXT,
  "coverImage" TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  "authorId" TEXT,
  CONSTRAINT fk_project_author FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_project_featured ON "Project" (featured);
CREATE INDEX IF NOT EXISTS idx_project_status_publishedAt ON "Project" (status, "publishedAt");

-- Blogs
CREATE TABLE IF NOT EXISTS "Blog" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  "coverImage" TEXT,
  status "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  "authorId" TEXT,
  CONSTRAINT fk_blog_author FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_status_publishedAt ON "Blog" (status, "publishedAt");

-- Videos
CREATE TABLE IF NOT EXISTS "Video" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail TEXT,
  "videoUrl" TEXT NOT NULL,
  status "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  "authorId" TEXT,
  CONSTRAINT fk_video_author FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_video_status_publishedAt ON "Video" (status, "publishedAt");

-- Skills
CREATE TABLE IF NOT EXISTS "Skill" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  level INT,
  "sortOrder" INT,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

-- Messages
CREATE TABLE IF NOT EXISTS "Message" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "receivedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

-- Settings (single-row table expected)
CREATE TABLE IF NOT EXISTS "settings" (
  id TEXT PRIMARY KEY,
  "siteTitle" TEXT,
  description TEXT,
  "cvUrl" TEXT,
  social JSONB,
  meta JSONB,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

-- Optionally ensure function to keep updatedAt on update
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for tables that have updatedAt
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_updatedat_trigger') THEN
    CREATE TRIGGER user_updatedat_trigger
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'project_updatedat_trigger') THEN
    CREATE TRIGGER project_updatedat_trigger
    BEFORE UPDATE ON "Project"
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'blog_updatedat_trigger') THEN
    CREATE TRIGGER blog_updatedat_trigger
    BEFORE UPDATE ON "Blog"
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'video_updatedat_trigger') THEN
    CREATE TRIGGER video_updatedat_trigger
    BEFORE UPDATE ON "Video"
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'skill_updatedat_trigger') THEN
    CREATE TRIGGER skill_updatedat_trigger
    BEFORE UPDATE ON "Skill"
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'settings_updatedat_trigger') THEN
    CREATE TRIGGER settings_updatedat_trigger
    BEFORE UPDATE ON "settings"
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END$$;
