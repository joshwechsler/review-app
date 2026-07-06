import { NavLink } from 'react-router-dom'

const links = [
  { to: '/send-request', label: 'Send Request' },
  { to: '/private-feedback', label: 'Private Feedback' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' }
]

function Nav() {
  return (
    <nav style={styles.nav}>
      <span style={styles.logo}>Honeyplate Reviews</span>
      <div style={styles.links}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {})
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    padding: '0 32px',
    height: '60px',
    borderBottom: '1px solid #374151',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: {
    color: '#a855f7',
    fontWeight: 'bold',
    fontSize: '18px',
    letterSpacing: '-0.3px'
  },
  links: {
    display: 'flex',
    gap: '8px'
  },
  link: {
    color: '#9ca3af',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.15s'
  },
  activeLink: {
    color: 'white',
    backgroundColor: '#374151'
  }
}

export default Nav
