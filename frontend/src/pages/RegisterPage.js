import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole]     = useState('patient');
  const [show, setShow]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);
  const { register, registerDoctor } = useAuth();
  const { toggleTheme, dark } = useTheme();
  const navigate = useNavigate();

  const [pf, setPf] = useState({ name:'', email:'', password:'', mobile:'', age:'', gender:'', bloodGroup:'' });
  const [df, setDf] = useState({ name:'', email:'', password:'', mobile:'', mciNumber:'', specialization:'', experience:'', hospitalName:'', city:'', state:'', consultationFee:'500', about:'' });

  const handlePatient = async (e) => {
    e.preventDefault();
    if (pf.password.length<6) return toast.error('Password must be 6+ characters');
    setBusy(true);
    try { await register(pf); toast.success('Welcome to HealthGuard! 🎉'); navigate('/dashboard'); }
    catch(err) { toast.error(err.response?.data?.message||'Registration failed'); }
    finally { setBusy(false); }
  };

  const handleDoctor = async (e) => {
    e.preventDefault();
    if (df.password.length<6) return toast.error('Password must be 6+ characters');
    setBusy(true);
    try { await registerDoctor(df); setDone(true); toast.success('Application submitted!'); }
    catch(err) { toast.error(err.response?.data?.message||'Registration failed'); }
    finally { setBusy(false); }
  };

  if (done) return (
    <div style={{minHeight:'100vh',background:'var(--bg-base)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{textAlign:'center',maxWidth:'440px'}}>
        <div style={{width:'90px',height:'90px',background:'var(--green-faint)',border:'2.5px solid var(--green)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',boxShadow:'0 0 48px var(--green-glow)'}}>
          <CheckCircle size={44} color="var(--green)"/>
        </div>
        <h2 style={{fontFamily:'Sora,sans-serif',fontSize:'28px',fontWeight:900,color:'var(--text-1)',marginBottom:'12px'}}>Application Submitted! 🎉</h2>
        <p style={{color:'var(--text-2)',marginBottom:'32px',lineHeight:1.7,fontWeight:500}}>Your doctor profile is under review. Our admin team will verify your credentials and notify you by email within 24–48 hours.</p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </div>
    </div>
  );

  const inp = (val, onChange, placeholder, type='text', extra={}) => (
    <input type={type} className="form-input" placeholder={placeholder} value={val} onChange={e=>onChange(e.target.value)} {...extra}/>
  );

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-base)',padding:'40px 24px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'5%',right:'5%',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle,var(--green-glow) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'5%',left:'5%',width:'280px',height:'280px',borderRadius:'50%',background:'radial-gradient(circle,var(--teal-glow) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{maxWidth:role==='doctor'?'700px':'480px',margin:'0 auto',position:'relative',zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <Link to="/" style={{display:'inline-flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'42px',height:'42px',background:'var(--g-brand)',borderRadius:'13px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="26" height="26">
                <path d="M32 4 L56 14 L56 34 C56 46 44 56 32 60 C20 56 8 46 8 34 L8 14 Z" fill="rgba(255,255,255,0.9)" />
                <rect x="28" y="22" width="8" height="20" rx="2" fill="#84CC16"/>
                <rect x="22" y="28" width="20" height="8" rx="2" fill="#84CC16"/>
                <polyline points="18,32 22,32 25,26 29,38 33,28 36,36 38,32 46,32" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
              </svg>
            </div>
            <span style={{fontFamily:'Sora,sans-serif',fontSize:'22px',fontWeight:800,color:'var(--text-1)'}}>Health<span style={{color:'var(--accent)'}}>Guard</span></span>
          </Link>
        </div>

        <div className="card a-fadeup" style={{padding:'36px',boxShadow:'var(--s-lg)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
            <h2 style={{fontFamily:'Sora,sans-serif',fontSize:'24px',fontWeight:900,color:'var(--text-1)'}}>Create Account</h2>
            <button onClick={toggleTheme} style={{background:'var(--bg-surface)',border:'1.5px solid var(--border)',borderRadius:'10px',padding:'6px 12px',cursor:'pointer',fontSize:'16px',color:'var(--text-2)'}}>
              {dark?'☀️':'🌙'}
            </button>
          </div>
          <p style={{color:'var(--text-3)',fontSize:'14px',marginBottom:'28px',fontWeight:500}}>Select your role to get started</p>

          {/* Role cards */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'24px'}}>
            {[
              {k:'patient',icon:'🧑‍💼',label:'Patient',  desc:'Get AI health predictions',color:'var(--green)',faint:'var(--green-faint)',glow:'var(--green-glow)'},
              {k:'doctor', icon:'👨‍⚕️',label:'Doctor',   desc:'Join as a specialist',      color:'var(--teal)', faint:'var(--teal-faint)', glow:'var(--teal-glow)'},
            ].map(r=>(
              <button key={r.k} type="button" onClick={()=>{ setRole(r.k); setShow(false); }} style={{
                padding:'18px 12px',borderRadius:'16px',border:'2px solid',
                borderColor:role===r.k?r.color:'var(--border)',
                background:role===r.k?r.faint:'var(--bg-surface)',
                cursor:'pointer',textAlign:'center',transition:'all .2s'
              }}>
                <div style={{fontSize:'30px',marginBottom:'8px'}}>{r.icon}</div>
                <div style={{fontFamily:'Sora,sans-serif',fontSize:'15px',fontWeight:800,color:role===r.k?r.color:'var(--text-2)',marginBottom:'4px'}}>{r.label}</div>
                <div style={{fontSize:'11px',color:'var(--text-3)',fontWeight:600}}>{r.desc}</div>
                {role===r.k && <div style={{marginTop:'8px',fontSize:'10px',color:r.color,fontWeight:800}}>● Selected</div>}
              </button>
            ))}
          </div>

          {/* Active indicator */}
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:role==='patient'?'var(--green-faint)':'var(--teal-faint)',border:`1.5px solid ${role==='patient'?'var(--green-glow)':'var(--teal-glow)'}`,borderRadius:'12px',marginBottom:'24px'}}>
            <span className="pdot" style={{background:role==='patient'?'var(--green)':'var(--teal)'}}/>
            <span style={{fontSize:'13px',color:'var(--text-2)',fontWeight:600}}>
              Registering as <strong style={{color:role==='patient'?'var(--green)':'var(--teal)'}}>{role==='patient'?'Patient':'Doctor'}</strong>
              {role==='doctor' && ' — account requires admin approval'}
            </span>
          </div>

          {/* PATIENT FORM */}
          {role==='patient' && (
            <form onSubmit={handlePatient}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  {inp(pf.name,v=>setPf({...pf,name:v}),'John Doe',undefined,{required:true})}
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  {inp(pf.email,v=>setPf({...pf,email:v}),'john@example.com','email',{required:true})}
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{position:'relative'}}>
                    <input type={show?'text':'password'} className="form-input" placeholder="Min 6 characters" required value={pf.password} style={{paddingRight:'44px'}} onChange={e=>setPf({...pf,password:e.target.value})}/>
                    <button type="button" onClick={()=>setShow(!show)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-3)'}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  {inp(pf.mobile,v=>setPf({...pf,mobile:v}),'+91 9876543210','tel',{required:true})}
                </div>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" className="form-input form-input-number" placeholder="25" min="1" max="120" value={pf.age} onChange={e=>setPf({...pf,age:e.target.value})}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={pf.gender} onChange={e=>setPf({...pf,gender:e.target.value})}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-input" value={pf.bloodGroup} onChange={e=>setPf({...pf,bloodGroup:e.target.value})}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={busy} className="btn btn-primary btn-full btn-lg" style={{marginTop:'8px',background:'var(--g-emerald)'}}>
                {busy?<><div className="loading-spinner" style={{width:'18px',height:'18px',borderWidth:'2.5px',borderColor:'rgba(255,255,255,.3)',borderTopColor:'#fff'}}/> Creating…</>:'🧑‍💼 Create Patient Account'}
              </button>
            </form>
          )}

          {/* DOCTOR FORM */}
          {role==='doctor' && (
            <form onSubmit={handleDoctor}>
              <div className="alert alert-warning" style={{marginBottom:'20px'}}>⚠️ Doctor accounts require admin approval before you can log in.</div>
              <p style={{fontFamily:'Sora,sans-serif',fontSize:'12px',fontWeight:800,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:'12px'}}>Personal Details</p>
              <div className="grid-2">
                {[['name','Full Name','Dr. Jane Smith'],['email','Email','dr.jane@hospital.com','email'],['mobile','Mobile','+91 9876543210','tel']].map(([k,l,p,t='text'])=>(
                  <div className="form-group" key={k}><label className="form-label">{l} *</label>
                    <input type={t} className="form-input" placeholder={p} required value={df[k]} onChange={e=>setDf({...df,[k]:e.target.value})}/>
                  </div>
                ))}
                <div className="form-group"><label className="form-label">Password *</label>
                  <div style={{position:'relative'}}>
                    <input type={show?'text':'password'} className="form-input" placeholder="Min 6 characters" required value={df.password} style={{paddingRight:'44px'}} onChange={e=>setDf({...df,password:e.target.value})}/>
                    <button type="button" onClick={()=>setShow(!show)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-3)'}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                  </div>
                </div>
              </div>
              <p style={{fontFamily:'Sora,sans-serif',fontSize:'12px',fontWeight:800,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.8px',margin:'8px 0 12px'}}>Professional Details</p>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">MCI Number *</label>
                  <input type="text" className="form-input" placeholder="MCI-12345" required value={df.mciNumber} onChange={e=>setDf({...df,mciNumber:e.target.value})}/>
                </div>
                <div className="form-group"><label className="form-label">Specialization *</label>
                  <select className="form-input" required value={df.specialization} onChange={e=>setDf({...df,specialization:e.target.value})}>
                    <option value="">Select</option>
                    {['Cardiologist','Hepatologist','Neurologist','General Physician','Other'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Experience (yrs) *</label>
                  <input type="number" className="form-input form-input-number" placeholder="5" min="0" max="60" required value={df.experience} onChange={e=>setDf({...df,experience:e.target.value})}/>
                </div>
                <div className="form-group"><label className="form-label">Consultation Fee (₹)</label>
                  <input type="number" className="form-input form-input-number" placeholder="500" value={df.consultationFee} onChange={e=>setDf({...df,consultationFee:e.target.value})}/>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Hospital Name *</label>
                <input type="text" className="form-input" placeholder="AIIMS Delhi" required value={df.hospitalName} onChange={e=>setDf({...df,hospitalName:e.target.value})}/>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">City *</label>
                  <input type="text" className="form-input" placeholder="Delhi" required value={df.city} onChange={e=>setDf({...df,city:e.target.value})}/>
                </div>
                <div className="form-group"><label className="form-label">State *</label>
                  <input type="text" className="form-input" placeholder="Delhi" required value={df.state} onChange={e=>setDf({...df,state:e.target.value})}/>
                </div>
              </div>
              <div className="form-group"><label className="form-label">About / Bio</label>
                <textarea className="form-input" rows={3} placeholder="Brief description about your expertise…" value={df.about} onChange={e=>setDf({...df,about:e.target.value})} style={{resize:'vertical'}}/>
              </div>
              <button type="submit" disabled={busy} className="btn btn-full btn-lg" style={{marginTop:'8px',background:'var(--g-teal)',color:'#fff',border:'none',borderRadius:'12px',fontFamily:'Outfit',fontWeight:800,cursor:busy?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'15px',fontSize:'15px',boxShadow:'0 4px 18px var(--teal-glow)'}}>
                {busy?<><div className="loading-spinner" style={{width:'18px',height:'18px',borderWidth:'2.5px',borderColor:'rgba(255,255,255,.3)',borderTopColor:'#fff'}}/> Submitting…</>:'👨‍⚕️ Submit Doctor Application'}
              </button>
            </form>
          )}

          <p style={{textAlign:'center',marginTop:'24px',color:'var(--text-3)',fontSize:'14px',fontWeight:500}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'var(--accent)',fontWeight:700,textDecoration:'none'}}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
