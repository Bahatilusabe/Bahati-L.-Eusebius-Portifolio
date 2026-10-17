import prisma, { PRISMA_STUB } from '../../../../lib/prisma';
import cookie from 'cookie';
import { verifyToken } from '../../../../lib/auth';
import { fileDb } from '../../../../lib/fileDb';
import { clearCache } from '../../../../lib/serverData';

export default async function handler(req, res) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    if (PRISMA_STUB) {
      const s = fileDb.list('settings')[0] || null;
      return res.json({ settings: s || null });
    }

    const settings = await prisma.settings.findFirst();
    return res.json({ settings: settings || null });
  }

  if (req.method === 'POST') {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      let json = {};
      if (body && typeof body === 'string') {
        const t = body.trim();
        if (t.startsWith('{') || t.startsWith('[')) {
          try { json = JSON.parse(body); } catch (e) { console.error('Invalid JSON body', e); return res.status(400).json({ error: 'Invalid JSON' }); }
        } else if (t.length > 0) { console.error('Unexpected non-JSON body', t.slice(0,200)); return res.status(400).json({ error: 'Invalid JSON' }); }
      }
      // Accept expanded fields for dev mode: profile, socialLinks, theme, etc.
      const {
        siteTitle,
        description,
        profile,
        socialLinks,
        theme,
        homeBackground,
        welcomeTitle,
        heroName,
        heroSubtitle,
        passionText,
        introductionText,
        contactPhone,
        contactEmail,
        aboutContent,
      } = json;

      if (aboutContent != null && (typeof aboutContent !== 'object' || Array.isArray(aboutContent))) {
        return res.status(400).json({ error: 'About content must be an object' });
      }

      if (PRISMA_STUB) {
        // Persist into file-backed offline DB for development.
        const existing = fileDb.list('settings')[0] || null;
        if (existing) {
          const updated = fileDb.update('settings', existing.id, {
            siteTitle: siteTitle ?? existing.siteTitle ?? null,
            description: description ?? existing.description ?? null,
            profile: profile ?? existing.profile ?? null,
            socialLinks: socialLinks ?? existing.socialLinks ?? [],
            theme: theme ?? existing.theme ?? null,
            homeBackground: homeBackground ?? existing.homeBackground ?? null,
            welcomeTitle: welcomeTitle ?? existing.welcomeTitle ?? null,
            heroName: heroName ?? existing.heroName ?? null,
            heroSubtitle: heroSubtitle ?? existing.heroSubtitle ?? null,
            passionText: passionText ?? existing.passionText ?? null,
            introductionText: introductionText ?? existing.introductionText ?? null,
            contactPhone: contactPhone ?? existing.contactPhone ?? null,
            contactEmail: contactEmail ?? existing.contactEmail ?? null,
            aboutContent: aboutContent ?? existing.aboutContent ?? null,
          });
          clearCache();
          return res.json({ ok: true, settings: updated });
        }

        const created = fileDb.create('settings', {
          id: 'default',
          siteTitle: siteTitle ?? null,
          description: description ?? null,
          profile: profile ?? null,
          socialLinks: socialLinks ?? [],
          theme: theme ?? null,
          homeBackground: homeBackground ?? null,
          welcomeTitle: welcomeTitle ?? null,
          heroName: heroName ?? null,
          heroSubtitle: heroSubtitle ?? null,
          passionText: passionText ?? null,
          introductionText: introductionText ?? null,
          contactPhone: contactPhone ?? null,
          contactEmail: contactEmail ?? null,
          aboutContent: aboutContent ?? null,
        });
        clearCache();
        return res.json({ ok: true, settings: created });
      }

      const s = await prisma.settings.upsert({
        where: { id: 'default' },
        update: {
          siteTitle: siteTitle ?? undefined,
          description: description ?? undefined,
          homeBackground: homeBackground ?? undefined,
          welcomeTitle: welcomeTitle ?? undefined,
          heroName: heroName ?? undefined,
          heroSubtitle: heroSubtitle ?? undefined,
          passionText: passionText ?? undefined,
          introductionText: introductionText ?? undefined,
          contactPhone: contactPhone ?? undefined,
          contactEmail: contactEmail ?? undefined,
          aboutContent: aboutContent === undefined ? undefined : aboutContent,
          socialLinks: socialLinks ?? undefined,
        },
        create: {
          id: 'default',
          siteTitle: siteTitle ?? null,
          description: description ?? null,
          homeBackground: homeBackground ?? null,
          welcomeTitle: welcomeTitle ?? null,
          heroName: heroName ?? null,
          heroSubtitle: heroSubtitle ?? null,
          passionText: passionText ?? null,
          introductionText: introductionText ?? null,
          contactPhone: contactPhone ?? null,
          contactEmail: contactEmail ?? null,
          aboutContent: aboutContent ?? undefined,
          socialLinks: socialLinks ?? [],
        },
      });
      clearCache();
      return res.json({ ok: true, settings: s });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end('Method Not Allowed');
}
