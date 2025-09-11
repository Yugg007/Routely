export default function ProfileView({ user, onLogout }) {
  return (
    <main className="routely-card" aria-labelledby="profile-heading">
      <header className="routely-profileHeader">
        <div className="routely-avatar" aria-hidden>
          {user?.name ? user.name.trim().slice(0, 1).toUpperCase() : 'U'}
        </div>
        <div className="routely-personal">
          <h1 id="profile-heading" className="routely-name">{user?.name || 'User'}</h1>
          <p className="routely-email">{localStorage.getItem('email') || '—'}</p>
        </div>
      </header>

      <section className="routely-profileActions">
        <p className="routely-muted">Manage your Routely account, bookings, and preferences.</p>
        <div className="routely-actionRow">
          <button className="btn btn-primary" onClick={() => alert('Go to edit profile (wire to route)')}>
            Edit profile
          </button>
          <button className="btn btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
