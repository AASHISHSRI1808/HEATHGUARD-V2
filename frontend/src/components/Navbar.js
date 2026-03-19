import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, ChevronDown, LayoutDashboard, Sun, Moon } from 'lucide-react';

// Inline SVG logo component
function HGLogo({ size = 36 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width={size} height={size}>
      <defs>
        <linearGradient id="hgShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#1E3A8A"/>
          <stop offset="50%"  stopColor="#2E4DAD"/>
          <stop offset="100%" stopColor="#84CC16"/>
        </linearGradient>
      </defs>
      <path d="M32 4 L56 14 L56 34 C56 46 44 56 32 60 C20 56 8 46 8 34 L8 14 Z" fill="url(#hgShield)" />
      <rect x="28" y="22" width="8" height="20" rx="2" fill="white" opacity="0.95"/>
      <rect x="22" y="28" width="20" height="8" rx="2" fill="white" opacity="0.95"/>
      <polyline points="16,32 21,32 24,25 28,40 32,27 36,37 39,32 48,32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = theme === 'dark';
  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const getDash = () => user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor-dashboard' : '/dashboard';
  const isActive = (p) => location.pathname === p;

  const roleConfig = {
    admin:   { color:'var(--violet-500)', bg:'rgba(124,58,237,0.12)', label:'Admin'   },
    doctor:  { color:'var(--cyan-500)',   bg:'rgba(30,58,138,0.12)',   label:'Doctor'  },
    patient: { color:'var(--accent)',      bg:'var(--accent-soft)',     label:'Patient' },
  };
  const rc = roleConfig[user?.role] || roleConfig.patient;

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="nav-logo">
        <div className="nav-logo-icon" style={{ background: 'none', padding: 0, overflow: 'hidden' }}>
          <HGLogo size={38} />
        </div>
        <span className="nav-logo-text">Health<span>Guard</span></span>
      </Link>

      {user ? (
        <>
          <ul className="nav-links">
            <li><Link to={getDash()} className={isActive(getDash()) ? 'active':''}>🏠 Dashboard</Link></li>
            {user.role === 'patient' && (<>
              <li><Link to="/symptom-predict" className={isActive('/symptom-predict')?'active':''}>🩺 AI Diagnosis</Link></li>
              <li><Link to="/predict"      className={isActive('/predict') ?'active':''}>🔬 ML Predict</Link></li>
              <li><Link to="/doctors"      className={isActive('/doctors') ?'active':''}>👨‍⚕️ Doctors</Link></li>
              <li><Link to="/appointments" className={isActive('/appointments')?'active':''}>📅 Appointments</Link></li>
              <li><Link to="/reports"      className={isActive('/reports')?'active':''}>📋 Reports</Link></li>
            </>)}
            {user.role === 'doctor' && (<>
              <li><Link to="/symptom-predict" className={isActive('/symptom-predict')?'active':''}>🩺 AI Diagnosis</Link></li>
              <li><Link to="/doctor-predict" className={isActive('/doctor-predict')?'active':''}>🔬 ML Prediction</Link></li>
            </>)}
          </ul>

          <div className="nav-actions">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`theme-toggle ${isDark?'dark':''}`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="theme-toggle-knob">{isDark ? '🌙' : '☀️'}</div>
            </button>

            {/* Role pill */}
            <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:800, background:rc.bg, color:rc.color, border:`1px solid ${rc.color}30`, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              {rc.label}
            </span>

            {/* User dropdown */}
            <div style={{ position:'relative' }}>
              <button onClick={() => setMenuOpen(o=>!o)} style={{
                display:'flex', alignItems:'center', gap:'8px',
                background:'var(--bg-surface)', border:'1.5px solid var(--border)',
                borderRadius:'12px', padding:'7px 13px', cursor:'pointer',
                color:'var(--text-primary)', fontFamily:'Outfit,sans-serif', fontSize:'14px', fontWeight:600,
                boxShadow:'var(--shadow-xs)', transition:'all 0.2s'
              }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'9px', background:'var(--gradient-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:900, color:'white' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name?.split(' ')[0]}</span>
                <ChevronDown size={13} color="var(--text-muted)" style={{ transition:'transform 0.2s', transform: menuOpen?'rotate(180deg)':'none' }} />
              </button>

              {menuOpen && (
                <div style={{
                  position:'absolute', top:'50px', right:0,
                  background:'var(--bg-surface)', border:'1.5px solid var(--border-subtle)',
                  borderRadius:'18px', padding:'8px', minWidth:'210px',
                  boxShadow:'var(--shadow-xl)', zIndex:200,
                  animation:'scaleIn 0.18s cubic-bezier(0.4,0,0.2,1)'
                }}>
                  {/* Profile info */}
                  <div style={{ padding:'12px 16px 14px', borderBottom:'1px solid var(--border-subtle)', marginBottom:'6px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'11px', background:'var(--gradient-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:900, color:'white' }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize:'14px', fontWeight:800, color:'var(--text-primary)' }}>{user.name}</p>
                        <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{user.email}</p>
                      </div>
                    </div>
                    <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:800, background:rc.bg, color:rc.color, border:`1px solid ${rc.color}30`, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      {rc.label}
                    </span>
                  </div>

                  {/* Dark/Light toggle row */}
                  <button onClick={() => { toggleTheme(); setMenuOpen(false); }} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    width:'100%', padding:'10px 14px', background:'none', border:'none',
                    color:'var(--text-secondary)', cursor:'pointer', borderRadius:'11px',
                    fontSize:'14px', fontFamily:'Outfit,sans-serif', fontWeight:600,
                    transition:'all 0.15s'
                  }}
                    onMouseOver={e=>e.currentTarget.style.background='var(--bg-raised)'}
                    onMouseOut={e=>e.currentTarget.style.background='none'}
                  >
                    <span style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      {isDark ? <Sun size={14} color="var(--amber-500)"/> : <Moon size={14} color="var(--violet-500)"/>}
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </span>
                    <div className={`theme-toggle ${isDark?'dark':''}`} style={{ width:'36px', height:'20px', pointerEvents:'none' }}>
                      <div className="theme-toggle-knob" style={{ width:'14px', height:'14px', fontSize:'8px' }}>{isDark?'🌙':'☀️'}</div>
                    </div>
                  </button>

                  <button onClick={() => { navigate(getDash()); setMenuOpen(false); }} style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    width:'100%', padding:'10px 14px', background:'none', border:'none',
                    color:'var(--text-secondary)', cursor:'pointer', borderRadius:'11px',
                    fontSize:'14px', fontFamily:'Outfit,sans-serif', fontWeight:600, transition:'all 0.15s'
                  }}
                    onMouseOver={e=>e.currentTarget.style.background='var(--bg-raised)'}
                    onMouseOut={e=>e.currentTarget.style.background='none'}
                  >
                    <LayoutDashboard size={14} color="var(--accent)" /> Dashboard
                  </button>

                  <div style={{ height:'1px', background:'var(--border-subtle)', margin:'4px 0' }} />

                  <button onClick={handleLogout} style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    width:'100%', padding:'10px 14px', background:'none', border:'none',
                    color:'var(--rose-500)', cursor:'pointer', borderRadius:'11px',
                    fontSize:'14px', fontFamily:'Outfit,sans-serif', fontWeight:700, transition:'all 0.15s'
                  }}
                    onMouseOver={e=>e.currentTarget.style.background='rgba(225,29,72,0.08)'}
                    onMouseOut={e=>e.currentTarget.style.background='none'}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <ul className="nav-links">
            <li><Link to="/" className={isActive('/')?'active':''}>Home</Link></li>
            <li><Link to="/register">For Doctors</Link></li>
          </ul>
          <div className="nav-actions">
            <button onClick={toggleTheme} className={`theme-toggle ${isDark?'dark':''}`} title="Toggle theme">
              <div className="theme-toggle-knob">{isDark?'🌙':'☀️'}</div>
            </button>
            <Link to="/login"    className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started →</Link>
          </div>
        </>
      )}
    </nav>
  );
}
