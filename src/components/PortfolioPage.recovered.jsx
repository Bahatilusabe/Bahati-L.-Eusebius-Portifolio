// Recovered PortfolioPage reconstructed from the running .next SSR chunk
// Review this file and replace src/components/PortfolioPage.jsx with it if it matches your previous work.

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Briefcase, BookOpenText, Mail, ShieldCheck } from 'lucide-react';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="portfolio-section-header">
      <div className="portfolio-section-badge">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{eyebrow}</span>
      </div>
      <h2 className="sci-title">{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function HomeTab({ settings }) {
  return (
    <section className="portfolio-home-panel" aria-label="Home tab">
      <h1>{settings?.siteTitle || 'Bahati L. Eusebius'}</h1>
      <p>{settings?.description || 'Software developer and cybersecurity enthusiast.'}</p>
      <p>
        <a href="/Bahati-L-Eusebius-CV.txt" download>
          Download Resume
        </a>
      </p>
    </section>
  );
}

function ProjectsTab({ projects }) {
  return (
    <section>
      <SectionHeader icon={Briefcase} eyebrow="Projects" title="Projects" description="Selected work." />
      <div className="grid">
        {(projects || []).map((p) => (
          <article key={p.id ?? p.title} className="card">
            <h3>{p.title}</h3>
            {p.description ? <p>{p.description}</p> : null}
            <div className="meta">{(p.technologies || p.stack || []).join(', ')}</div>
            {p.liveUrl ? (
              <a href={p.liveUrl} target="_blank" rel="noreferrer">
                Live <ArrowUpRight />
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function BlogsTab({ blogs }) {
  return (
    <section>
      <SectionHeader icon={BookOpenText} eyebrow="Blogs" title="Blogs & Writing" description="Recent posts." />
      <ul>
        {(blogs || []).map((b) => (
          <li key={b.id ?? b.slug}>
            <a href={b.url || `/blog/${b.slug}`}>{b.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VideosTab({ videos }) {
  return (
    <section>
      <SectionHeader icon={ShieldCheck} eyebrow="Videos" title="Videos" description="Demos and walkthroughs." />
      <ul>
        {(videos || []).map((v) => (
          <li key={v.id ?? v.slug}>
            <a href={v.url} target="_blank" rel="noreferrer">
              {v.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkillsTab({ skills }) {
  return (
    <section>
      <SectionHeader icon={ShieldCheck} eyebrow="Skills" title="Skills" description="Technical competencies." />
      <div className="grid">
        {(skills || []).map((s) => (
          <div key={s.id ?? s.name} className="card">
            <strong>{s.name}</strong>
            <div>{s.level ?? s.proficiency ?? ''}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactsTab({ contactMethods = [], socialLinks = [] }) {
  return (
    <section>
      <SectionHeader icon={Mail} eyebrow="Contact" title="Get in touch" description="Reach out for work or collaboration." />
      <div>
        {(contactMethods || []).map((c) => (
          <div key={c.label}>
            <a href={c.href || '#'}>
              {c.label}: {c.value}
            </a>
          </div>
        ))}
      </div>
      <div>
        {(socialLinks || []).map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
            {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}

export function PortfolioPage(props) {
  const {
    navigation = [
      { id: 'home', label: 'Home' },
      { id: 'projects', label: 'Projects' },
      { id: 'blogs', label: 'Blogs' },
      { id: 'videos', label: 'Videos' },
      { id: 'skills', label: 'Skills' },
      { id: 'contact', label: 'Contact' },
    ],
    projects = [],
    blogs = [],
    videos = [],
    skills = [],
    socialLinks = [],
    contactMethods = [],
    settings = {},
  } = props || {};

  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = useMemo(
    () => ({
      home: <HomeTab settings={settings} />,
      projects: <ProjectsTab projects={projects} />,
      blogs: <BlogsTab blogs={blogs} />,
      videos: <VideosTab videos={videos} />,
      skills: <SkillsTab skills={skills} />,
      contact: <ContactsTab contactMethods={contactMethods} socialLinks={socialLinks} />,
    }),
    [projects, blogs, videos, skills, socialLinks, contactMethods, settings]
  );

  return (
    <div className="portfolio-app-page">
      <nav className="portfolio-tab-bar" aria-label="Primary">
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              setActiveTab(item.id);
              setTimeout(() => setLoading(false), 120);
            }}
            className={classNames('portfolio-tab-button', activeTab === item.id && 'is-active')}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="portfolio-panel-stage">
        {loading ? <div>Loading…</div> : error ? <div>Error: {String(error)}</div> : tabs[activeTab]}
      </main>
    </div>
  );
}
