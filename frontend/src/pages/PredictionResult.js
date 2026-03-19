import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Download, ArrowRight, CheckCircle, AlertTriangle, Activity, BarChart2, FileText } from 'lucide-react';

const RISK_CFG = {
  Low:       { color:'#84CC16', bg:'rgba(132,204,22,0.08)',  border:'rgba(132,204,22,0.28)',  icon:'✅', label:'Low Risk',      msg:'Low risk detected. Maintain a healthy lifestyle and schedule routine check-ups.' },
  Moderate:  { color:'#f59e0b', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.25)',  icon:'⚠️', label:'Moderate Risk', msg:'Moderate risk. Consult a doctor soon and follow recommended lifestyle changes.' },
  High:      { color:'#ef4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.25)',   icon:'🚨', label:'High Risk',     msg:'High risk detected. Seek prompt medical consultation and further diagnostic tests.' },
  'Very High':{ color:'#dc2626', bg:'rgba(220,38,38,0.1)',   border:'rgba(220,38,38,0.3)',    icon:'🆘', label:'Very High Risk',msg:'Very high risk. Seek urgent medical attention immediately.' },
};
const DISEASE_COLORS = { Heart:'#e11d48', Liver:'#d97706', Parkinson:'#7c3aed' };
const DISEASE_ICONS  = { Heart:'❤️', Liver:'🫀', Parkinson:'🧠' };
const SPECIALIST     = { Heart:'Cardiologist', Liver:'Hepatologist', Parkinson:'Neurologist' };

/* ── Animated SVG radial gauge ────────────────────────── */
function RadialGauge({ probability, color, size=180 }) {
  const r = 68, cx = size/2, cy = size/2;
  const circ = 2 * Math.PI * r;
  const arc  = (probability / 100) * circ * 0.75; // 270° sweep
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(135deg)' }}>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-raised)" strokeWidth="14"
          strokeDasharray={`${circ*0.75} ${circ*0.25}`} strokeLinecap="round"/>
        {/* fill */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)', filter:`drop-shadow(0 0 8px ${color}60)` }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'Outfit,sans-serif', fontSize:'32px', fontWeight:900, color, lineHeight:1 }}>{probability}%</span>
        <span style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:700, marginTop:'2px' }}>Probability</span>
      </div>
    </div>
  );
}

