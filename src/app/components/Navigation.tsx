import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Plan Trip', href: '/plan-trip' },
  { label: 'Saved Trips', href: '/saved-trips' },
  { label: 'About', href: '/about' },
];

// Pages that have a dark background — navigation should adapt
const DARK_PAGES = ['/results', '/trip-details'];


export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isDark = DARK_PAGES.some(p => location.pathname.startsWith(p));

  // Theme tokens — 4-color mint/emerald palette for dark pages
  const bg      = isDark ? 'rgba(1,50,32,0.88)' : 'rgba(247, 244, 239, 0.88)';
  const bgHover = isDark ? 'rgba(80,200,120,0.10)' : 'rgba(26,24,20,0.06)';
  const textCol = isDark ? 'rgba(209,242,235,0.7)' : '#6B6560';
  const textAct = isDark ? '#D1F2EB' : '#1A1814';
  const border  = isDark ? 'rgba(80,200,120,0.18)' : 'rgba(26, 24, 20, 0.09)';
  const brandCol = isDark ? '#D1F2EB' : '#1A1814';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex items-center px-6 md:px-10"
        style={{
          height: 60,
          // No background — just floating text/icons
          pointerEvents: 'none',
        }}
      >
        {/* ── Brand (far left) ─────────────────────────── */}
        <Link
          to="/"
          className="pointer-events-auto flex-shrink-0"
          style={{ textDecoration: 'none' }}
        >
          <span
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: brandCol,
              lineHeight: 1,
              transition: 'color 0.3s',
            }}
          >
            TRIPSMART
          </span>
        </Link>

        {/* ── Centered nav links ────────────────────────── */}
        <nav
          className="pointer-events-auto hidden md:flex items-center gap-0 absolute left-1/2"
          style={{
            transform: 'translateX(-50%)',
            background: scrolled ? bg.replace('0.88', '0.95') : bg,
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            border: `1px solid ${border}`,
            borderRadius: '9999px',
            padding: '4px 6px',
            boxShadow: scrolled
              ? (isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(26, 24, 20, 0.09)')
              : (isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 10px rgba(26, 24, 20, 0.06)'),
            transition: 'all 0.3s ease',
          }}
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '0.83rem',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.01em',
                  color: isActive ? textAct : textCol,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: isActive
                    ? (isDark ? 'rgba(80,200,120,0.18)' : 'rgba(26, 24, 20, 0.07)')
                    : 'transparent',
                  transition: 'all 0.18s ease',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = textAct;
                    (e.currentTarget as HTMLElement).style.background = bgHover;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = textCol;
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right side ───────────────────────────────── */}
        <div className="pointer-events-auto flex items-center gap-3 ml-auto">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              {/* Profile avatar icon only */}
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                aria-label="Profile menu"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isDark ? '#50C878' : '#C85F3C',
                  color: isDark ? '#013220' : '#FFFFFF',
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: dropdownOpen ? '2px solid #1A1814' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.2s, transform 0.2s',
                  boxShadow: isDark ? '0 2px 8px rgba(80,200,120,0.30)' : '0 2px 8px rgba(200, 95, 60, 0.30)',
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
              >
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-52 py-1.5 z-50"
                    style={{
                      background: '#F7F4EF',
                      border: '1px solid rgba(26, 24, 20, 0.10)',
                      borderRadius: '0.875rem',
                      boxShadow: '0 8px 32px rgba(26, 24, 20, 0.12)',
                    }}
                  >
                    {/* User info header */}
                    <div style={{ padding: '10px 16px 10px', borderBottom: '1px solid rgba(26, 24, 20, 0.07)' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1A1814', margin: 0 }}>{user?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9A958F', margin: 0, marginTop: 1 }}>{user?.email}</p>
                    </div>
                    {[
                      { label: 'Profile', href: '/profile' },
                      { label: 'My Trips', href: '/my-trips' },
                      { label: 'Settings', href: '/settings' },
                    ].map(link => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="block px-4 py-2.5"
                        style={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontSize: '0.85rem',
                          color: '#1A1814',
                          textDecoration: 'none',
                          borderRadius: '0.5rem',
                          margin: '0 4px',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26, 24, 20, 0.05)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(26, 24, 20, 0.07)', margin: '4px 8px' }} />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5"
                      style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: '0.85rem',
                        color: '#C85F3C',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                        margin: '0 4px',
                        width: 'calc(100% - 8px)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200, 95, 60, 0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '0.83rem',
                  fontWeight: 500,
                  color: '#6B6560',
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'color 0.18s, background 0.18s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = '#1A1814';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(26, 24, 20, 0.06)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = '#6B6560';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: isDark ? '#013220' : '#F7F4EF',
                  background: isDark ? '#50C878' : '#1A1814',
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'background 0.18s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? '#D1F2EB' : '#C85F3C'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isDark ? '#50C878' : '#1A1814'}
              >
                Get started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col items-center justify-center gap-[5px]"
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(247,244,239,0.80)', border: '1px solid rgba(26,24,20,0.10)', backdropFilter: 'blur(10px)', cursor: 'pointer' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className="block"
              style={{ width: 14, height: 1.5, background: '#1A1814', borderRadius: 2 }}
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="block"
              style={{ width: 14, height: 1.5, background: '#1A1814', borderRadius: 2 }}
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className="block"
              style={{ width: 14, height: 1.5, background: '#1A1814', borderRadius: 2 }}
            />
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[68px] left-4 right-4 z-40"
          >
            <div
              className="overflow-hidden"
              style={{
                background: 'rgba(247, 244, 239, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(26, 24, 20, 0.10)',
                borderRadius: '1rem',
                boxShadow: '0 8px 32px rgba(26,24,20,0.10)',
              }}
            >
              <div className="py-2 px-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block px-4 py-3"
                      style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: '0.9rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#C85F3C' : '#1A1814',
                        borderRadius: '0.5rem',
                        background: isActive ? 'rgba(200, 95, 60, 0.08)' : 'transparent',
                        textDecoration: 'none',
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div style={{ borderTop: '1px solid rgba(26, 24, 20, 0.08)', margin: '8px 0' }} />
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="block px-4 py-3" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '0.9rem', color: '#1A1814', textDecoration: 'none', borderRadius: '0.5rem' }}>
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '0.9rem', color: '#C85F3C', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-2 pb-2">
                    <Link
                      to="/login"
                      className="flex-1 text-center px-4 py-2.5"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '0.85rem', color: '#1A1814', border: '1px solid rgba(26, 24, 20, 0.15)', borderRadius: '0.5rem', textDecoration: 'none' }}
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="flex-1 text-center px-4 py-2.5"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '0.85rem', color: '#F7F4EF', background: '#1A1814', borderRadius: '0.5rem', textDecoration: 'none' }}
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
