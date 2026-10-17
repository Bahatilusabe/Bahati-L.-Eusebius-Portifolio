import React, { useEffect, useState } from 'react';
import Layout from '../../../components/dashboard/Layout';
import { useRouter } from 'next/router';

export default function SkillEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({ name: '', category: '', level: 50 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const isEditing = Boolean(id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      const res = await fetch(`/api/admin/skills?id=${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json) setForm((f) => ({ ...f, ...json }));
      }
      setLoading(false);
    })();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    if (!form.name || form.name.trim().length < 1) return setMessage({ type: 'error', text: 'Skill name is required.' });

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), category: form.category.trim(), level: parseInt(form.level || 0, 10) };
      const res = await fetch('/api/admin/skills' + (isEditing ? `?id=${id}` : ''), {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(isEditing ? { id, ...payload } : payload),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Could not save skill');
      router.push('/secure-console/skills');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header skills-edit-header">
        <div>
          <h2 className="sci-title">{isEditing ? 'Edit Skill' : 'Add Skill'}</h2>
          <p className="page-subtitle">Create or refine a skill entry with level details, category tagging, and live preview.</p>
        </div>
      </div>

      <div className="skill-edit-grid">
        <form onSubmit={submit} className="glass-card skill-form-card">
          <div className="section-title-row">
            <div>
              <h3>{isEditing ? 'Skill details' : 'New skill'}</h3>
              <p className="muted">Fill in the fields below and save to keep your portfolio skills up to date.</p>
            </div>
            <span className={`status-pill ${form.level >= 80 ? 'read' : form.level >= 50 ? 'unread' : 'pending'}`}>
              {form.level >= 80 ? 'Expert' : form.level >= 50 ? 'Intermediate' : 'Beginner'}
            </span>
          </div>

          <div className="form-row">
            <label className="form-label">Skill name</label>
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. React, Figma, Node.js"
            />
          </div>

          <div className="form-row">
            <label className="form-label">Category</label>
            <input
              className="form-input"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Frontend, Design, Backend"
            />
          </div>

          <div className="form-row">
            <label className="form-label">Level</label>
            <div className="level-control">
              <input
                className="form-input"
                type="range"
                name="level"
                min={0}
                max={100}
                step={5}
                value={form.level}
                onChange={handleChange}
              />
              <div className="level-value">{form.level}%</div>
            </div>
          </div>

          {message ? (
            <div className={`form-message ${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="sec-btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save skill'}</button>
            <button type="button" className="sec-btn" onClick={() => router.push('/secure-console/skills')} disabled={saving}>Cancel</button>
          </div>
        </form>

        <div className="glass-card skill-preview-card">
          <div className="section-title-row">
            <div>
              <h3>Preview</h3>
              <p className="muted">Review the skill card before saving.</p>
            </div>
          </div>

          <div className="skill-preview-body">
            <div className="skill-preview-name">{form.name || 'New skill name'}</div>
            <div className="skill-category-pill preview">{form.category || 'General'}</div>

            <div className="skill-meter-card">
              <div className="skill-meter-header">
                <div>
                  <div className="metric-label">Proficiency level</div>
                  <div className="muted">Visual representation of your skill strength.</div>
                </div>
                <div className="skill-meter-score">{form.level}%</div>
              </div>
              <div className="skill-meter-track">
                <div className="skill-meter-fill" style={{ width: `${Math.min(100, Number(form.level || 0))}%` }} />
              </div>
            </div>

            <div className="skill-preview-footer">
              <div className="skill-chip">{form.level >= 80 ? 'Focus area' : 'Developing skill'}</div>
              <div className="skill-chip small">{form.category || 'General'}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
