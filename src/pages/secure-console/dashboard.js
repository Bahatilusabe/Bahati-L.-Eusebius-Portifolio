import cookie from 'cookie';
import { verifyToken } from '../../lib/auth';
import Layout from '../../components/dashboard/Layout';
import Link from 'next/link';
import prisma from '../../lib/prisma';

function SparkBar({ values = [], height = 36, color = 'var(--accent)' }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  const w = Math.max(120, values.length * 8);
  const barWidth = Math.max(6, Math.floor(w / values.length) - 4);
  const gap = 4;
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {values.map((v, i) => {
        const h = Math.round((v / max) * (height - 6));
        const x = i * (barWidth + gap);
        const y = height - h;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} rx={2} fill={color} opacity={0.92} />;
      })}
    </svg>
  );
}

function MetricCard({ title, value, hint, values, href }) {
  return (
    <Link href={href || '#'} className="glass-card metric-link" style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
          <div className="stat-value" style={{ marginTop: 8, fontWeight: 900 }}>{value}</div>
          {hint ? <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{hint}</div> : null}
        </div>
        <div style={{ width: 140, minWidth: 120 }}>
          <SparkBar values={values} />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard({ user, stats, recent }) {
  const values = [stats.projects || 0, stats.blogs || 0, stats.videos || 0, stats.skills || 0, stats.messages || 0];
  return (
    <Layout>
      <div className="page-grid">
        <div className="stats-grid">
          <MetricCard href="/secure-console/projects" title="Projects" value={stats.projects} hint="Total projects" values={values.map((v, i) => (i === 0 ? v : Math.round(v * 0.6)))} />
          <MetricCard href="/secure-console/blogs" title="Blogs" value={stats.blogs} hint="Total blog posts" values={values.map((v, i) => (i === 1 ? v : Math.round(v * 0.4)))} />
          <MetricCard href="/secure-console/videos" title="Videos" value={stats.videos} hint="Total videos" values={values.map((v, i) => (i === 2 ? v : Math.round(v * 0.3)))} />
          <MetricCard href="/secure-console/skills" title="Skills" value={stats.skills} hint="Skills recorded" values={values.map((v, i) => (i === 3 ? v : Math.round(v * 0.25)))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          <section className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Activity</h3>
              <div className="muted">Recent events</div>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              {recent.length === 0 ? (
                <div className="messages-empty">No recent activity</div>
              ) : recent.map((it) => (
                <div key={it.id} className="preview-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{it.title || it.name || it.slug}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{it.type} — {new Date(it.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {it.type === 'Message' ? <Link href={`/secure-console/messages/${it.id}`} className="tab-like">Open</Link> : <Link href={`/secure-console/${it.type.toLowerCase()}s`} className="tab-like">Manage</Link>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card">
            <h3 style={{ margin: 0 }}>Overview</h3>
            <div className="muted" style={{ marginTop: 8 }}>Relative distribution across content types</div>
            <div style={{ marginTop: 12 }}>
              <SparkBar values={values} height={60} color="rgba(67,231,255,0.9)" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
                <div className="muted">Projects</div>
                <div className="muted">Blogs</div>
                <div className="muted">Videos</div>
                <div className="muted">Skills</div>
                <div className="muted">Messages</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const cookieHeader = req.headers.cookie || '';
  const parsed = cookie.parse(cookieHeader || '');
  const token = parsed.token || null;
  if (!token) {
    return {
      redirect: {
        destination: '/secure-console/login',
        permanent: false,
      },
    };
  }

  // First verify the token; if invalid redirect to login
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return {
      redirect: {
        destination: '/secure-console/login',
        permanent: false,
      },
    };
  }

  // Then query DB for stats; if DB fails, return safe fallback props so the
  // dashboard can still render for an authenticated admin.
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[dashboard.getServerSideProps] about to query counts from DB');
    }
    const [projects, blogs, videos, skills, messages] = await Promise.all([
      prisma.project.count(),
      prisma.blog.count(),
      prisma.video.count(),
      prisma.skill.count(),
      prisma.message.count(),
    ]);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[dashboard.getServerSideProps] counts=', { projects, blogs, videos, skills, messages });
    }

    const [recentProjects, recentBlogs, recentVideos, recentMessages] = await Promise.all([
      prisma.project.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, createdAt: true } }),
      prisma.blog.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, createdAt: true, slug: true } }),
      prisma.video.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, createdAt: true, slug: true } }),
      prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, name: true, createdAt: true } }),
    ]);

    const recent = [
      ...recentMessages.map((m) => ({ id: m.id, type: 'Message', name: m.name, createdAt: m.createdAt })),
      ...recentProjects.map((p) => ({ id: p.id, type: 'Project', title: p.title, createdAt: p.createdAt })),
      ...recentBlogs.map((b) => ({ id: b.id, type: 'Blog', title: b.title, createdAt: b.createdAt })),
      ...recentVideos.map((v) => ({ id: v.id, type: 'Video', title: v.title, createdAt: v.createdAt })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return {
      props: {
        user: payload,
        stats: { projects, blogs, videos, skills, messages },
        recent,
      },
    };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[dashboard.getServerSideProps] DB query failed, returning fallback props, error=', err && (err.stack || err.message || err));
    }
    return {
      props: {
        user: payload,
        stats: { projects: 0, blogs: 0, videos: 0, skills: 0, messages: 0 },
        recent: [],
      },
    };
  }
}
