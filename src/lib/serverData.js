import prisma, { PRISMA_STUB } from './prisma';
import { fileDb } from './fileDb';

function firstValue(value) {
  if (Array.isArray(value)) return firstValue(value[0]);
  return value == null || value === '' ? null : value;
}

function normalizeProject(project) {
  const githubUrl = firstValue(project.githubUrl);
  const visibility = firstValue(project.repoVisibility);

  return {
    id: project.id,
    slug: firstValue(project.slug) || project.id,
    title: firstValue(project.title) || firstValue(project.name) || 'Untitled project',
    summary: firstValue(project.summary) || firstValue(project.shortDescription) || firstValue(project.description) || '',
    description: firstValue(project.description) || '',
    technologies: Array.isArray(project.technologies)
      ? project.technologies.filter((technology) => typeof technology === 'string' && technology.trim())
      : Array.isArray(project.stack)
        ? project.stack.filter((technology) => typeof technology === 'string' && technology.trim())
        : [],
    githubUrl,
    liveUrl: firstValue(project.liveUrl),
    demoVideoUrl: firstValue(project.demoVideoUrl) || firstValue(project.demoUrl),
    repoVisibility: visibility === 'private' || (!visibility && !githubUrl) ? 'private' : 'public',
    coverImage: firstValue(project.coverImage) || firstValue(project.thumbnail) || null,
    featured: Boolean(project.featured),
    published: project.published === true
      || (typeof project.published !== 'boolean' && String(project.status || '').toLowerCase() === 'published'),
  };
}

// Simple in-memory cache with TTL. Suitable for single-instance deployments
// and development. TTL is in seconds.
const cache = new Map();

export function invalidateProjectsCache() {
  for (const key of cache.keys()) {
    if (key.startsWith('projects:')) cache.delete(key);
  }
}

export function invalidateBlogsCache() {
  for (const key of cache.keys()) {
    if (key.startsWith('blogs:') || key.startsWith('blog:')) cache.delete(key);
  }
}

function cacheKey(name, params) {
  return `${name}:${JSON.stringify(params || {})}`;
}

async function withCache(name, params, ttlSeconds, fn) {
  const key = cacheKey(name, params);
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) {
    return entry.value;
  }

  const value = await fn();
  const expiresAt = now + (ttlSeconds || 30) * 1000;
  cache.set(key, { value, expiresAt });
  return value;
}

export async function getProjects(options = {}) {
  const { limit = 50 } = options;
  return withCache('projects', { limit }, 30, async () => {
    if (PRISMA_STUB) {
      const rows = fileDb.list('projects') || [];
      return rows
        .filter((project) => project.published === true
          || (typeof project.published !== 'boolean' && String(project.status || '').toLowerCase() === 'published'))
        .slice(0, limit)
        .map(normalizeProject);
    }

    try {
      const rows = await prisma.project.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return rows.map(normalizeProject);
    } catch (err) {
      console.warn('getProjects: database unavailable, returning empty list', err && err.message);
      return [];
    }
  });
}

export async function getBlogs(options = {}) {
  const { limit = 10 } = options;
  return withCache('blogs', { limit }, 30, async () => {
    if (PRISMA_STUB) {
      const rows = fileDb.list('blogs') || [];
      return rows
        .filter((b) => b.published === true)
        .slice(0, limit)
        .map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug || b.id,
        category: b.category || 'General',
        tags: Array.isArray(b.tags) ? b.tags : [],
        excerpt: b.summary || (b.content ? b.content.slice(0, 200) : ''),
        coverImage: b.coverImage || null,
        url: `/blog/${b.slug || b.id}`,
        createdAt: b.createdAt || null,
      }));
    }

    try {
      const rows = await prisma.blog.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return rows.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug || b.id,
        category: b.category || 'General',
        tags: Array.isArray(b.tags) ? b.tags : [],
        excerpt: b.summary || (b.content ? b.content.slice(0, 200) : ''),
        coverImage: b.coverImage || null,
        url: `/blog/${b.slug || b.id}`,
        createdAt: b.createdAt || null,
      }));
    } catch (err) {
      console.warn('getBlogs: database unavailable, returning empty list', err && err.message);
      return [];
    }
  });
}

export async function getBlogBySlug(slug) {
  if (!slug) return null;

  return withCache('blog', { slug }, 30, async () => {
    try {
      const blog = PRISMA_STUB
        ? (fileDb.list('blogs') || []).find((item) => (item.slug === slug || item.id === slug) && item.published === true)
        : await prisma.blog.findFirst({ where: { OR: [{ slug }, { id: slug }], published: true } });

      if (!blog) return null;
      return {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        category: blog.category || 'General',
        tags: Array.isArray(blog.tags) ? blog.tags : [],
        summary: blog.summary || '',
        content: blog.content || '',
        coverImage: blog.coverImage || null,
        createdAt: blog.createdAt || null,
      };
    } catch (err) {
      console.warn('getBlogBySlug: database unavailable', err && err.message);
      return null;
    }
  });
}

export async function getVideos(options = {}) {
  const { limit = 20 } = options;
  return withCache('videos', { limit }, 30, async () => {
    if (PRISMA_STUB) {
      const rows = fileDb.list('videos') || [];
      return rows.slice(0, limit).map((v) => ({
        title: v.title,
        description: v.description || '',
        thumbnail: v.thumbnail || null,
        url: v.url,
        slug: v.slug,
        id: v.id,
      }));
    }

    try {
      const rows = await prisma.video.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return rows.map((v) => ({
        title: v.title,
        description: v.description || '',
        thumbnail: v.thumbnail || null,
        url: v.url,
        slug: v.slug,
        id: v.id,
      }));
    } catch (err) {
      console.warn('getVideos: database unavailable, returning empty list', err && err.message);
      return [];
    }
  });
}

export async function getSkills(options = {}) {
  const { limit = 100 } = options;
  return withCache('skills', { limit }, 60, async () => {
    if (PRISMA_STUB) {
      const rows = fileDb.list('skills') || [];
      return rows.slice(0, limit).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category || null,
        level: s.level,
      }));
    }

    try {
      const rows = await prisma.skill.findMany({
        orderBy: { level: 'desc' },
        take: limit,
      });

      return rows.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category || null,
        level: s.level,
      }));
    } catch (err) {
      console.warn('getSkills: database unavailable, returning empty list', err && err.message);
      return [];
    }
  });
}

export async function getSettings() {
  return withCache('settings', {}, 60, async () => {
    if (PRISMA_STUB) {
      const s = fileDb.list('settings')[0] || null;
      return s;
    }
    try {
      const s = await prisma.settings.findFirst({});
      return s || null;
    } catch (err) {
      console.warn('getSettings: database unavailable, returning null', err && err.message);
      return null;
    }
  });
}

export function clearCache() {
  cache.clear();
}
