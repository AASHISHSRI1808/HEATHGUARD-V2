import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield } from 'lucide-react';

const ROLES = [
  {k:'patient',icon:'🧑‍💼',label:'Patient',  color:'var(--green)', faint:'var(--green-faint)', glow:'var(--green-glow)', desc:'Access predictions & reports'},
  {k:'doctor', icon:'👨‍⚕️',label:'Doctor',   color:'var(--teal)',  faint:'var(--teal-faint)',  glow:'var(--teal-glow)',  desc:'Manage patients & appointments'},
  {k:'admin',  icon:'🛡️', label:'Admin',    color:'var(--violet)',faint:'var(--violet-faint)',glow:'var(--violet-glow)',desc:'Platform administration'},
];

export default function LoginPage() {
  const [role,  setRole]  = useState('patient');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [show,  setShow]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const { login } = useAuth();
  const { toggleTheme, dark } = useTheme();
  const navigate = useNavigate();

  const active = ROLES.find(r=>r.k===role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, pass);
      toast.success(`Welcome back, ${u.name}! 👋`);
      navigate(u.role==='admin'?'/admin':u.role==='doctor'?'/doctor-dashboard':'/dashboard');
    } catch(err) {
      toast.error(err.response?.data?.message||'Invalid credentials');
    } finally { setBusy(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-base)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',position:'relative',overflow:'hidden'}}>
      {/* Blobs */}
      <div style={{position:'absolute',top:'10%',left:'5%',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,var(--green-glow) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'10%',right:'5%',width:'300px',height:'300px',borderRadius:'50%',background:'radial-gradient(circle,var(--teal-glow) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:'460px',position:'relative',zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'36px'}}>
          <Link to="/" style={{display:'inline-flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'44px',height:'44px',background:'var(--g-brand)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',boxShadow:'0 6px 20px var(--green-glow)'}} className="a-float">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="28" height="28">
                <path d="M32 4 L56 14 L56 34 C56 46 44 56 32 60 C20 56 8 46 8 34 L8 14 Z" fill="rgba(255,255,255,0.9)" />
                <rect x="28" y="22" width="8" height="20" rx="2" fill="#84CC16"/>
                <rect x="22" y="28" width="20" height="8" rx="2" fill="#84CC16"/>
                <polyline points="18,32 22,32 25,26 29,38 33,28 36,36 38,32 46,32" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
              </svg>
            </div>
            <span style={{fontFamily:'Sora,sans-serif',fontSize:'24px',fontWeight:800,color:'var(--text-1)'}}>Health<span style={{color:'var(--accent)'}}>Guard</span></span>
          </Link>
        </div>

        <div className="card a-fadeup" style={{padding:'36px',boxShadow:'var(--s-lg)'}}>
          {/* Header row */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
            <h2 style={{fontFamily:'Sora,sans-serif',fontSize:'24px',fontWeight:900,color:'var(--text-1)'}}>Sign In</h2>
            <button onClick={toggleTheme} style={{background:'var(--bg-surface)',border:'1.5px solid var(--border)',borderRadius:'10px',padding:'6px 12px',cursor:'pointer',fontSize:'16px',transition:'all .2s',color:'var(--text-2)'}} title="Toggle theme">
              {dark?'☀️':'🌙'}
            </button>
          </div>
          <p style={{color:'var(--text-3)',fontSize:'14px',marginBottom:'28px',fontWeight:500}}>Choose your role and sign in below</p>

          {/* Role selector */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'20px'}}>
            {ROLES.map(r=>(
              <button key={r.k} onClick={()=>{ setRole(r.k); setEmail(''); setPass(''); }} type="button" style={{
                padding:'14px 8px',borderRadius:'14px',border:'2px solid',
                borderColor:role===r.k?r.color:'var(--border)',
                background:role===r.k?r.faint:'var(--bg-surface)',
                cursor:'pointer',textAlign:'center',transition:'all .2s'
              }}>
                <div style={{fontSize:'24px',marginBottom:'6px'}}>{r.icon}</div>
                <div style={{fontFamily:'Sora,sans-serif',fontSize:'13px',fontWeight:800,color:role===r.k?r.color:'var(--text-2)',marginBottom:'3px'}}>{r.label}</div>
                <div style={{fontSize:'10px',color:'var(--text-3)',fontWeight:600,lineHeight:1.3}}>{r.desc}</div>
                {role===r.k && <div style={{marginTop:'6px',fontSize:'10px',color:r.color,fontWeight:800}}>● Active</div>}
              </button>
            ))}
          </div>

          {/* Active role chip */}
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:active.faint,border:`1.5px solid ${active.glow}`,borderRadius:'12px',marginBottom:'24px'}}>
            <span className="pdot" style={{background:active.color}}/>
            <span style={{fontSize:'13px',color:'var(--text-2)',fontWeight:600}}>
              Signing in as <strong style={{color:active.color}}>{active.label}</strong>
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder={role==='admin'?'admin@healthguard.com':role==='doctor'?'dr.name@hospital.com':'you@example.com'} required value={email} onChange={e=>setEmail(e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{position:'relative'}}>
                <input type={show?'text':'password'} className="form-input" placeholder="Enter your password" required value={pass} style={{paddingRight:'44px'}} onChange={e=>setPass(e.target.value)}/>
                <button type="button" onClick={()=>setShow(!show)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:'4px'}}>
                  {show?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary btn-full btn-lg" style={{marginTop:'8px',background:active.color==='var(--green)'?'var(--g-emerald)':active.color==='var(--teal)'?'var(--g-teal)':'var(--g-violet)'}}>
              {busy ? <><div className="loading-spinner" style={{width:'18px',height:'18px',borderWidth:'2.5px',borderColor:'rgba(255,255,255,.3)',borderTopColor:'#fff'}}/> Signing in…</> : <><Shield size={16}/> Sign In as {active.label}</>}
            </button>
          </form>

          <p style={{textAlign:'center',marginTop:'24px',color:'var(--text-3)',fontSize:'14px',fontWeight:500}}>
            No account?{' '}
            <Link to="/register" style={{color:'var(--accent)',fontWeight:700,textDecoration:'none'}}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
