import React, { useEffect, useState } from 'react';
import cookie from 'cookie';
import { verifyToken } from '../../lib/auth';
import Layout from '../../components/dashboard/Layout';
import Link from 'next/link';

export default function ProfilePage({ user }) {
  const [settings, setSettings] = useState({
    homeBackground: '',
    welcomeTitle: '',
    heroName: '',
    heroSubtitle: '',
    passionText: '',
    introductionText: '',
    contactPhone: '',
    contactEmail: '',
    linkedinUrl: '',
    githubUrl: '',
    whatsappUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    xUrl: '',
    socialLinks: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        const payload = json.settings || {};
        const socialLinks = Array.isArray(payload.socialLinks) ? payload.socialLinks : [];
        const findLink = (icon) => socialLinks.find((item) => item.icon === icon);

        setSettings({
          homeBackground: payload.homeBackground || '',
          welcomeTitle: payload.welcomeTitle || '',
          heroName: payload.heroName || '',
          heroSubtitle: payload.heroSubtitle || '',
          passionText: payload.passionText || '',
          introductionText: payload.introductionText || '',
          contactPhone: payload.contactPhone || '',
          contactEmail: payload.contactEmail || '',
          linkedinUrl: findLink('linkedin')?.href || '',
          githubUrl: findLink('github')?.href || '',
          whatsappUrl: findLink('whatsapp')?.href || '',
          facebookUrl: findLink('facebook')?.href || '',
          instagramUrl: findLink('instagram')?.href || '',
          xUrl: findLink('twitter')?.href || '',
          socialLinks: socialLinks.filter(
            (item) => !['linkedin', 'github', 'whatsapp', 'facebook', 'instagram', 'twitter'].includes(item.icon),
          ),
        });
      } catch (err) {
        console.error('Failed to load homepage settings', err);
        setStatus('Unable to load homepage settings.');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function updateSocialLink(index, field, value) {
    setSettings((prev) => {
      const links = [...prev.socialLinks];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, socialLinks: links };
    });
  }

  function addSocialLink() {
    setSettings((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { label: 'New', icon: 'github', href: '' }],
    }));
  }

  function removeSocialLink(index) {
    setSettings((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  }

  async function saveHomepageSettings(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      const explicitSocialLinks = [
        { label: 'LinkedIn', icon: 'linkedin', href: settings.linkedinUrl },
        { label: 'GitHub', icon: 'github', href: settings.githubUrl },
        { label: 'WhatsApp', icon: 'whatsapp', href: settings.whatsappUrl },
        { label: 'Facebook', icon: 'facebook', href: settings.facebookUrl },
        { label: 'Instagram', icon: 'instagram', href: settings.instagramUrl },
        { label: 'X', icon: 'twitter', href: settings.xUrl },
      ].filter((item) => item.href && item.href.trim().length > 0);

      const genericLinks = (settings.socialLinks || []).filter(
        (item) => !['linkedin', 'github', 'whatsapp', 'facebook', 'instagram', 'twitter'].includes(item.icon),
      );

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeBackground: settings.homeBackground,
          welcomeTitle: settings.welcomeTitle,
          heroName: settings.heroName,
          heroSubtitle: settings.heroSubtitle,
          passionText: settings.passionText,
          introductionText: settings.introductionText,
          contactPhone: settings.contactPhone,
          contactEmail: settings.contactEmail,
          socialLinks: [...explicitSocialLinks, ...genericLinks],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setStatus('Homepage changes saved successfully.');
    } catch (err) {
      console.error(err);
      setStatus('Failed to save homepage settings.');
    } finally {
      setSaving(false);
    }
  }

  const lastLogin = user?.iat ? new Date(user.iat * 1000).toLocaleString() : 'Unknown';

  return (
    <Layout>
      <div className="page-header profile-header">
        <div>
          <h2 className="sci-title">Homepage editor</h2>
          <p className="page-subtitle">
            Edit the public home screen hero, welcome text, passion card, contact details, and social icons from this page.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/" className="tab-like">
            Preview public homepage
          </Link>
          <Link href="/secure-console/dashboard" className="tab-like">
            Dashboard overview
          </Link>
        </div>
      </div>

      <form className="glass-card profile-card" onSubmit={saveHomepageSettings}>
        <div className="section-title-row">
          <div>
            <h3>Home screen content</h3>
            <p className="muted">Update homepage text, background, and contact links for the public portfolio.</p>
          </div>
          <button type="submit" className="tab-like primary" disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save homepage'}
          </button>
        </div>

        {status ? <div className="form-message success">{status}</div> : null}
        {loading ? <div className="form-message">Loading current homepage settings…</div> : null}

        <div className="form-row">
          <label className="form-label">Background image path or URL</label>
          <input
            className="form-input"
            type="text"
            value={settings.homeBackground}
            onChange={(e) => updateField('homeBackground', e.target.value)}
            placeholder="/background_image.png"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Hero name</label>
          <input
            className="form-input"
            type="text"
            value={settings.heroName}
            onChange={(e) => updateField('heroName', e.target.value)}
            placeholder="Bahati L. Eusebius"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Welcome title</label>
          <input
            className="form-input"
            type="text"
            value={settings.welcomeTitle}
            onChange={(e) => updateField('welcomeTitle', e.target.value)}
            placeholder="WELCOMETOMYWEBSITE"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Welcome subtitle</label>
          <input
            className="form-input"
            type="text"
            value={settings.heroSubtitle}
            onChange={(e) => updateField('heroSubtitle', e.target.value)}
            placeholder="Explore my work, projects, and security-first thinking."
          />
        </div>

        <div className="form-row">
          <label className="form-label">Passion card text</label>
          <textarea
            className="form-input"
            rows={4}
            value={settings.passionText}
            onChange={(e) => updateField('passionText', e.target.value)}
            placeholder="A passionate freelancer, software developer, ethical hacker, and cybersecurity enthusiast."
          />
        </div>

        <div className="form-row">
          <label className="form-label">Introduction card text</label>
          <textarea
            className="form-input"
            rows={5}
            value={settings.introductionText}
            onChange={(e) => updateField('introductionText', e.target.value)}
            placeholder="I specialize in building secure, intelligent systems and crafting innovative solutions that protect and empower digital environments. My work blends coding, cybersecurity expertise, and problem-solving to deliver impactful results for clients and projects."
          />
        </div>

        <div className="form-row">
          <label className="form-label">Contact phone</label>
          <input
            className="form-input"
            type="text"
            value={settings.contactPhone}
            onChange={(e) => updateField('contactPhone', e.target.value)}
            placeholder="+254 769101739"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Contact email</label>
          <input
            className="form-input"
            type="email"
            value={settings.contactEmail}
            onChange={(e) => updateField('contactEmail', e.target.value)}
            placeholder="bahatieusebius@gmail.com"
          />
        </div>

        <div className="section-title-row">
          <div>
            <h3>Fixed social links</h3>
            <p className="muted">Enter your public social media URLs for LinkedIn, GitHub, WhatsApp, Facebook, Instagram, and X.</p>
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">LinkedIn URL</label>
          <input
            className="form-input"
            type="text"
            value={settings.linkedinUrl}
            onChange={(e) => updateField('linkedinUrl', e.target.value)}
            placeholder="https://www.linkedin.com/in/username"
          />
        </div>

        <div className="form-row">
          <label className="form-label">GitHub URL</label>
          <input
            className="form-input"
            type="text"
            value={settings.githubUrl}
            onChange={(e) => updateField('githubUrl', e.target.value)}
            placeholder="https://github.com/username"
          />
        </div>

        <div className="form-row">
          <label className="form-label">WhatsApp URL</label>
          <input
            className="form-input"
            type="text"
            value={settings.whatsappUrl}
            onChange={(e) => updateField('whatsappUrl', e.target.value)}
            placeholder="https://wa.me/254769101739"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Facebook URL</label>
          <input
            className="form-input"
            type="text"
            value={settings.facebookUrl}
            onChange={(e) => updateField('facebookUrl', e.target.value)}
            placeholder="https://www.facebook.com/username"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Instagram URL</label>
          <input
            className="form-input"
            type="text"
            value={settings.instagramUrl}
            onChange={(e) => updateField('instagramUrl', e.target.value)}
            placeholder="https://www.instagram.com/username"
          />
        </div>

        <div className="form-row">
          <label className="form-label">X URL</label>
          <input
            className="form-input"
            type="text"
            value={settings.xUrl}
            onChange={(e) => updateField('xUrl', e.target.value)}
            placeholder="https://x.com/username"
          />
        </div>

        <div className="section-title-row">
          <div>
            <h3>Additional social links</h3>
            <p className="muted">Keep any extra social links here while the fixed links remain separate.</p>
          </div>
          <button type="button" className="tab-like" onClick={addSocialLink}>
            Add social link
          </button>
        </div>

        <div className="social-links-grid">
          {settings.socialLinks.map((item, index) => (
            <div className="social-link-row" key={`${item.label || 'link'}-${index}`}>
              <input
                className="form-input"
                type="text"
                value={item.label || ''}
                onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                placeholder="Label"
              />
              <input
                className="form-input"
                type="text"
                value={item.icon || ''}
                onChange={(e) => updateSocialLink(index, 'icon', e.target.value)}
                placeholder="Icon (github, linkedin, twitter, facebook)"
              />
              <input
                className="form-input"
                type="text"
                value={item.href || ''}
                onChange={(e) => updateSocialLink(index, 'href', e.target.value)}
                placeholder="URL"
              />
              <button type="button" className="tab-like danger" onClick={() => removeSocialLink(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="profile-detail-grid profile-detail-grid-wide" style={{ marginTop: 24 }}>
          <div className="profile-detail-item">
            <div className="profile-detail-label">Administrator name</div>
            <div className="profile-detail-value">{user?.name || 'Administrator'}</div>
          </div>
          <div className="profile-detail-item">
            <div className="profile-detail-label">Primary email</div>
            <div className="profile-detail-value">{user?.email || 'Not configured'}</div>
          </div>
          <div className="profile-detail-item">
            <div className="profile-detail-label">Access level</div>
            <div className="profile-detail-value">{user?.role || 'ADMIN'}</div>
          </div>
          <div className="profile-detail-item">
            <div className="profile-detail-label">Last login</div>
            <div className="profile-detail-value">{lastLogin}</div>
          </div>
        </div>
      </form>
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const cookieHeader = req.headers.cookie || '';
  const parsed = cookie.parse(cookieHeader || '');
  const token = parsed.token;

  if (!token) {
    return {
      redirect: {
        destination: '/secure-console/login',
        permanent: false,
      },
    };
  }

  try {
    const user = verifyToken(token);
    return {
      props: {
        user,
      },
    };
  } catch (err) {
    return {
      redirect: {
        destination: '/secure-console/login',
        permanent: false,
      },
    };
  }
}
