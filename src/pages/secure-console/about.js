import { useEffect, useState } from 'react';
import Layout from '../../components/dashboard/Layout';
import {
  aboutSummary,
  capabilityGroups,
  certifications,
  toolbelt,
} from '../../data/siteContent';

function linesToList(value) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function normalizeCertifications(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (
    typeof item === 'string'
      ? { title: item, issuer: '', badgeImage: '', credentialUrl: '' }
      : {
          title: typeof item?.title === 'string' ? item.title : '',
          issuer: typeof item?.issuer === 'string' ? item.issuer : '',
          badgeImage: typeof item?.badgeImage === 'string' ? item.badgeImage : '',
          credentialUrl: typeof item?.credentialUrl === 'string' ? item.credentialUrl : '',
        }
  ));
}

const defaultAboutContent = {
  sectionTitle: 'Building secure, useful digital products',
  sectionDescription: 'I bring software development and cybersecurity together to create practical solutions that protect data, solve real problems, and work reliably for the people who use them.',
  biography: aboutSummary.biography,
  mission: aboutSummary.mission,
  capabilityGroups,
  toolbelt,
  certifications,
  careerDirection: 'Building secure intelligent products, contributing to advanced cybersecurity systems, and growing into complex infrastructure and defensive engineering leadership roles.',
};

function toEditorFields(content = {}) {
  const values = { ...defaultAboutContent, ...content };
  return {
    ...values,
    toolbeltText: (Array.isArray(values.toolbelt) ? values.toolbelt : toolbelt).join('\n'),
    certifications: normalizeCertifications(
      Array.isArray(values.certifications) ? values.certifications : certifications,
    ),
    capabilityGroupsText: JSON.stringify(
      Array.isArray(values.capabilityGroups) ? values.capabilityGroups : capabilityGroups,
      null,
      2,
    ),
  };
}

