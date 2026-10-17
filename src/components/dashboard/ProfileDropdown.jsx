import React from 'react';
import { useRouter } from 'next/router';

export default function ProfileDropdown({ onClose }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/secure-console/login');
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error', err);
    }
  }

  function handleNavigate(path) {
    onClose();
    router.push(path);
  }

  return (
    <div className="profile-dropdown" role="menu">
      <div className="profile-info">
        <div className="profile-name">Admin User</div>
        <div className="profile-email">Administrator</div>
      </div>
      <ul className="profile-actions">
        <li><button type="button" onClick={() => handleNavigate('/secure-console/profile')}>My Profile</button></li>
        <li><button type="button" onClick={() => handleNavigate('/secure-console/settings')}>Settings</button></li>
        <li><button type="button" onClick={handleLogout}>Logout</button></li>
      </ul>
    </div>
  );
}
