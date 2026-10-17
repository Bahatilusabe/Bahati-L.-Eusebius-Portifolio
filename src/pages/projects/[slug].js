import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '../../components/dashboard/Layout';
import { ArrowUpRight, Lock } from 'lucide-react';

export default function ProjectView({ project: ssrProject, canonicalUrl: ssrCanonical }) {
  const [project, setProject] = useState(ssrProject || null);
  const [loading, setLoading] = useState(!ssrProject);
  const [error, setError] = useState(null);
  const [canonicalUrl, setCanonicalUrl] = useState(ssrCanonical || null);

  useEffect(() => {
    if (ssrProject) return;
    let mounted = true;
    async function fetchProject() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(window.location.pathname.split('/').pop())}`);
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        if (mounted) setProject(json);
      } catch (err) {
        if (mounted) setError(err && err.message ? err.message : 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProject();
    return () => { mounted = false; };
  }, [ssrProject]);

  if (!project && loading) {
    return (
      <Layout>
        <div style={{ padding: 40 }}>
          <h2>Loading...</h2>
        </div>
      </Layout>
    );
  }

  if (!project && error) {
    return (
      <Layout>
        <div style={{ padding: 40 }}>
          <h2>Project not found</h2>
          <p className="muted">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{project?.title || 'Project'}</title>
        <meta name="description" content={(project && (project.summary || project.description)) || 'Project details'} />
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      </Head>
      <div className="project-detail-layout">
        <main>
          <article className="glass-card project-detail-card">
            <h1>{project?.title}</h1>
            {project && (project.coverImage || project.thumbnail) ? (
              (() => {
                const src = project.coverImage || project.thumbnail;
                if (typeof src === 'string' && src.startsWith('/')) {
                  return (
                    <div className="project-detail-cover">
                      <Image src={src} alt={`${project.title} project preview`} sizes="(max-width: 900px) 100vw, 1200px" fill priority style={{ objectFit: 'cover' }} />
                    </div>
                  );
                }
                // eslint-disable-next-line @next/next/no-img-element
                return <div className="project-detail-cover"><img src={src} alt={`${project.title} project preview`} /></div>;
              })()
            ) : (
              <div className="project-detail-cover project-detail-cover--empty">Project image unavailable</div>
            )}

            <section className="project-detail-section" aria-labelledby="project-summary-title">
              <h2 id="project-summary-title">Summary</h2>
              <p>{project?.summary || project?.description || 'Project details coming soon.'}</p>
              {project?.summary && project?.description && project.summary !== project.description
                ? <p className="project-detail-description">{project.description}</p>
                : null}
            </section>

            <section className="project-detail-section" aria-labelledby="project-tech-title">
              <h2 id="project-tech-title">Technology stack</h2>
              <div className="portfolio-chip-row">
                {(project?.technologies || []).length
                  ? project.technologies.map((technology) => <span key={technology} className="portfolio-chip">{technology}</span>)
                  : <span className="muted">Technology stack not listed</span>}
              </div>
            </section>

            <section className="project-detail-visibility" aria-label="Repository visibility">
              <span>Repository visibility</span>
              <div className={`portfolio-project-visibility is-${project?.repoVisibility || 'public'}`}>
                <Lock className="h-3.5 w-3.5" />
                {project?.repoVisibility === 'private' ? 'Private repository' : 'Public repository'}
              </div>
            </section>

            <section className="project-detail-section" aria-labelledby="project-links-title">
              <h2 id="project-links-title">Project links</h2>
              <div className="project-detail-links">
                {project?.liveUrl
                  ? <a href={project.liveUrl} target="_blank" rel="noreferrer" className="tab-like">Live site <ArrowUpRight className="h-4 w-4" /></a>
                  : <span className="tab-like is-disabled">Live site unavailable</span>}
                {project?.githubUrl && project?.repoVisibility !== 'private'
                  ? <a href={project.githubUrl} target="_blank" rel="noreferrer" className="tab-like">GitHub <ArrowUpRight className="h-4 w-4" /></a>
                  : <span className="tab-like is-disabled">{project?.repoVisibility === 'private' ? 'GitHub private' : 'GitHub unavailable'}</span>}
                {project?.demoVideoUrl
                  ? <a href={project.demoVideoUrl} target="_blank" rel="noreferrer" className="tab-like">Demo video <ArrowUpRight className="h-4 w-4" /></a>
                  : <span className="tab-like is-disabled">Demo video unavailable</span>}
              </div>
            </section>

            {project?.gallery && project.gallery.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <h4>Gallery</h4>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {project.gallery.map((g, i) => (
                    <div key={i} style={{ width: 160, height: 100, position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
                      {typeof g === 'string' && g.startsWith('/') ? (
                        <Image src={g} alt={`gallery-${i}`} fill sizes="160px" style={{ objectFit: 'cover' }} />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g} alt={`gallery-${i}`} style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </main>

        <aside>
          <div className="glass-card project-detail-aside">
            <h2>Portfolio status</h2>
            <p className="muted">{project?.published ? 'Published on the portfolio' : 'Draft'}</p>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const { slug } = ctx.params || {};
  if (!slug) return { props: { project: null } };

  // Attempt to fetch by slug; API supports id param, but if slug is not id we'll try to search
  try {
    const proto = ctx.req.headers['x-forwarded-proto'] || 'http';
    const host = ctx.req.headers.host;
    const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;

    const res = await fetch(`${base}/api/projects/${encodeURIComponent(slug)}`);
    if (res.status === 404) return { props: { project: null } };
    if (!res.ok) throw new Error(`Project request failed with status ${res.status}`);

    const project = await res.json();
    const canonicalSlug = project.slug || project.id;
    const canonical = `${base}/projects/${canonicalSlug}`;
    if (canonicalSlug !== slug) return { redirect: { destination: canonical, permanent: true } };
    return { props: { project, canonicalUrl: canonical } };
  } catch (err) {
    console.error('getServerSideProps project view error', err && err.message);
    return { props: { project: null } };
  }
}