export default function AboutEditor() {
  const [form, setForm] = useState(() => toEditorFields());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploadingBadgeIndex, setUploadingBadgeIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAboutContent() {
      try {
        const response = await fetch('/api/admin/settings');
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.error || `Could not load About content (status ${response.status}).`);
        }
        if (!cancelled && result?.settings?.aboutContent) {
          setForm(toEditorFields(result.settings.aboutContent));
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Could not load About content.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAboutContent();
    return () => { cancelled = true; };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setSaved(false);
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateCertification(index, field, value) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      certifications: current.certifications.map((certification, itemIndex) => (
        itemIndex === index ? { ...certification, [field]: value } : certification
      )),
    }));
  }

  function addCertification() {
    setSaved(false);
    setForm((current) => ({
      ...current,
      certifications: [...current.certifications, { title: '', issuer: '', badgeImage: '', credentialUrl: '' }],
    }));
  }

  function removeCertification(index) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function uploadBadgeImage(index, file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for the certificate badge.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Badge images must be 5 MB or smaller.');
      return;
    }

    setUploadingBadgeIndex(index);
    setError('');
    setSaved(false);
    try {
      const payload = new FormData();
      payload.append('file', file);
      const response = await fetch('/api/admin/uploads/upload', { method: 'POST', body: payload });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.url) {
        throw new Error(result?.error || `Badge upload failed (status ${response.status}).`);
      }
      updateCertification(index, 'badgeImage', result.url);
    } catch (uploadError) {
      setError(uploadError.message || 'Could not upload the badge image.');
    } finally {
      setUploadingBadgeIndex(null);
    }
  }

  async function saveAbout(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    let groups;
    try {
      groups = JSON.parse(form.capabilityGroupsText);
      if (!Array.isArray(groups) || groups.some((group) => (
        !group || typeof group.title !== 'string' || !Array.isArray(group.items)
        || group.items.some((item) => typeof item !== 'string')
      ))) {
        throw new Error('Each capability group needs a title and an array of text items.');
      }
    } catch (parseError) {
      setError(parseError instanceof SyntaxError
        ? 'Capabilities must be valid JSON. Use a list of groups with a title and items array.'
        : parseError.message);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aboutContent: {
            sectionTitle: form.sectionTitle.trim(),
            sectionDescription: form.sectionDescription.trim(),
            biography: form.biography.trim(),
            mission: form.mission.trim(),
            capabilityGroups: groups.map((group) => ({
              title: group.title.trim(),
              items: group.items.map((item) => item.trim()).filter(Boolean),
            })),
            toolbelt: linesToList(form.toolbeltText),
            certifications: form.certifications
              .map((certification) => ({
                title: certification.title.trim(),
                issuer: certification.issuer.trim(),
                badgeImage: certification.badgeImage.trim(),
                credentialUrl: certification.credentialUrl.trim(),
              }))
              .filter((certification) => certification.title),
            careerDirection: form.careerDirection.trim(),
          },
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || `Save failed (status ${response.status}).`);
      setForm(toEditorFields(result.settings.aboutContent));
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || 'Could not save About content.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="sci-title">About Me</h2>
          <p className="page-subtitle">Edit the biography, mission, skills, and other content shown on the public About page.</p>
        </div>
        <button className="sec-btn primary" type="submit" form="about-editor-form" disabled={loading || saving}>
          {saving ? 'Saving…' : 'Save About content'}
        </button>
      </div>

      <form id="about-editor-form" onSubmit={saveAbout} className="glass-card" style={{ padding: 24, display: 'grid', gap: 18 }}>
        {loading ? <p className="muted">Loading About content…</p> : null}

        <label>
          Section heading
          <input className="form-input" name="sectionTitle" value={form.sectionTitle} onChange={updateField} maxLength={120} />
        </label>

        <label>
          Intro shown below the heading
          <textarea className="form-input" name="sectionDescription" rows={3} value={form.sectionDescription} onChange={updateField} maxLength={600} />
        </label>

        <label>
          Biography
          <textarea className="form-input" name="biography" rows={5} value={form.biography} onChange={updateField} />
        </label>

        <label>
          Mission
          <textarea className="form-input" name="mission" rows={4} value={form.mission} onChange={updateField} />
        </label>

        <label>
          Capabilities (JSON)
          <textarea
            className="form-input"
            name="capabilityGroupsText"
            rows={12}
            value={form.capabilityGroupsText}
            onChange={updateField}
            spellCheck="false"
            aria-describedby="capabilities-help"
          />
          <small id="capabilities-help" className="muted">
            Example: {'[{"title":"Engineering","items":["API design","Automation"]}]'}
          </small>
        </label>

        <label>
          Tools and technologies (one per line)
          <textarea className="form-input" name="toolbeltText" rows={5} value={form.toolbeltText} onChange={updateField} />
        </label>

        <section aria-labelledby="certifications-editor-heading" style={{ display: 'grid', gap: 14 }}>
          <div>
            <h3 id="certifications-editor-heading">Certifications and achievements</h3>
            <p className="muted">Add a title and optional badge image, issuer, or verification link for each entry.</p>
          </div>
          {form.certifications.map((certification, index) => (
            <fieldset key={`certification-${index}`} className="glass-card" style={{ display: 'grid', gap: 12, padding: 16 }}>
              <legend className="muted">Credential {index + 1}</legend>
              <label>
                Certificate or achievement title
                <input
                  className="form-input"
                  value={certification.title}
                  onChange={(event) => updateCertification(index, 'title', event.target.value)}
                  maxLength={160}
                />
              </label>
              <label>
                Issuing organization (optional)
                <input
                  className="form-input"
                  value={certification.issuer}
                  onChange={(event) => updateCertification(index, 'issuer', event.target.value)}
                  maxLength={120}
                />
              </label>
              <div>
                <label className="form-label" htmlFor={`credential-badge-${index}`}>Badge image (optional)</label>
                <input
                  id={`credential-badge-${index}`}
                  className="form-input"
                  type="file"
                  accept="image/*"
                  disabled={uploadingBadgeIndex === index}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    uploadBadgeImage(index, file);
                  }}
                />
                <small className="muted">Upload an image up to 5 MB. It will appear beside the credential title.</small>
                {uploadingBadgeIndex === index ? <p className="muted">Uploading badge…</p> : null}
                {certification.badgeImage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={certification.badgeImage} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10 }} />
                    <button
                      className="tab-like"
                      type="button"
                      onClick={() => updateCertification(index, 'badgeImage', '')}
                    >
                      Remove badge image
                    </button>
                  </div>
                ) : null}
              </div>
              <label>
                Verification link (optional)
                <input
                  className="form-input"
                  type="url"
                  value={certification.credentialUrl}
                  onChange={(event) => updateCertification(index, 'credentialUrl', event.target.value)}
                  placeholder="https://credential-provider.example/verify/..."
                />
              </label>
              <button className="tab-like danger" type="button" onClick={() => removeCertification(index)}>
                Remove credential
              </button>
            </fieldset>
          ))}
          <button className="tab-like" type="button" onClick={addCertification}>
            Add certification or achievement
          </button>
        </section>

        <label>
          Career direction
          <textarea className="form-input" name="careerDirection" rows={3} value={form.careerDirection} onChange={updateField} />
        </label>

        {error ? <p role="alert" style={{ color: '#ffb4b4' }}>{error}</p> : null}
        {saved ? <p role="status" style={{ color: '#7bd389' }}>About content saved. Public page is updated.</p> : null}
      </form>
    </Layout>
  );
}
