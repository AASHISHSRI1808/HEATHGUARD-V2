import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/predictions'), api.get('/appointments')])
      .then(([p, a]) => { setPredictions(p.data.predictions||[]); setAppointments(a.data.appointments||[]); })
      .catch(console.error).finally(()=>setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greet = hour<12?'Good Morning ☀️':hour<17?'Good Afternoon 🌤️':'Good Evening 🌙';

  const riskBadge = (l) => ({ Low:{ bg:'rgba(5,150,105,0.12)', color:'var(--green-500)' }, Moderate:{ bg:'rgba(217,119,6,0.12)', color:'var(--amber-500)' }, High:{ bg:'rgba(225,29,72,0.12)', color:'var(--rose-500)' }, 'Very High':{ bg:'rgba(225,29,72,0.2)', color:'var(--rose-500)' } }[l] || { bg:'var(--bg-raised)', color:'var(--text-muted)' });

  const tips = [
    '💧 Drink at least 8 glasses of water daily for optimal kidney function.',
    '🏃 30 minutes of moderate exercise reduces cardiovascular risk by 35%.',
    '🥦 A diet rich in vegetables lowers liver disease risk significantly.',
    '😴 7-9 hours of sleep reduces cognitive decline and Parkinson\'s risk.',
    '🚭 Quitting smoking cuts heart disease risk by 50% within one year.',
  ];
  const tip = tips[new Date().getDay() % tips.length];

  return (
    <div className="page-container bg-bio">
      <Navbar />
      <div className="content-wrapper">

        {/* Welcome banner */}
        <div className="animate-fadeInUp" style={{ background: 'var(--gradient-brand)', borderRadius: '24px', padding: '28px 36px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', boxShadow: '0 16px 50px var(--accent-glow)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position:'absolute', right:'-30px', top:'-40px', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:'18px', zIndex:1 }}>
            <div style={{ width:'62px', height:'62px', borderRadius:'20px', background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', fontWeight:900, color:'white', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'13px', fontWeight:600, marginBottom:'4px' }}>{greet}</p>
              <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(20px,3vw,28px)', fontWeight:900, color:'white', marginBottom:'4px', letterSpacing:'-0.5px' }}>{user?.name?.split(' ')[0]}</h1>
              <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'13px', fontWeight:500 }}>Here's your health overview</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:'10px', zIndex:1, flexWrap:'wrap' }}>
            <Link to="/symptom-predict" style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'11px 20px', borderRadius:'13px', background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.3)', color:'white', textDecoration:'none', fontWeight:700, fontSize:'14px', backdropFilter:'blur(6px)', transition:'all 0.2s' }}
              onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.26)'}
              onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}>
              🩺 Check Symptoms
            </Link>
            <Link to="/doctors" style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'11px 20px', borderRadius:'13px', background:'white', color:'#84CC16', textDecoration:'none', fontWeight:800, fontSize:'14px', transition:'all 0.2s', boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-1px)'}
              onMouseOut={e=>e.currentTarget.style.transform=''}>
              👨‍⚕️ Find Doctor
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom:'24px' }}>
          {[
            { emoji:'🔬', label:'Predictions',  val:predictions.length,                                       color:'var(--teal-500)',   bg:'rgba(13,148,136,0.1)'  },
            { emoji:'📋', label:'Reports',      val:predictions.length,                                       color:'var(--cyan-500)',   bg:'rgba(30,58,138,0.1)'   },
            { emoji:'📅', label:'Appointments', val:appointments.length,                                      color:'var(--accent)',     bg:'var(--accent-soft)'    },
            { emoji:'✅', label:'Confirmed',    val:appointments.filter(a=>a.status==='Confirmed').length,   color:'var(--violet-500)',bg:'rgba(124,58,237,0.1)'  },
          ].map((s,i)=>(
            <div key={i} className={`stat-card animate-fadeInUp stagger-${i+2}`}>
              <div className="stat-icon" style={{ background:s.bg }}>{s.emoji}</div>
              <div className="stat-info">
                <div className="stat-value" style={{ color:s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid-3" style={{ marginBottom:'24px' }}>
          {[
            { to:'/symptom-predict', emoji:'🩺', title:'Disease Risk Analysis',  desc:'Symptoms → Tests → Upload Reports → AI Risk Assessment', color:'#667eea',   bg:'rgba(102,126,234,0.1)',   bdr:'rgba(102,126,234,0.25)', badge:null },
            { to:'/doctors',         emoji:'👨‍⚕️',title:'Find Specialists',        desc:'Browse doctors, book consultations, pay online',           color:'var(--accent)',     bg:'var(--accent-soft)',    bdr:'var(--accent-glow)', badge:null },
            { to:'/reports',         emoji:'📄', title:'My Health Reports',        desc:'Download AI-generated PDF reports anytime',                color:'var(--violet-500)',bg:'rgba(124,58,237,0.1)', bdr:'rgba(124,58,237,0.2)', badge:null },
          ].map((a,i)=>(
            <Link key={i} to={a.to} style={{ textDecoration:'none' }} className={`animate-fadeInUp stagger-${i+4}`}>
              <div className="card" style={{ display:'flex', alignItems:'center', gap:'16px', border:`1.5px solid ${a.bdr}`, background:`linear-gradient(145deg, var(--bg-surface) 0%, ${a.bg} 100%)`, cursor:'pointer', transition:'all 0.25s', position:'relative', overflow:'hidden' }}
                onMouseOver={e=>{ e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow=`0 16px 44px ${a.bg}`; e.currentTarget.style.borderColor=a.color; }}
                onMouseOut={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=a.bdr; }}>
                {a.badge && <span style={{ position:'absolute', top:'10px', right:'10px', padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:800, background:a.color, color:'white' }}>{a.badge}</span>}
                <div style={{ width:'56px', height:'56px', background:a.bg, borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', flexShrink:0, border:`1.5px solid ${a.bdr}` }}>{a.emoji}</div>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'15px', fontWeight:800, color:'var(--text-primary)', marginBottom:'4px', letterSpacing:'-0.2px' }}>{a.title}</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:'12px', lineHeight:1.55, fontWeight:500 }}>{a.desc}</p>
                </div>
                <div style={{ width:'30px', height:'30px', borderRadius:'10px', background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${a.bdr}` }}>
                  <ArrowRight size={14} color={a.color}/>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid-2">
          {/* Recent Predictions */}
          <div className="card animate-fadeInUp stagger-2">
            <div className="card-header">
              <h2 className="card-title">🔬 Recent Predictions</h2>
              <Link to="/reports" style={{ fontSize:'13px', color:'var(--accent)', textDecoration:'none', fontWeight:700 }}>View All →</Link>
            </div>
            {loading ? (
              <div className="loading-container" style={{ minHeight:'140px' }}><div className="loading-spinner"/></div>
            ) : predictions.length===0 ? (
              <div style={{ textAlign:'center', padding:'36px 20px' }}>
                <div style={{ fontSize:'44px', marginBottom:'12px' }}>🔬</div>
                <p style={{ color:'var(--text-muted)', marginBottom:'16px', fontWeight:600 }}>No predictions yet</p>
                <Link to="/predict" className="btn btn-primary btn-sm">Run First Prediction</Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {predictions.slice(0,5).map(p=>(
                  <Link key={p._id} to={`/prediction-result/${p._id}`} style={{ textDecoration:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px', background:'var(--bg-raised)', borderRadius:'14px', border:'1.5px solid var(--border-subtle)', cursor:'pointer', transition:'all 0.2s' }}
                      onMouseOver={e=>{ e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-soft)'; }}
                      onMouseOut={e=>{ e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.background='var(--bg-raised)'; }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'var(--bg-surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'21px', border:'1.5px solid var(--border-subtle)', flexShrink:0 }}>
                        {p.diseaseType==='Heart'?'❤️':p.diseaseType==='Liver'?'🫀':'🧠'}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:'14px', color:'var(--text-primary)' }}>{p.diseaseType} Disease</div>
                        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px', fontWeight:500 }}>
                          {new Date(p.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <span style={{ display:'block', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:800, background:p.result?.prediction==='Positive'?'rgba(225,29,72,0.12)':'rgba(5,150,105,0.12)', color:p.result?.prediction==='Positive'?'var(--rose-500)':'var(--green-500)', marginBottom:'4px' }}>
                          {p.result?.prediction}
                        </span>
                        <span style={{ fontSize:'11px', fontWeight:800, color:riskBadge(p.result?.riskLevel).color }}>
                          {p.result?.riskLevel} Risk
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="card animate-fadeInUp stagger-3">
            <div className="card-header">
              <h2 className="card-title">📅 Appointments</h2>
              <Link to="/appointments" style={{ fontSize:'13px', color:'var(--accent)', textDecoration:'none', fontWeight:700 }}>View All →</Link>
            </div>
            {loading ? (
              <div className="loading-container" style={{ minHeight:'140px' }}><div className="loading-spinner"/></div>
            ) : appointments.length===0 ? (
              <div style={{ textAlign:'center', padding:'36px 20px' }}>
                <div style={{ fontSize:'44px', marginBottom:'12px' }}>📅</div>
                <p style={{ color:'var(--text-muted)', marginBottom:'16px', fontWeight:600 }}>No appointments yet</p>
                <Link to="/doctors" className="btn btn-primary btn-sm">Find a Doctor</Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {appointments.filter(a=>a.status!=='Cancelled').slice(0,5).map(appt=>{
                  const sc = { Confirmed:{bg:'rgba(5,150,105,0.1)',color:'var(--green-500)'}, Pending:{bg:'rgba(217,119,6,0.1)',color:'var(--amber-500)'}, Completed:{bg:'rgba(2,132,199,0.1)',color:'var(--blue-500)'} }[appt.status]||{bg:'var(--bg-raised)',color:'var(--text-muted)'};
                  return (
                    <div key={appt._id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px', background:'var(--bg-raised)', borderRadius:'14px', border:'1.5px solid var(--border-subtle)' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(30,58,138,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'21px', border:'1.5px solid rgba(30,58,138,0.2)', flexShrink:0 }}>👨‍⚕️</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:'14px', color:'var(--text-primary)' }}>Dr. {appt.doctorId?.name||'Doctor'}</div>
                        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px', fontWeight:500 }}>
                          {appt.doctorId?.specialization} · {new Date(appt.appointmentDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · {appt.timeSlot}
                        </div>
                      </div>
                      <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:800, background:sc.bg, color:sc.color, flexShrink:0 }}>{appt.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Report Upload Quick Access */}
        <div className="animate-fadeInUp" style={{ marginTop:'24px', marginBottom:'20px', padding:'22px 26px', borderRadius:'20px', background:'linear-gradient(135deg,rgba(132,204,22,0.08) 0%,rgba(30,58,138,0.08) 100%)', border:'1.5px solid rgba(132,204,22,0.30)', display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'16px', background:'linear-gradient(135deg,#1E3A8A,#84CC16)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', boxShadow:'0 4px 16px rgba(132,204,22,0.32)', flexShrink:0 }}>📋</div>
            <div>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'16px', fontWeight:900, color:'var(--text-primary)', marginBottom:'4px' }}>Upload Medical Report</h3>
              <p style={{ fontSize:'13px', color:'var(--text-muted)', fontWeight:500, lineHeight:1.5 }}>Upload your lab report or scan for AI-powered analysis and personalised health recommendations.</p>
            </div>
          </div>
          <Link to="/symptom-predict" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 22px', borderRadius:'13px', background:'linear-gradient(135deg,#1E3A8A,#84CC16)', color:'white', textDecoration:'none', fontWeight:800, fontSize:'14px', fontFamily:'Outfit,sans-serif', boxShadow:'0 4px 16px rgba(132,204,22,0.32)', flexShrink:0, whiteSpace:'nowrap' }}
            onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform=''}>
            📤 Upload &amp; Analyse
          </Link>
        </div>

        {/* Health Tip */}
        <div className="animate-fadeInUp" style={{ marginTop:'0px', padding:'20px 24px', borderRadius:'18px', background:'var(--accent-soft)', border:'1.5px solid var(--accent-glow)', display:'flex', alignItems:'flex-start', gap:'16px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:'var(--gradient-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>💡</div>
          <div>
            <p style={{ fontWeight:800, color:'var(--accent)', fontSize:'13px', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Daily Health Tip</p>
            <p style={{ color:'var(--text-secondary)', fontSize:'14px', lineHeight:1.6, fontWeight:500 }}>{tip}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
