import prisma, { PRISMA_STUB } from '../../../lib/prisma';
import { fileDb } from '../../../lib/fileDb';

export default async function handler(req, res) {
  const { slug } = req.query || {};
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    if (PRISMA_STUB) {
      const project = fileDb.get('projects', slug) || fileDb.list('projects').find((p) => p.slug === slug || p.id === slug) || null;
      if (!project || !project.published) return res.status(404).json({ error: 'Not found' });
      // normalize thumbnail -> coverImage for public clients
      if (!project.coverImage && project.thumbnail) project.coverImage = project.thumbnail;
      return res.json({
        ...project,
        githubUrl: project.repoVisibility === 'private' ? null : project.githubUrl,
      });
    }

    // Try find by id first, then by slug
    let project = await prisma.project.findFirst({ where: { id: slug, published: true } });
    if (!project) project = await prisma.project.findFirst({ where: { slug, published: true } });
    if (!project) return res.status(404).json({ error: 'Not found' });
    return res.json({
      ...project,
      githubUrl: project.repoVisibility === 'private' ? null : project.githubUrl,
    });
  } catch (err) {
    console.error('public project api error', err && err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
