import React, { useEffect, useState } from 'react';
import Layout from '../../../components/dashboard/Layout';
import SettingsCV from '../../../components/SettingsCV';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ siteTitle: '', description: '', profile: {}, socialLinks: [], theme: {} });
  const [cvUrl, setCvUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sessionsList, setSessionsList] = useState([]);
  const [twoFactorState, setTwoFactorState] = useState(false);

  const sessionsCount = sessionsList.length;
  const socialCount = settings.socialLinks?.length || 0;
  const profileScore = Math.round(
    (Number(!!settings.profile?.name)
      + Number(!!settings.profile?.headline)
      + Number(!!settings.siteTitle)
      + Number(!!settings.description)
      + Number(socialCount > 0)
      + Number(!!cvUrl)) / 6 * 100
  );
  const securityScore = Math.min(100, 40 + (twoFactorState ? 25 : 0) + Math.min(20, sessionsCount * 5) + (cvUrl ? 15 : 0));
  const overviewStats = [
    { label: 'Profile completeness', value: profileScore, hint: 'More detail improves your admin profile strength.' },
    { label: 'Active sessions', value: sessionsCount, hint: 'Active sign-ins across devices.' },
    { label: 'Two-factor auth', value: twoFactorState ? 100 : 35, hint: twoFactorState ? '2FA is enabled.' : 'Enable 2FA for stronger protection.' },
    { label: 'CV uploaded', value: cvUrl ? 100 : 0, hint: cvUrl ? 'Your latest resume is available.' : 'Upload your CV to keep recruiter-ready.' },
  ];
  const activityMetrics = [
    { label: 'Profile', value: profileScore },
    { label: 'Security', value: securityScore },
    { label: 'Social links', value: Math.min(100, socialCount * 20) },
    { label: 'CV', value: cvUrl ? 100 : 0 },
  ];

  useEffect(() => {
    (async () => {
      try {
        const [sRes, cvRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/cv'),
        ]);
        const sJson = await sRes.json();
        const cvJson = await cvRes.json();
        if (sJson.settings) setSettings((prev) => ({ ...prev, ...sJson.settings }));
        if (cvJson.cv) setCvUrl(cvJson.cv);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveAll(e) {
    e && e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        siteTitle: settings.siteTitle,
        description: settings.description,
        profile: settings.profile,
        socialLinks: settings.socialLinks,
        theme: settings.theme,
      };

      const res = await fetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setSettings((s) => ({ ...s, ...json.settings }));
      alert('Settings saved');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  }

  function updateSocial(index, field, value) {
    setSettings((s) => {
      const social = [...(s.socialLinks || [])];
      social[index] = { ...social[index], [field]: value };
      return { ...s, socialLinks: social };
    });
  }

  function addSocial() {
    setSettings((s) => ({ ...s, socialLinks: [...(s.socialLinks || []), { label: 'New', icon: 'github', href: '' }] }));
  }

  function removeSocial(index) {
    setSettings((s) => ({ ...s, socialLinks: (s.socialLinks || []).filter((_, i) => i !== index) }));
  }

  // Security handlers
  async function loadSessions() {
    try {
      const res = await fetch('/api/admin/sessions');
      const json = await res.json();
      setSessionsList(json.sessions || []);
    } catch (err) {
      console.error('loadSessions', err);
    }
  }

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/2fa');
        const json = await res.json();
        setTwoFactorState(!!(json.tfa && json.tfa.enabled));
        if (json.tfa && json.tfa.secret) {
          setSettings((s) => ({ ...s, profile: { ...s.profile, tfaSecret: json.tfa.secret } }));
        }
      } catch (err) {
        console.error('Failed to load 2fa state', err);
      }
    })();
  }, []);

  async function handleChangePassword(current, next) {
    try {
      const res = await fetch('/api/admin/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: current, newPassword: next }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) {
        const msg = json && json.error ? json.error : 'Failed';
        throw new Error(msg);
      }
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async function toggle2fa(enable) {
    try {
      const res = await fetch('/api/admin/2fa', { method: 'POST', body: JSON.stringify({ enabled: !!enable }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '2FA action failed');
      setTwoFactorState(!!(json.tfa && json.tfa.enabled));
      if (json.tfa && json.tfa.secret) {
        setSettings((s) => ({ ...s, profile: { ...s.profile, tfaSecret: json.tfa.secret } }));
      } else {
        setSettings((s) => ({ ...s, profile: { ...s.profile, tfaSecret: null } }));
      }
      alert(enable ? '2FA enabled' : '2FA disabled');
    } catch (err) {
      console.error(err);
      alert('2FA action failed');
    }
  }

  async function revokeSession(id) {
    try {
      await fetch('/api/admin/sessions', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
      loadSessions();
    } catch (err) {
      console.error(err);
      alert('Failed to revoke');
    }
  }

  return (
    <Layout>
      <h2 className="sci-title">Settings</h2>
      <div className="page-header">
        <div>
          <p className="page-subtitle">Fine-tune your portfolio admin experience, secure your account, and keep recruiter-ready data up to date.</p>
        </div>
        <div className="page-actions">
          <button className="sec-btn primary" onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save all changes'}</button>
        </div>
      </div>

      <div className="stats-grid">
        {overviewStats.map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="metric-card-head">
              <div>
                <div className="metric-label">{stat.label}</div>
                <div className="metric-hint muted">{stat.hint}</div>
              </div>
              <div className="metric-value">{stat.value}{stat.label === 'Active sessions' ? '' : '%'}</div>
            </div>
            <div className="progress-pill">
              <div className="progress-fill" style={{ width: `${stat.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card insights-card">
        <div className="insights-header">
          <div>
            <h3>Account Insights</h3>
            <p className="muted">View your admin profile strength and security posture at a glance.</p>
          </div>
          <div className="insights-score">{securityScore}%</div>
        </div>
        <div className="bar-chart">
          {activityMetrics.map((item) => (
            <div key={item.label} className="bar-row">
              <span>{item.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${item.value}%` }} />
              </div>
              <span>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="page-grid">
        {/* Top row: Profile | Security */}
        <div className="section-grid">
          <div className="glass-card panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Profile</h3>
              <button onClick={saveAll} className="tab-like" disabled={saving} style={{ height: 36 }}>{saving ? 'Saving...' : 'Save All'}</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveAll(); }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Display name</label>
                <input className="form-input" type="text" value={settings.profile?.name || ''} onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, name: e.target.value } }))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Headline</label>
                <input className="form-input" type="text" value={settings.profile?.headline || ''} onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, headline: e.target.value } }))} />
              </div>
            </form>
          </div>

          <div className="glass-card panel-card" style={{ minHeight: 360 }}>
            <h3>Security</h3>

            <section className="sec-section" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h4 style={{ margin: 0 }}>Change password</h4>
                <small className="muted">Update your account password</small>
              </div>
              <div style={{ marginTop: 8 }}>
                <ChangePasswordForm onChange={handleChangePassword} />
              </div>
            </section>

            <hr className="sec-hr" />

            <section className="sec-section" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Two-Factor Authentication</h4>
                  <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>Protect your account with an extra verification step.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className={`tfa-status ${twoFactorState ? 'on' : 'off'}`} aria-hidden>{twoFactorState ? 'Enabled' : 'Disabled'}</div>
                  <div>
                    <button className="sec-btn primary" onClick={() => toggle2fa(!twoFactorState)}>{twoFactorState ? 'Disable' : 'Enable'}</button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {twoFactorState ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="qr-placeholder">QR</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>Authenticator setup</div>
                      <div className="muted" style={{ marginTop: 6 }}>Scan the QR code or copy the secret below into your authenticator app.</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <input className="form-input" readOnly value={settings?.profile?.tfaSecret || 'DEV-SECRET-XXXX'} />
                        <button className="sec-btn" onClick={() => { navigator.clipboard?.writeText(settings?.profile?.tfaSecret || 'DEV-SECRET-XXXX'); }}>Copy</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="muted">2FA is currently disabled. Enabling adds an extra layer of security to your account.</div>
                )}
              </div>
            </section>

            <hr className="sec-hr" />

            <section className="sec-section" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h4 style={{ margin: 0 }}>Active Sessions</h4>
                <small className="muted">Sessions currently signed in</small>
              </div>

              <div style={{ marginTop: 8, display: 'grid', gap: 10, maxHeight: 160, overflow: 'auto' }}>
                {sessionsList.length === 0 ? (
                  <div className="muted">No sessions</div>
                ) : sessionsList.map((s) => (
                  <div key={s.id} className="session-item">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{(s.device || 'A').slice(0,1)}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.device || 'Unknown device'}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{s.ip || '—'} • {s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</div>
                      </div>
                    </div>
                    <div>
                      <button className="sec-btn" onClick={() => revokeSession(s.id)}>Revoke</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Bottom row: Theme | CV */}
        <div className="section-grid">
          <div className="glass-card theme-card panel-card">
            <div className="theme-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Theme</h3>
              <div>
                <button className="sec-btn" onClick={() => setSettings((s) => ({ ...s, theme: {} }))}>Reset</button>
                <button className="sec-btn primary" style={{ marginLeft: 8 }} onClick={saveAll}>Save Theme</button>
              </div>
            </div>

            <div className="theme-controls" style={{ marginTop: 12 }}>
              <div className="theme-row">
                <label className="muted" style={{ marginBottom: 8 }}>Mode</label>
                <div className="segmented">
                  {['auto', 'light', 'dark'].map((m) => (
                    <button key={m} className={`seg-btn ${settings.theme?.mode === m ? 'active' : ''}`} onClick={() => setSettings((s) => ({ ...s, theme: { ...s.theme, mode: m } }))}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
                  ))}
                </div>
              </div>

              <div className="theme-row" style={{ marginTop: 12 }}>
                <label className="muted" style={{ marginBottom: 8 }}>Accent</label>
                <div className="swatches-grid">
                  {['#0ea5e9', '#7a00ff', '#ff7b7b', '#34d399', '#f59e0b', '#ef4444'].map((c) => (
                    <button key={c} aria-label={`Accent ${c}`} className={`swatch ${settings.theme?.accent === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setSettings((s) => ({ ...s, theme: { ...s.theme, accent: c } }))} />
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={settings.theme?.accent || '#0ea5e9'} onChange={(e) => setSettings((s) => ({ ...s, theme: { ...s.theme, accent: e.target.value } }))} />
                    <div className="accent-preview" style={{ background: settings.theme?.accent || '#0ea5e9' }} aria-hidden />
                  </div>
                </div>
              </div>

              <div className="theme-row" style={{ marginTop: 14 }}>
                <label className="muted" style={{ marginBottom: 8 }}>Preview</label>
                <div className="preview-box">
                  <div className="preview-card" style={{ borderColor: settings.theme?.accent || 'var(--accent)' }}>
                    <div className="preview-badge" style={{ background: settings.theme?.accent || 'var(--accent)' }}>A</div>
                    <div style={{ marginLeft: 12 }}>
                      <div style={{ fontWeight: 800 }}>Your name</div>
                      <div className="muted">Role • Location</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SettingsCV initialCv={cvUrl} />
        </div>
      </div>
    </Layout>
  );
}

function ChangePasswordForm({ onChange }) {
  const [current, setCurrent] = useState('');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setMessage(null);
      if (n1 !== n2) return setMessage({ type: 'error', text: 'New passwords do not match' });
      setBusy(true);
      try {
        await onChange(current, n1);
        setMessage({ type: 'success', text: 'Password changed' });
        setCurrent(''); setN1(''); setN2('');
      } catch (err) {
        setMessage({ type: 'error', text: err && err.message ? err.message : 'Change failed' });
      } finally {
        setBusy(false);
      }
    }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <input className="form-input" type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} disabled={busy} />
        <input className="form-input" type="password" placeholder="New password" value={n1} onChange={(e) => setN1(e.target.value)} disabled={busy} />
        <input className="form-input" type="password" placeholder="Confirm new password" value={n2} onChange={(e) => setN2(e.target.value)} disabled={busy} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="sec-btn primary" type="submit" disabled={busy}>{busy ? 'Changing...' : 'Change password'}</button>
          {message ? (<div style={{ color: message.type === 'error' ? '#ff7b7b' : 'lightgreen', fontWeight: 700 }}>{message.text}</div>) : null}
        </div>
      </div>
    </form>
  );
}
