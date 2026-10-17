import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  BookOpenText,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Download,
} from "lucide-react";
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";

import {
  navigation as staticNavigation,
  aboutSummary as staticAboutSummary,
  capabilityGroups as staticCapabilityGroups,
  toolbelt as staticToolbelt,
  certifications as staticCertifications,
  projects as staticProjects,
  blogs as staticBlogs,
  contactMethods as staticContactMethods,
  socialLinks as staticSocialLinks,
} from '@/data/siteContent';

// No module-level mutable state — components will receive data via props.

// siteContent is the legacy fallback for client-side navigation or when
// server-side props are not available. We'll accept server props to render
// database-driven content via SSR.

const socialIconMap = {
  facebook: FaFacebookF,
  github: FaGithub,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  twitter: FaXTwitter,
  whatsapp: FaWhatsapp,
};

const homeBackgroundCandidates = [
  "/background_image.png",
  "/home-reference-shared.png",
  "/d2ab966b-2e4b-405b-a112-7edf88584360%20(1).png",
  "/d2ab966b-2e4b-405b-a112-7edf88584360 (1).png",
];

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function normalizeCredentials(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (
      typeof item === "string"
        ? { title: item, issuer: "", badgeImage: "", credentialUrl: "" }
        : {
            title: typeof item?.title === "string" ? item.title : "",
            issuer: typeof item?.issuer === "string" ? item.issuer : "",
            badgeImage: typeof item?.badgeImage === "string" ? item.badgeImage : "",
            credentialUrl: typeof item?.credentialUrl === "string" ? item.credentialUrl : "",
          }
    ))
    .filter((item) => item.title.trim());
}

function CredentialBadge({ credential }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className="portfolio-credential-badge" aria-hidden="true">
      {!credential.badgeImage || imageFailed ? <Award /> : null}
      {credential.badgeImage && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={credential.badgeImage} alt="" loading="lazy" onError={() => setImageFailed(true)} />
      ) : null}
    </span>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  const isAboutTitle = title === "Building secure, useful digital products";
  const titleWords = isAboutTitle ? title.split(/(\s+)/) : [];

  return (
    <div className="portfolio-section-header">
      <div className="portfolio-section-badge">
        <Icon className="h-4 w-4" />
        <span>{eyebrow}</span>
      </div>
      <h2 className={classNames("sci-title", isAboutTitle && "about-animated-title")} aria-label={title}>
        {isAboutTitle ? (
          <span aria-hidden="true">
            {titleWords.map((word, wordIndex) => (
              /^\s+$/.test(word) ? word : (
                <span
                  className="about-title-word"
                  key={`${word}-${wordIndex}`}
                  style={{ display: "inline-block", whiteSpace: "nowrap" }}
                >
                  {Array.from(word).map((character, characterIndex) => (
                    <span
                      key={`${character}-${characterIndex}`}
                      className="about-title-char sci-gradient"
                      style={{ "--char-index": characterIndex + wordIndex }}
                    >
                      {character}
                    </span>
                  ))}
                </span>
              )
            ))}
          </span>
        ) : title}
      </h2>
      <p>{description}</p>
    </div>
  );
}

