import { NavLink } from 'react-router-dom'

const links = [
  { to: '/overview', label: 'Overview', icon: '⬡' },
  { to: '/reviews', label: 'Reviews', icon: '★' },
  { to: '/private-feedback', label: 'Inbox', icon: '✉' },
  { to: '/send-request', label: 'Send Request', icon: '↑' },
  { to: '/analytics', label: 'Analytics', icon: '◈' },
  { to: '/settings', label: 'Settings', icon: '⚙' }
]

function Nav() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoMark}>H</div>
        <span style={styles.logoText}>Honeyplate</span>
      </div>

      <nav style={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {})
            })}
          >
            <span style={styles.icon}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.footerDot} />
        <span style={styles.footerText}>Google Connected</span>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: '220px',
    minWidth: '220px',
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '24px 20px 20px',
    borderBottom: '1px solid #1e293b'
  },
  logoMark: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '16px',
    flexShrink: 0
  },
  logoText: {
    color: 'white',
    fontWeight: '600',
    fontSize: '15px',
    letterSpacing: '-0.2px'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 10px',
    gap: '2px',
    flex: 1
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#94a3b8',
    textDecoration: 'none',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s'
  },
  activeLink: {
    color: 'white',
    backgroundColor: '#1e3a5f'
  },
  icon: {
    fontSize: '14px',
    width: '18px',
    textAlign: 'center',
    flexShrink: 0
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  footerDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    flexShrink: 0
  },
  footerText: {
    color: '#64748b',
    fontSize: '12px'
  }
}

export default Nav
