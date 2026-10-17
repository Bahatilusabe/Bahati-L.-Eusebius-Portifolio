import prisma from './prisma';

const DEFAULT_TTL = Number(process.env.DATA_CACHE_TTL || 30) * 1000; // ms

function getGlobalCache() {
  if (!globalThis.__DATA_CACHE) globalThis.__DATA_CACHE = new Map();
  return globalThis.__DATA_CACHE;
}

async function cached(key, fn, ttl = DEFAULT_TTL) {
  const cache = getGlobalCache();
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expires > now) return entry.value;
  try {
    const value = await fn();
    cache.set(key, { value, expires: now + ttl });
    return value;
  } catch (err) {
    // don't overwrite a still-valid cache on error
    if (entry) return entry.value;
    throw err;
  }
}

export async function getSettings() {
  return cached('settings', async () => {
    const s = await prisma.settings.findFirst();
    return s || null;
  });
}

export async function getProjects({ limit = 10, page = 1 } = {}) {
  const offset = (page - 1) * limit;
  return cached(`projects:${page}:${limit}`, async () => {
    const items = await prisma.project.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    const total = await prisma.project.count({ where: { published: true } });
    return { items, total };
  });
}

export async function getBlogs({ limit = 10, page = 1 } = {}) {
  const offset = (page - 1) * limit;
  return cached(`blogs:${page}:${limit}`, async () => {
    const items = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    const total = await prisma.blog.count({ where: { published: true } });
    return { items, total };
  });
}

export async function getVideos({ limit = 10, page = 1 } = {}) {
  const offset = (page - 1) * limit;
  return cached(`videos:${page}:${limit}`, async () => {
    const items = await prisma.video.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    const total = await prisma.video.count({ where: { published: true } });
    return { items, total };
  });
}

export async function getSkills() {
  return cached('skills', async () => {
    const items = await prisma.skill.findMany({ orderBy: { level: 'desc' } });
    return items;
  });
}

export async function getNavigation() {
  // Keep a small static nav but allow CMS override via Settings
  return cached('navigation', async () => {
    return [
      { id: 'home', label: 'Home' },
      { id: 'about', label: 'About Me' },
      { id: 'projects', label: 'Projects' },
      { id: 'blogs', label: 'Blogs' },
      { id: 'videos', label: 'Videos' },
      { id: 'skills', label: 'Skills' },
      { id: 'contact', label: 'Contacts' },
    ];
  });
}

const api = {
  getSettings,
  getProjects,
  getBlogs,
  getVideos,
  getSkills,
  getNavigation,
};

export default api;