function HomeTab({ backgroundReady, backgroundUrl, socialLinks, settings }) {
  const backgroundSource = settings?.homeBackground || backgroundUrl;
  const backgroundStyle = backgroundSource
    ? {
        "--home-background-image": `url("${backgroundSource}")`,
      }
    : undefined;

  const heroName = settings?.heroName || "Bahati L. Eusebius";
  const passionText = settings?.passionText || "A passionate freelancer, software developer, ethical hacker, and cybersecurity enthusiast.";
  const welcomeTitle = settings?.welcomeTitle || "WELCOME TO MY WEBSITE";
  const welcomeSubtitle = settings?.heroSubtitle || "Explore my work, projects, and security-first thinking.";
  const introductionText = settings?.introductionText || "I specialize in building secure, intelligent systems and crafting innovative solutions that protect and empower digital environments. My work blends coding, cybersecurity expertise, and problem-solving to deliver impactful results for clients and projects.";
  const contactPhone = settings?.contactPhone || "+254 769101739";
  const contactEmail = settings?.contactEmail || "bahatieusebius@gmail.com";

  return (
    <section className="portfolio-home-panel" style={backgroundStyle} aria-label="Home tab">
      {!backgroundReady ? (
        <div className="home-fallback-note">
          <p>The home background image still could not be loaded from `public/`.</p>
          <p>The app is checking the shared image file automatically, including the current filename.</p>
        </div>
      ) : null}

      <div className="portfolio-hero">
        <div className="hero-content">
          <div className="hero-title-card" role="region" aria-label="Hero title card">
            <h1 className="hero-title">
              <span className="name-line">I’m</span>
              <span className="name-line"><span className="hero-name">{heroName}</span></span>
            </h1>
          </div>

          <div className="passion-card" role="region" aria-label="Passion card">
            <p className="passion-text">{passionText}</p>
            <p className="specialize-text"><strong>I specialize</strong> in building secure, intelligent systems and crafting innovative solutions that protect and empower digital environments. My work blends coding, cybersecurity expertise, and problem-solving to deliver impactful results for clients and projects.</p>
          </div>

          <div className="welcome-card" role="region" aria-label="Welcome message">
            <div className="welcome-content">
              <h3 className="welcome-title" aria-label={welcomeTitle}>
                <span aria-hidden="true">
                  {Array.from(welcomeTitle).map((character, index) => (
                    character === " "
                      ? " "
                      : (
                        <span
                          key={`${character}-${index}`}
                          className="welcome-title-char sci-gradient"
                          style={{ "--char-index": index }}
                        >
                          {character}
                        </span>
                      )
                  ))}
                </span>
              </h3>
              <p className="welcome-sub">{welcomeSubtitle}</p>
            </div>
          </div>

          <div className="hero-contacts">
            <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="contact-pill contact-pill--accent tab-like">
              <Phone className="h-4 w-4" />
              <span>{contactPhone}</span>
            </a>

            <a href={`mailto:${contactEmail}`} className="contact-pill contact-pill--accent tab-like">
              <Mail className="h-4 w-4" />
              <span>{contactEmail}</span>
            </a>
          </div>

          <div className="resume-card" role="region" aria-label="Resume download">
            <div className="welcome-content">
              <a href="/Bahati-L-Eusebius-CV.txt" download className="resume-btn tab-like is-active">
                <Download className="h-4 w-4" />
                <span className="tab-animated">My Resume</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="portfolio-home-socialbar" aria-label="Social links">
        {socialLinks.map((item) => {
          const Icon = socialIconMap[item.icon];

          if (!item.href) {
            return (
              <div
                key={item.label}
                className="portfolio-home-sociallink is-placeholder"
                aria-label={`${item.label} placeholder`}
                title={`Add your ${item.label} URL to enable this icon`}
              >
                <Icon className="h-5 w-5" />
              </div>
            );
          }

          return (
            <a
              key={item.label}
              href={item.href}
              className="portfolio-home-sociallink"
              target="_blank"
              rel="noreferrer"
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function AboutTab({ aboutSummary, capabilityGroups, toolbelt, certifications, aboutContent }) {
  const content = aboutContent || {};
  const displayedSummary = {
    biography: content.biography || aboutSummary.biography,
    mission: content.mission || aboutSummary.mission,
  };
  const displayedGroups = Array.isArray(content.capabilityGroups) ? content.capabilityGroups : capabilityGroups;
  const displayedToolbelt = Array.isArray(content.toolbelt) ? content.toolbelt : toolbelt;
  const displayedCertifications = normalizeCredentials(
    Array.isArray(content.certifications) ? content.certifications : certifications,
  );

  return (
    <section className="portfolio-panel-shell">
      <SectionHeader
        icon={UserRound}
        eyebrow="About Me"
        title={content.sectionTitle || "Building secure, useful digital products"}
        description={content.sectionDescription || "I bring software development and cybersecurity together to create practical solutions that protect data, solve real problems, and work reliably for the people who use them."}
      />

      <div className="portfolio-grid portfolio-grid--about-top">
        <article className="portfolio-card portfolio-card--feature">
          <div className="portfolio-card-kicker">Biography</div>
          <p className="portfolio-card-body">{displayedSummary.biography}</p>
        </article>

        <article className="portfolio-card portfolio-card--feature">
          <div className="portfolio-card-kicker">Mission</div>
          <p className="portfolio-card-body">{displayedSummary.mission}</p>
        </article>
      </div>

      <div className="portfolio-grid portfolio-grid--three">
        {displayedGroups.map((group) => (
          <article key={group.title} className="portfolio-card">
            <h3>{group.title}</h3>
            <ul className="portfolio-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="portfolio-grid portfolio-grid--about-bottom">
        <article className="portfolio-card">
          <h3>Tools</h3>
          <div className="portfolio-chip-row">
            {displayedToolbelt.map((tool) => (
              <span key={tool} className="portfolio-chip">
                {tool}
              </span>
            ))}
          </div>
        </article>

        <article className="portfolio-card">
          <h3>Certifications and Growth</h3>
          <ul className="portfolio-list">
            {displayedCertifications.map((item, index) => (
              <li key={`${item.title}-${index}`}>{item.title}</li>
            ))}
          </ul>
        </article>

        <article className="portfolio-card">
          <h3>Career Direction</h3>
          <p className="portfolio-card-body">
            {content.careerDirection || "Building secure intelligent products, contributing to advanced cybersecurity systems, and growing into complex infrastructure and defensive engineering leadership roles."}
          </p>
        </article>
      </div>
    </section>
  );
}

function ProjectCover({ src, title }) {
  if (!src) {
    return (
      <div className="portfolio-project-cover portfolio-project-cover--empty" aria-label={`${title} image unavailable`}>
        <BriefcaseBusiness className="h-8 w-8" />
      </div>
    );
  }

  if (typeof src === "string" && src.startsWith("/")) {
    return (
      <div className="portfolio-project-cover">
        <Image src={src} alt={`${title} project preview`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" style={{ objectFit: "cover" }} />
      </div>
    );
  }

  return (
    <div className="portfolio-project-cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${title} project preview`} loading="lazy" />
    </div>
  );
}

function ProjectsTab({ projects }) {
  return (
    <section className="portfolio-panel-shell">
      <SectionHeader
        icon={BriefcaseBusiness}
        eyebrow="Projects"
        title="Selected work, engineered for impact"
        description="Explore a selection of products and systems I've built, including the problems they solve, the approach behind them, and the technologies that bring them to life."
      />

      <div className="portfolio-grid portfolio-grid--projects">
        {projects.map((project) => {
          const title = project.title || project.name || "Untitled project";
          const image = project.coverImage || project.thumbnail || project.image;
          const technologies = Array.isArray(project.technologies)
            ? project.technologies
            : Array.isArray(project.stack)
              ? project.stack
              : [];
          const summary = project.summary || project.description || "Project details coming soon.";
          const repoVisibility = String(project.repoVisibility || (project.githubUrl ? "public" : "private")).toLowerCase() === "private"
            ? "private"
            : "public";
          const demoUrl = project.demoVideoUrl || project.demoUrl;
          const projectPageUrl = project.slug || project.id
            ? `/projects/${encodeURIComponent(project.slug || project.id)}`
            : null;

          return (
            <article key={project.id || project.slug || title} className="portfolio-card portfolio-card--project portfolio-project-card">
              <div className="portfolio-project-heading">
                <h3>{title}</h3>
                {project.status ? <span>{project.status}</span> : null}
              </div>
              <ProjectCover src={image} title={title} />
              <div className="portfolio-project-content">
                <p className="portfolio-card-body">{summary}</p>
                <div className="portfolio-chip-row" aria-label="Technology stack">
                  {technologies.length
                    ? technologies.map((item) => (
                      <span key={item} className="portfolio-chip">{item}</span>
                    ))
                    : <span className="portfolio-project-muted">Technology stack not listed</span>}
                </div>
                <div className="portfolio-project-meta">
                  <span className={`portfolio-project-visibility is-${repoVisibility}`}>
                    <Lock className="h-3.5 w-3.5" />
                    {repoVisibility === "public" ? "Public repository" : "Private repository"}
                  </span>
                </div>
                <div className="portfolio-project-links" aria-label={`${title} links`}>
                  {project.liveUrl ? (
                    <a href={project.liveUrl} target="_blank" rel="noreferrer" className="portfolio-project-link">
                      Live site <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : <span className="portfolio-project-link is-unavailable">Live site unavailable</span>}
                  {project.githubUrl && repoVisibility === "public" ? (
                    <a href={project.githubUrl} target="_blank" rel="noreferrer" className="portfolio-project-link">
                      GitHub <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : <span className="portfolio-project-link is-unavailable">{repoVisibility === "private" ? "GitHub private" : "GitHub unavailable"}</span>}
                  {demoUrl ? (
                    <a href={demoUrl} target="_blank" rel="noreferrer" className="portfolio-project-link">
                      Demo video <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : <span className="portfolio-project-link is-unavailable">Demo video unavailable</span>}
                  {projectPageUrl ? (
                    <a href={projectPageUrl} className="portfolio-project-link">
                      Project details <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BlogsTab({ blogs }) {
  const [adminSignedIn, setAdminSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/me')
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (mounted) setAdminSignedIn(data?.ok === true);
      })
      .catch((error) => console.error('check blog editor access', error?.message || error));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="portfolio-panel-shell">
      <SectionHeader
        icon={BookOpenText}
        eyebrow="Blogs"
        title="Ideas, insights, and perspectives"
        description="Explore practical ideas and thoughtful perspectives on software engineering, cybersecurity, and the technologies shaping what we build."
      />

      <div className="portfolio-grid portfolio-grid--blogs">
        {blogs.length ? blogs.map((post) => (
          <article key={post.id || post.slug || post.title} className="portfolio-card portfolio-card--blog">
            <div className="portfolio-blog-cover">
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImage} alt="" loading="lazy" />
              ) : (
                <BookOpenText aria-hidden="true" />
              )}
            </div>

            <div className="portfolio-blog-content">
              <h3>{post.title}</h3>
              <div className="portfolio-blog-meta">
                <span className="portfolio-blog-category">{post.category || "Article"}</span>
                {post.createdAt ? (
                  <time>{new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}</time>
                ) : null}
              </div>
              <p className="portfolio-card-body">{post.excerpt || "Read the article for more details."}</p>
              <div className="portfolio-blog-actions">
                {post.url ? (
                  <a href={post.url} className="portfolio-blog-link" aria-label={`Read ${post.title}`}>
                    Read article <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : (
                  <span className="portfolio-blog-link is-unavailable">Article coming soon</span>
                )}
                {adminSignedIn && post.id ? (
                  <a href={`/secure-console/blogs/edit?id=${encodeURIComponent(post.id)}`} className="portfolio-blog-edit">
                    Edit post
                  </a>
                ) : null}
              </div>
              {Array.isArray(post.tags) && post.tags.length ? (
                <div className="portfolio-blog-tags" aria-label="Article tags">
                  {post.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              ) : null}
            </div>
          </article>
        )) : (
          <p className="portfolio-blogs-empty">New articles are on the way. Check back soon.</p>
        )}
      </div>
    </section>
  );
}

function ContactsTab({ contactMethods, socialLinks, certifications }) {
  const credentials = normalizeCredentials(certifications);

  return (
    <section className="portfolio-panel-shell">
      <SectionHeader
        icon={Mail}
        eyebrow="Contacts"
        title="Open for secure and ambitious work"
        description="Have a project, a security challenge, or an idea worth building? Get in touch to discuss how we can turn it into a secure, reliable solution."
      />

      <div className="portfolio-grid portfolio-grid--contact">
        <article className="portfolio-card">
          <h3>Direct Reach</h3>
          <div className="portfolio-stack">
            {contactMethods.map((item) => {
              const Icon = item.icon === "phone" ? Phone : item.icon === "email" ? Mail : MapPin;
              const email = item.icon === "email"
                ? (item.value || item.href?.replace(/^mailto:/i, '') || '').trim()
                : '';
              const href = item.icon === "email" && email
                ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
                : item.href;

              return href ? (
                <a
                  key={item.label}
                  href={href}
                  className="portfolio-contact-link tab-like"
                  target={item.icon === "email" ? "_blank" : undefined}
                  rel={item.icon === "email" ? "noreferrer" : undefined}
                  aria-label={item.icon === "email"
                    ? `Email ${email} using Gmail (opens in a new tab)`
                    : item.icon === "phone"
                      ? `Call ${item.value}`
                      : item.label}
                >
                  <span className="portfolio-contact-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="portfolio-contact-copy">
                    <strong><span className="tab-animated">{item.label}</span></strong>
                    <small>{item.value}</small>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : (
                <div key={item.label} className="portfolio-contact-link tab-like is-placeholder" aria-hidden>
                  <span className="portfolio-contact-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="portfolio-contact-copy">
                    <strong><span className="tab-animated">{item.label}</span></strong>
                    <small>{item.value}</small>
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="portfolio-card">
          <h3>Social Dock</h3>
          <div className="portfolio-social-grid">
            {socialLinks.map((item) => {
              const Icon = socialIconMap[item.icon];

              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="portfolio-social-link tab-like"
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5" />
                    <span><span className="tab-animated">{item.label}</span></span>
                  </a>
                );
              }

              return (
                <div key={item.label} className="portfolio-social-link is-placeholder tab-like" aria-hidden>
                  <Icon className="h-5 w-5" />
                  <span><span className="tab-animated">{item.label}</span></span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="portfolio-card portfolio-card--credentials">
          <div className="portfolio-credentials-heading">
            <Award className="h-5 w-5" aria-hidden="true" />
            <h3>Certifications &amp; achievements</h3>
          </div>
          <p className="portfolio-card-body">
            Professional development and security-focused work that continues to strengthen my practice.
          </p>
          {credentials.length ? (
            <ul className="portfolio-credentials-list">
              {credentials.map((credential, index) => {
                const content = (
                  <>
                    <CredentialBadge credential={credential} />
                    <span className="portfolio-credential-copy">
                      <strong>{credential.title}</strong>
                      {credential.issuer ? <small>{credential.issuer}</small> : null}
                    </span>
                    {credential.credentialUrl ? <ArrowUpRight aria-hidden="true" /> : null}
                  </>
                );

                return (
                  <li key={`${credential.title}-${index}`}>
                    {credential.credentialUrl ? (
                      <a href={credential.credentialUrl} target="_blank" rel="noreferrer" aria-label={`Verify ${credential.title}`}>
                        {content}
                      </a>
                    ) : (
                      <div className="portfolio-credential-item">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="portfolio-card-body">Certifications and achievements will be added here.</p>
          )}
        </article>

        <article className="portfolio-card">
          <h3>A security-first partner</h3>
          <p className="portfolio-card-body">
            I bring security-minded engineering, thoughtful problem-solving, and a focus on dependable delivery to every collaboration.
          </p>
          <div className="portfolio-note">
            <ShieldCheck className="h-4 w-4" />
            <span>Whether you are shaping a new idea or improving an existing product, let’s discuss your goals and a practical path forward.</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function PortfolioPage({ projects: ssrProjects, blogs: ssrBlogs, videos: ssrVideos, skills: ssrSkills, settings: ssrSettings }) {
  const [activeTab, setActiveTab] = useState("home");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundReady, setBackgroundReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveBackground() {
      const candidates = ssrSettings?.homeBackground
        ? [ssrSettings.homeBackground, ...homeBackgroundCandidates]
        : homeBackgroundCandidates;

      for (const candidate of candidates) {
        if (!candidate) continue;
        const result = await new Promise((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(candidate);
          img.onerror = () => resolve(null);
          img.src = candidate;
        });

        if (result) {
          if (!cancelled) {
            setBackgroundUrl(result);
            setBackgroundReady(true);
          }
          return;
        }
      }

      if (!cancelled) {
        setBackgroundUrl("");
        setBackgroundReady(false);
      }
    }

    resolveBackground();

    return () => {
      cancelled = true;
    };
  }, [ssrSettings?.homeBackground]);

  // Create local data variables selecting SSR-provided values first, then
  // falling back to the static site content module exported values.
  const localVideos = ssrVideos || [];
  const localSkills = ssrSkills || [];

  const tabs = useMemo(() => {
    const localSettings = ssrSettings || {};
    const localProjects = Array.isArray(ssrProjects)
      ? ssrProjects
      : Array.isArray(ssrProjects?.items)
        ? ssrProjects.items
        : ssrProjects == null
          ? staticProjects || []
          : [];
    const localBlogs = ssrBlogs || staticBlogs || [];

    const localNavigation = staticNavigation || [];
    const localAboutSummary = staticAboutSummary || { biography: '', mission: '' };
    const localCapabilityGroups = staticCapabilityGroups || [];
    const localToolbelt = staticToolbelt || [];
    const localCertifications = staticCertifications || [];
    const localContactMethods = [
      {
        label: 'Phone',
        icon: 'phone',
        href: localSettings?.contactPhone ? `tel:${localSettings.contactPhone.replace(/\s+/g, '')}` : staticContactMethods[0]?.href,
        value: localSettings?.contactPhone || staticContactMethods[0]?.value,
      },
      {
        label: 'Email',
        icon: 'email',
        href: localSettings?.contactEmail ? `mailto:${localSettings.contactEmail}` : staticContactMethods[1]?.href,
        value: localSettings?.contactEmail || staticContactMethods[1]?.value,
      },
    ];
    const localSocialLinks = (localSettings?.socialLinks && localSettings.socialLinks.length > 0)
      ? localSettings.socialLinks
      : staticSocialLinks || [];

    return {
      about: (
        <AboutTab
          aboutSummary={localAboutSummary}
          capabilityGroups={localCapabilityGroups}
          toolbelt={localToolbelt}
          certifications={localCertifications}
          aboutContent={localSettings.aboutContent}
        />
      ),
      blogs: <BlogsTab blogs={localBlogs} />,
      contact: (
        <ContactsTab
          contactMethods={localContactMethods}
          socialLinks={localSocialLinks}
          certifications={Array.isArray(localSettings.aboutContent?.certifications)
            ? localSettings.aboutContent.certifications
            : localCertifications}
        />
      ),
      home: <HomeTab backgroundReady={backgroundReady} backgroundUrl={backgroundUrl} socialLinks={localSocialLinks} settings={localSettings} />,
      projects: <ProjectsTab projects={localProjects} />,
    };
  }, [backgroundReady, backgroundUrl, ssrBlogs, ssrProjects, ssrSettings]);

  const navigationToRender = staticNavigation || [];

  const accentColor = ssrSettings && ssrSettings.theme && ssrSettings.theme.accent;

  return (
    <div className="portfolio-app-page" style={accentColor ? { ['--accent-color']: accentColor } : undefined}>
      <div className="portfolio-app-shell">
        <div className="portfolio-app-frame">
          <nav className="portfolio-tab-bar" aria-label="Portfolio tabs">
            {navigationToRender.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={classNames("portfolio-tab-button", activeTab === item.id && "is-active")}
                aria-pressed={activeTab === item.id}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="portfolio-panel-stage">
            {navigationToRender.map((item) => (
              <div
                key={item.id}
                className={classNames("portfolio-panel-layer", activeTab === item.id && "is-active")}
                aria-hidden={activeTab !== item.id}
              >
                {tabs[item.id]}
              </div>
            ))}
          </div>

          {/* status bar removed per request (chips hidden) */}
        </div>
      </div>
    </div>
  );
}