/* ── Horizontal bar for each parameter ────────────────── */
function ParamBar({ label, value, max, unit, color }) {
  const pct = Math.min(100, (parseFloat(value)/max)*100);
  return (
    <div style={{ marginBottom:'10px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
        <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize:'12px', fontWeight:800, color:'var(--text-primary)', fontFamily:'DM Mono,monospace' }}>{value}{unit?` ${unit}`:''}</span>
      </div>
      <div style={{ height:'7px', borderRadius:'10px', background:'var(--bg-raised)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:'10px', background:`linear-gradient(90deg,${color}80,${color})`, transition:'width 1.2s ease' }}/>
      </div>
    </div>
  );
}

/* ── Reference ranges per disease ─────────────────────── */
const PARAM_META = {
  age:{ label:'Age', max:100, unit:'yrs' }, trestbps:{ label:'Resting BP', max:220, unit:'mmHg' },
  chol:{ label:'Cholesterol', max:600, unit:'mg/dL' }, thalach:{ label:'Max HR', max:250, unit:'bpm' },
  oldpeak:{ label:'ST Depression', max:6, unit:'mm' },
  Total_Bilirubin:{ label:'Total Bilirubin', max:10, unit:'mg/dL' },
  Direct_Bilirubin:{ label:'Direct Bilirubin', max:5, unit:'mg/dL' },
  Alkaline_Phosphotase:{ label:'ALP', max:1000, unit:'IU/L' },
  Alamine_Aminotransferase:{ label:'ALT/SGPT', max:300, unit:'IU/L' },
  Aspartate_Aminotransferase:{ label:'AST/SGOT', max:300, unit:'IU/L' },
  Total_Protiens:{ label:'Total Proteins', max:12, unit:'g/dL' },
  Albumin:{ label:'Albumin', max:8, unit:'g/dL' },
  'MDVP:Fo(Hz)':{ label:'Vocal Freq (Fo)', max:300, unit:'Hz' },
  HNR:{ label:'HNR', max:40, unit:'' },
  RPDE:{ label:'RPDE', max:1, unit:'' },
  PPE:{ label:'PPE (Pitch Entropy)', max:1, unit:'' },
};

export default function PredictionResult() {
  const { id } = useParams();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/predictions/${id}`)
      .then(res => setPrediction(res.data.prediction))
      .catch(() => navigate(isDoctor ? '/doctor-dashboard' : '/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get(`/predictions/${id}/pdf`, { responseType:'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealthGuard_Report_${prediction.reportId}.pdf`;
      a.click();
    } catch { alert('PDF download failed. Please try again.'); }
  };

  if (loading) return (
    <div className="page-container"><Navbar/>
      <div className="loading-container" style={{ minHeight:'calc(100vh - 64px)' }}>
        <div className="loading-spinner" style={{ width:'50px', height:'50px', borderWidth:'3px' }}/>
        <p style={{ color:'var(--text-muted)', fontWeight:600 }}>Loading prediction report…</p>
      </div>
    </div>
  );
  if (!prediction) return null;

  const rCfg      = RISK_CFG[prediction.result?.riskLevel] || RISK_CFG.Low;
  const dColor    = DISEASE_COLORS[prediction.diseaseType] || '#4f46e5';
  const dIcon     = DISEASE_ICONS[prediction.diseaseType]  || '🔬';
  const isPos     = prediction.result?.prediction === 'Positive';
  const params    = prediction.inputParameters || {};
  const paramKeys = Object.keys(params);
  const vizKeys   = paramKeys.filter(k => PARAM_META[k]).slice(0, 8);
  const tabStyle  = (t) => ({
    padding:'9px 20px', borderRadius:'10px', border:'none', cursor:'pointer',
    fontSize:'13px', fontWeight:700, fontFamily:'Outfit,sans-serif',
    background: activeTab===t ? dColor : 'transparent',
    color: activeTab===t ? 'white' : 'var(--text-secondary)',
    transition:'all 0.2s',
  });

  return (
    <div className="page-container" style={{ background:'var(--bg-base)' }}>
      <Navbar/>
      <div className="content-wrapper" style={{ maxWidth:'960px' }}>

        {/* ── Top Header Banner ─────────────────────────── */}
        <div style={{
          borderRadius:'24px', padding:'28px 32px', marginBottom:'24px',
          background:`linear-gradient(135deg, ${dColor}12 0%, var(--bg-surface) 100%)`,
          border:`2px solid ${dColor}30`,
          boxShadow:`0 8px 32px ${dColor}15`,
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', right:'-20px', top:'-20px', width:'160px', height:'160px', borderRadius:'50%', background:`${dColor}06`, pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'20px', flexWrap:'wrap', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:'18px', alignItems:'flex-start' }}>
              <div style={{ width:'72px', height:'72px', borderRadius:'20px', background:`${dColor}15`, border:`2px solid ${dColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', flexShrink:0 }}>{dIcon}</div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px', flexWrap:'wrap' }}>
                  <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(18px,3vw,26px)', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.3px' }}>{prediction.diseaseType} Disease Analysis</h1>
                  <span style={{ padding:'4px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:800, background:isPos?'rgba(239,68,68,0.12)':'rgba(132,204,22,0.12)', color:isPos?'#ef4444':'#84CC16', border:`1.5px solid ${isPos?'rgba(239,68,68,0.3)':'rgba(132,204,22,0.30)'}` }}>
                    {isPos ? '⚠️ Positive' : '✅ Negative'}
                  </span>
                  <span style={{ padding:'4px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:800, background:rCfg.bg, color:rCfg.color, border:`1.5px solid ${rCfg.border}` }}>{rCfg.label}</span>
                </div>
                <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:600 }}>Report ID: <span style={{ fontFamily:'DM Mono,monospace', color:'var(--text-secondary)' }}>{prediction.reportId}</span></span>
                  <span style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:600 }}>Patient: <span style={{ color:'var(--text-secondary)', fontWeight:700 }}>{prediction.patientName}</span></span>
                  <span style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:600 }}>{new Date(prediction.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', flexShrink:0 }}>
              <button onClick={handleDownloadPDF} className="btn btn-secondary" style={{ gap:'7px' }}>
                <Download size={15}/> Download PDF
              </button>
              {!isDoctor && (
                <Link to={`/doctors?specialization=${SPECIALIST[prediction.diseaseType]}`} className="btn btn-primary">
                  Book {SPECIALIST[prediction.diseaseType]} <ArrowRight size={15}/>
                </Link>
              )}
              {isDoctor && (
                <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-primary">← Dashboard</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ─────────────────────────────── */}
        <div style={{ display:'flex', gap:'4px', background:'var(--bg-raised)', padding:'4px', borderRadius:'14px', marginBottom:'24px', width:'fit-content', flexWrap:'wrap' }}>
          {[['overview','📊 Overview'],['parameters','🧪 Parameters'],['recommendations','💡 Advice']].map(([t,l]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>{l}</button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="animate-fadeInUp">

            {/* Gauge + Risk side by side */}
            <div className="grid-2" style={{ marginBottom:'24px' }}>

              {/* Radial gauge */}
              <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', padding:'32px 24px' }}>
                <p style={{ fontSize:'12px', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>Prediction Confidence</p>
                <RadialGauge probability={prediction.result?.probability} color={rCfg.color}/>
                {/* Horizontal bar */}
                <div style={{ width:'100%', maxWidth:'200px' }}>
                  <div style={{ height:'10px', borderRadius:'10px', background:'var(--bg-raised)', overflow:'hidden', border:'1px solid var(--border-subtle)' }}>
                    <div style={{ height:'100%', width:`${prediction.result?.probability}%`, background:`linear-gradient(90deg,${rCfg.color}80,${rCfg.color})`, borderRadius:'10px', transition:'width 1.4s ease', boxShadow:`0 0 8px ${rCfg.color}40` }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                    <span style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:600 }}>0%</span>
                    <span style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:600 }}>100%</span>
                  </div>
                </div>
              </div>

              {/* Risk level card */}
              <div className="card" style={{ background:`linear-gradient(145deg,${rCfg.bg},var(--bg-surface))`, border:`2px solid ${rCfg.border}`, padding:'32px 24px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
                <div style={{ fontSize:'56px', marginBottom:'12px', lineHeight:1 }}>{rCfg.icon}</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'26px', fontWeight:900, color:rCfg.color, marginBottom:'10px', letterSpacing:'-0.3px' }}>{rCfg.label}</div>
                <p style={{ fontSize:'13px', color:'var(--text-secondary)', lineHeight:1.65, fontWeight:500, maxWidth:'280px' }}>{rCfg.msg}</p>
                <div style={{ marginTop:'16px', padding:'6px 18px', borderRadius:'20px', background:rCfg.bg, border:`1.5px solid ${rCfg.border}`, fontSize:'12px', fontWeight:800, color:rCfg.color }}>
                  {prediction.result?.prediction === 'Positive' ? '⚠️ Disease Detected' : '✅ No Disease Detected'}
                </div>
              </div>
            </div>

            {/* Visualisation bars for key params */}
            {vizKeys.length > 0 && (
              <div className="card" style={{ marginBottom:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1px solid var(--border-subtle)' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'11px', background:`${dColor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>
                    <BarChart2 size={18} color={dColor}/>
                  </div>
                  <div>
                    <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'16px', fontWeight:900, color:'var(--text-primary)', marginBottom:'2px' }}>Key Parameter Visualisation</h3>
                    <p style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:500 }}>Input values relative to their maximum clinical range</p>
                  </div>
                </div>
                <div className="grid-2" style={{ gap:'8px' }}>
                  {vizKeys.map(k => {
                    const m = PARAM_META[k];
                    return <ParamBar key={k} label={m.label} value={params[k]} max={m.max} unit={m.unit} color={dColor}/>;
                  })}
                </div>
              </div>
            )}

            {/* Disease-specific indicator strip */}
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'24px' }}>
              {[
                { label:'Model Used', val:{Heart:'Random Forest',Liver:'XGBoost',Parkinson:'SVM'}[prediction.diseaseType], icon:'🤖' },
                { label:'Parameters Analysed', val:`${paramKeys.length} inputs`, icon:'🧬' },
                { label:'Specialist Recommended', val:SPECIALIST[prediction.diseaseType], icon:'👨‍⚕️' },
                { label:'Prediction Engine', val:'HealthGuard ML v2', icon:'⚡' },
              ].map((s,i) => (
                <div key={i} style={{ flex:'1 1 160px', padding:'14px 16px', borderRadius:'14px', background:'var(--bg-raised)', border:'1.5px solid var(--border-subtle)' }}>
                  <div style={{ fontSize:'18px', marginBottom:'6px' }}>{s.icon}</div>
                  <div style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'3px' }}>{s.label}</div>
                  <div style={{ fontSize:'14px', fontWeight:800, color:'var(--text-primary)' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Patient info strip */}
            <div className="card" style={{ marginBottom:'24px' }}>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'15px', fontWeight:800, color:'var(--text-primary)', marginBottom:'16px' }}>🧑‍⚕️ Patient Information</h3>
              <div className="grid-4">
                {[
                  { label:'Patient Name', val:prediction.patientName },
                  { label:'Disease Type', val:`${prediction.diseaseType} Disease` },
                  { label:'Report ID',    val:prediction.reportId },
                  { label:'Generated',   val:new Date(prediction.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) },
                ].map((item,i) => (
                  <div key={i} style={{ padding:'14px', background:'var(--bg-raised)', borderRadius:'12px', border:'1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>{item.label}</div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'var(--text-primary)', wordBreak:'break-all' }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══ PARAMETERS TAB ════════════════════════════════ */}
        {activeTab === 'parameters' && (
          <div className="animate-fadeInUp">
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1px solid var(--border-subtle)' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'11px', background:`${dColor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🧪</div>
                <div>
                  <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'16px', fontWeight:900, color:'var(--text-primary)', marginBottom:'2px' }}>All Input Parameters</h3>
                  <p style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:500 }}>{paramKeys.length} clinical values submitted to the {prediction.diseaseType} ML model</p>
                </div>
              </div>
              <div className="grid-3" style={{ gap:'10px' }}>
                {paramKeys.map(k => (
                  <div key={k} style={{ padding:'13px 14px', background:'var(--bg-raised)', borderRadius:'12px', border:`1px solid ${dColor}20`, transition:'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor=dColor; e.currentTarget.style.background=`${dColor}08`; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor=`${dColor}20`; e.currentTarget.style.background='var(--bg-raised)'; }}>
                    <div style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>{k}</div>
                    <div style={{ fontFamily:'DM Mono,monospace', fontSize:'16px', fontWeight:800, color:dColor }}>{params[k]}</div>
                    {PARAM_META[k] && <div style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:600, marginTop:'3px' }}>{PARAM_META[k].unit || 'score'}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ RECOMMENDATIONS TAB ═══════════════════════════ */}
        {activeTab === 'recommendations' && (
          <div className="animate-fadeInUp">
            <div className="card" style={{ marginBottom:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1px solid var(--border-subtle)' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'11px', background:'rgba(132,204,22,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>💡</div>
                <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'16px', fontWeight:900, color:'var(--text-primary)' }}>Medical Recommendations</h3>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {prediction.recommendations?.map((rec, i) => (
                  <div key={i} style={{ display:'flex', gap:'13px', alignItems:'flex-start', padding:'13px 15px', background:'var(--bg-raised)', borderRadius:'12px', border:'1.5px solid var(--border-subtle)', transition:'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.background='rgba(132,204,22,0.06)'; e.currentTarget.style.borderColor='rgba(132,204,22,0.28)'; e.currentTarget.style.transform='translateX(4px)'; }}
                    onMouseOut={e => { e.currentTarget.style.background='var(--bg-raised)'; e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.transform=''; }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(132,204,22,0.10)', border:'1.5px solid rgba(132,204,22,0.28)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:800, color:'#84CC16', flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontSize:'13px', color:'var(--text-secondary)', lineHeight:1.65, fontWeight:500 }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ display:'flex', gap:'14px', alignItems:'flex-start', padding:'16px 20px', borderRadius:'14px', background:'rgba(217,119,6,0.07)', border:'1.5px solid rgba(217,119,6,0.25)', marginBottom:'20px' }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink:0, marginTop:'2px' }}/>
              <p style={{ fontSize:'13px', color:'#d97706', fontWeight:600, lineHeight:1.65, margin:0 }}>
                <strong>Medical Disclaimer:</strong> This AI prediction is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Please consult a qualified healthcare professional for proper evaluation.
              </p>
            </div>

            {/* Book doctor CTA */}
            {!isDoctor && isPos && (
              <div className="card" style={{ background:`linear-gradient(135deg,${dColor}10,var(--bg-surface))`, border:`1.5px solid ${dColor}30`, textAlign:'center', padding:'32px' }}>
                <div style={{ fontSize:'44px', marginBottom:'12px' }}>🏥</div>
                <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:'20px', fontWeight:900, color:'var(--text-primary)', marginBottom:'10px' }}>
                  Consult a {SPECIALIST[prediction.diseaseType]}
                </h3>
                <p style={{ color:'var(--text-muted)', fontSize:'13px', marginBottom:'22px', lineHeight:1.65, fontWeight:500, maxWidth:'360px', margin:'0 auto 22px' }}>
                  Based on your prediction results, we recommend booking an appointment with a specialist.
                </p>
                <Link to={`/doctors?specialization=${SPECIALIST[prediction.diseaseType]}&predictionId=${id}`} className="btn btn-primary btn-lg">
                  Find {SPECIALIST[prediction.diseaseType]}s Near You <ArrowRight size={17}/>
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
