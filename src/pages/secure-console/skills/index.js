import React, { useEffect, useState } from 'react';
import Layout from '../../../components/dashboard/Layout';
import Link from 'next/link';

export default function SkillsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const avgLevel = items.length ? Math.round(items.reduce((sum, item) => sum + Number(item.level || 0), 0) / items.length) : 0;
  const strongSkills = items.filter((item) => Number(item.level || 0) >= 80).length;
  const categories = items.reduce((agg, item) => {
    const key = item.category || 'General';
    agg[key] = (agg[key] || 0) + 1;
    return agg;
  }, {});
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const stats = [
    { label: 'Total skills', value: total, hint: 'All skills currently published in your portfolio.' },
    { label: 'Average level', value: `${avgLevel}%`, hint: 'Average strength across visible skills.' },
    { label: 'Strengths', value: strongSkills, hint: 'Skills rated above 80% competence.' },
    { label: 'Categories', value: Object.keys(categories).length, hint: 'Distinct skill categories represented here.' },
  ];
  const categoryCards = topCategories.length ? topCategories : [{ label: 'General', count: total }];

  async function loadSkills(searchText, pageNumber, mounted) {
    setLoading(true);
    const res = await fetch(`/api/admin/skills?search=${encodeURIComponent(searchText)}&page=${pageNumber}&limit=10`);
    const json = await res.json();
    if (!mounted.current) return;
    setItems(json.items || []);
    setTotal(json.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    const mounted = { current: true };
    const timer = setTimeout(() => loadSkills(search, page, mounted), 200);
    return () => { mounted.current = false; clearTimeout(timer); };
  }, [search, page]);

  async function remove(id) {
    if (!confirm('Delete this skill?')) return;
    const res = await fetch('/api/admin/skills?id=' + id, { method: 'DELETE' });
    if (!res.ok) return alert('Could not delete skill');
    const newTotal = Math.max(0, total - 1);
    const nextPage = Math.min(page, Math.max(1, Math.ceil(newTotal / 10)));
    setPage(nextPage);
    await loadSkills(search, nextPage, { current: true });
  }

  return (
    <Layout>
      <div className="page-header skills-header">
        <div>
          <h2 className="sci-title">Skills</h2>
          <p className="page-subtitle">Monitor your technical strengths, category coverage, and skill levels with clarity.</p>
        </div>

        <div className="skills-actions">
          <div className="search-input">
            <input
              placeholder="Search skills"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Link href="/secure-console/skills/edit" className="tab-like primary">New Skill</Link>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="metric-card-head">
              <div>
                <div className="metric-label">{stat.label}</div>
                <div className="metric-hint muted">{stat.hint}</div>
              </div>
              <div className="metric-value">{stat.value}</div>
            </div>
            <div className="progress-pill">
              <div className="progress-fill" style={{ width: `${Math.min(100, typeof stat.value === 'number' ? stat.value : avgLevel)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card insights-card skill-insights-card">
        <div className="insights-header">
          <div>
            <h3>Category distribution</h3>
            <p className="muted">See which skill areas are most represented in your portfolio.</p>
          </div>
          <div className="insights-score">{total ? `${items.length}/${Math.min(10, total)}` : '0'}</div>
        </div>

        <div className="bar-chart">
          {topCategories.map((item) => (
            <div key={item.label} className="bar-row">
              <span className="metric-label">{item.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.round((item.count / Math.max(1, total)) * 100)}%` }} />
              </div>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card skill-categories-card">
        <div className="section-title-row">
          <div>
            <h3>Top categories</h3>
            <p className="muted">Quick glance at your most frequent skill groups.</p>
          </div>
        </div>
        <div className="category-preview-grid">
          {categoryCards.map((category) => (
            <div key={category.label} className="category-preview-card">
              <div className="category-preview-name">{category.label}</div>
              <div className="category-preview-count">{category.count} skill{category.count === 1 ? '' : 's'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card skill-table-card">
        <div className="message-table-header">
          <div>
            <h3>Skills list</h3>
            <p className="muted">{loading ? 'Fetching skills…' : `Displaying ${items.length} of ${total} skills.`}</p>
          </div>
          <div className="table-pager">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="tab-like" disabled={page === 1}>Prev</button>
            <button onClick={() => setPage((p) => p + 1)} className="tab-like" disabled={page >= Math.ceil(total / 10)} style={{ marginLeft: 8 }}>Next</button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="messages-empty">{loading ? 'Searching skills…' : 'No skills matched your filter.'}</div>
        ) : (
          <table className="message-table skill-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <span className="skill-category-pill">{item.category || 'General'}</span>
                  </td>
                  <td>
                    <div className="skill-level-wrapper">
                      <div className="skill-level-label">{item.level}%</div>
                      <div className="skill-level-bar">
                        <div className="skill-level-fill" style={{ width: `${Math.min(100, Number(item.level || 0))}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link href={`/secure-console/skills/edit?id=${item.id}`} className="tab-like">Edit</Link>
                    <button onClick={() => remove(item.id)} className="tab-like" style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
