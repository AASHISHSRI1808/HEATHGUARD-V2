import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Activity, FlaskConical } from 'lucide-react';

const DISEASES = {
  Heart: {
    icon:'❤️', color:'#e11d48', model:'Random Forest', accent:'rgba(225,29,72,0.08)', border:'rgba(225,29,72,0.22)',
    description:'Cardiovascular risk prediction using 13 clinical parameters including ECG, BP, and cholesterol levels.',
    fields:[
      { key:'age',       label:'Age',                             type:'number', placeholder:'50',       unit:'years' },
      { key:'sex',       label:'Sex',                             type:'select', options:[{val:1,label:'Male'},{val:0,label:'Female'}] },
      { key:'cp',        label:'Chest Pain Type',                 type:'select', options:[{val:0,label:'0 — Typical Angina'},{val:1,label:'1 — Atypical Angina'},{val:2,label:'2 — Non-Anginal'},{val:3,label:'3 — Asymptomatic'}] },
      { key:'trestbps',  label:'Resting Blood Pressure',          type:'number', placeholder:'120',      unit:'mmHg' },
      { key:'chol',      label:'Serum Cholesterol',               type:'number', placeholder:'200',      unit:'mg/dL' },
      { key:'fbs',       label:'Fasting Blood Sugar >120 mg/dL',  type:'select', options:[{val:1,label:'Yes'},{val:0,label:'No'}] },
      { key:'restecg',   label:'Resting ECG Results',             type:'select', options:[{val:0,label:'0 — Normal'},{val:1,label:'1 — ST-T Abnormality'},{val:2,label:'2 — LV Hypertrophy'}] },
      { key:'thalach',   label:'Maximum Heart Rate Achieved',     type:'number', placeholder:'150',      unit:'bpm' },
      { key:'exang',     label:'Exercise Induced Angina',         type:'select', options:[{val:1,label:'Yes'},{val:0,label:'No'}] },
      { key:'oldpeak',   label:'ST Depression (Oldpeak)',         type:'number', placeholder:'1.0',      unit:'mm',   step:'0.1' },
      { key:'slope',     label:'Slope of ST Segment',             type:'select', options:[{val:0,label:'0 — Upsloping'},{val:1,label:'1 — Flat'},{val:2,label:'2 — Downsloping'}] },
      { key:'ca',        label:'Major Vessels (Fluoroscopy)',     type:'select', options:[0,1,2,3].map(v=>({val:v,label:String(v)})) },
      { key:'thal',      label:'Thalassemia Type',                type:'select', options:[{val:0,label:'0 — Normal'},{val:1,label:'1 — Fixed Defect'},{val:2,label:'2 — Reversible Defect'}] },
    ],
  },
  Liver: {
    icon:'🫀', color:'#d97706', model:'XGBoost', accent:'rgba(217,119,6,0.08)', border:'rgba(217,119,6,0.22)',
    description:'Liver disease detection through 10 hepatic function biomarkers from your blood test panel.',
    fields:[
      { key:'Age',                         label:'Age',                       type:'number', placeholder:'45',   unit:'years' },
      { key:'Gender',                      label:'Gender',                    type:'select', options:[{val:1,label:'Male'},{val:0,label:'Female'}] },
      { key:'Total_Bilirubin',             label:'Total Bilirubin',           type:'number', placeholder:'0.7',  unit:'mg/dL',  step:'0.1' },
      { key:'Direct_Bilirubin',            label:'Direct Bilirubin',          type:'number', placeholder:'0.2',  unit:'mg/dL',  step:'0.1' },
      { key:'Alkaline_Phosphotase',        label:'Alkaline Phosphatase (ALP)',type:'number', placeholder:'187',  unit:'IU/L' },
      { key:'Alamine_Aminotransferase',    label:'ALT / SGPT',                type:'number', placeholder:'16',   unit:'IU/L' },
      { key:'Aspartate_Aminotransferase',  label:'AST / SGOT',                type:'number', placeholder:'18',   unit:'IU/L' },
      { key:'Total_Protiens',              label:'Total Proteins',            type:'number', placeholder:'6.8',  unit:'g/dL',   step:'0.1' },
      { key:'Albumin',                     label:'Albumin',                   type:'number', placeholder:'3.3',  unit:'g/dL',   step:'0.1' },
      { key:'Albumin_and_Globulin_Ratio',  label:'Albumin / Globulin Ratio',  type:'number', placeholder:'0.9',  unit:'ratio',  step:'0.1' },
    ],
  },
  Parkinson: {
    icon:'🧠', color:'#7c3aed', model:'SVM', accent:'rgba(124,58,237,0.08)', border:'rgba(124,58,237,0.22)',
    description:"Early Parkinson's detection via 22 vocal biomarker measurements from voice recording analysis.",
    fields:[
      { key:'MDVP:Fo(Hz)',     label:'Avg Vocal Frequency (Fo)',   type:'number', placeholder:'119.992',   step:'0.001',   unit:'Hz' },
      { key:'MDVP:Fhi(Hz)',    label:'Max Vocal Frequency (Fhi)',  type:'number', placeholder:'157.302',   step:'0.001',   unit:'Hz' },
      { key:'MDVP:Flo(Hz)',    label:'Min Vocal Frequency (Flo)',  type:'number', placeholder:'74.997',    step:'0.001',   unit:'Hz' },
      { key:'MDVP:Jitter(%)',  label:'Jitter %',                   type:'number', placeholder:'0.00784',   step:'0.00001' },
      { key:'MDVP:Jitter(Abs)',label:'Absolute Jitter',            type:'number', placeholder:'0.00007',   step:'0.00001' },
      { key:'MDVP:RAP',        label:'RAP',                        type:'number', placeholder:'0.0037',    step:'0.0001' },
      { key:'MDVP:PPQ',        label:'PPQ',                        type:'number', placeholder:'0.00554',   step:'0.0001' },
      { key:'Jitter:DDP',      label:'DDP',                        type:'number', placeholder:'0.01109',   step:'0.0001' },
      { key:'MDVP:Shimmer',    label:'Shimmer',                    type:'number', placeholder:'0.04374',   step:'0.0001' },
      { key:'MDVP:Shimmer(dB)',label:'Shimmer (dB)',               type:'number', placeholder:'0.426',     step:'0.001' },
      { key:'Shimmer:APQ3',    label:'APQ3',                       type:'number', placeholder:'0.02182',   step:'0.0001' },
      { key:'Shimmer:APQ5',    label:'APQ5',                       type:'number', placeholder:'0.0313',    step:'0.0001' },
      { key:'MDVP:APQ',        label:'APQ',                        type:'number', placeholder:'0.02971',   step:'0.0001' },
      { key:'Shimmer:DDA',     label:'DDA',                        type:'number', placeholder:'0.06545',   step:'0.0001' },
      { key:'NHR',             label:'Noise-to-Harmonic Ratio',    type:'number', placeholder:'0.02211',   step:'0.0001' },
      { key:'HNR',             label:'Harmonic-to-Noise Ratio',    type:'number', placeholder:'21.033',    step:'0.001' },
      { key:'RPDE',            label:'RPDE',                       type:'number', placeholder:'0.414783',  step:'0.000001' },
      { key:'DFA',             label:'DFA',                        type:'number', placeholder:'0.815285',  step:'0.000001' },
      { key:'spread1',         label:'Spread 1',                   type:'number', placeholder:'-4.813031', step:'0.000001' },
      { key:'spread2',         label:'Spread 2',                   type:'number', placeholder:'0.266482',  step:'0.000001' },
      { key:'D2',              label:'D2',                         type:'number', placeholder:'2.301442',  step:'0.000001' },
      { key:'PPE',             label:'Pitch Period Entropy (PPE)', type:'number', placeholder:'0.284654',  step:'0.000001' },
    ],
  },
};

export default function PredictionPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [formData, setFormData]     = useState({});
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading]       = useState(false);
  const navigate = useNavigate();

  const handleDiseaseSelect = (d) => { setSelectedDisease(d); setFormData({}); };
  const handleChange = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const d        = selectedDisease ? DISEASES[selectedDisease] : null;
  const filled   = d ? d.fields.filter(f => formData[f.key] !== undefined && formData[f.key] !== '').length : 0;
  const progress = d ? Math.round((filled / d.fields.length) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDoctor && !patientName.trim()) { toast.error('Please enter the patient name'); return; }
    setLoading(true);
    try {
      const processed = {};
      DISEASES[selectedDisease].fields.forEach(f => { processed[f.key] = parseFloat(formData[f.key] || 0); });
      const payload = { diseaseType: selectedDisease, inputParameters: processed };
      if (isDoctor) payload.patientName = patientName.trim();
      const res = await api.post('/predictions', payload);
      toast.success('Prediction complete! Generating report…');
      navigate(`/prediction-result/${res.data.prediction._id}`);
    } catch(err) {
      toast.error(err.response?.data?.message || 'Prediction failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container" style={{ background:'var(--bg-base)' }}>
      <Navbar/>
      <div className="content-wrapper" style={{ maxWidth:'980px' }}>

        {/* ── Page header ──────────────────────────────────── */}
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'9px', padding:'7px 18px', borderRadius:'30px', background:'rgba(30,58,138,0.10)', border:'1.5px solid rgba(30,58,138,0.25)', marginBottom:'14px' }}>
            <FlaskConical size={14} color="var(--accent)"/>
            <span style={{ fontSize:'11px', fontWeight:800, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'1.2px' }}>
              {isDoctor ? 'Clinical ML Prediction Tool' : 'AI Disease Prediction'}
            </span>
          </div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(22px,4vw,34px)', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.5px', marginBottom:'10px' }}>
            {isDoctor ? 'Run Patient ML Prediction' : 'Clinical Disease Prediction'}
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:'14px', maxWidth:'520px', margin:'0 auto', fontWeight:500, lineHeight:1.7 }}>
            Enter clinical laboratory values to receive an instant ML-powered disease risk assessment with a downloadable PDF report.
          </p>
        </div>

        {/* ── Doctor patient info ──────────────────────────── */}
        {isDoctor && (
          <div className="card" style={{ marginBottom:'24px', borderLeft:'4px solid var(--accent)', borderColor:'rgba(30,58,138,0.25)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'13px', marginBottom:'14px' }}>
              <div style={{ width:'40px', height:'40px', background:'rgba(30,58,138,0.1)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>👤</div>
              <div>
                <h3 style={{ fontFamily:'Outfit', fontSize:'15px', fontWeight:800, color:'var(--text-primary)', marginBottom:'2px' }}>Patient Information</h3>
                <p style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:500 }}>Required before running any prediction</p>
              </div>
            </div>
            <input type="text" className="form-input" placeholder="Patient full name (e.g. Ramesh Kumar Sharma)"
              value={patientName} onChange={e=>setPatientName(e.target.value)} required style={{ fontWeight:600 }}/>
          </div>
        )}

        {/* ── Disease selector ────────────────────────────── */}
        {!selectedDisease && (
          <div>
            <p style={{ color:'var(--text-secondary)', marginBottom:'20px', fontSize:'14px', fontWeight:600, textAlign:'center' }}>
              Choose disease type to analyse:
            </p>
            <div className="grid-3" style={{ gap:'20px' }}>
              {Object.entries(DISEASES).map(([key, dis]) => (
                <button key={key} onClick={() => handleDiseaseSelect(key)}
                  style={{ background:'var(--bg-surface)', border:`2px solid ${dis.border}`, borderRadius:'22px', padding:'30px 24px', cursor:'pointer', textAlign:'left', transition:'all 0.25s', width:'100%', boxShadow:'var(--shadow-sm)' }}
                  onMouseOver={e=>{ e.currentTarget.style.borderColor=dis.color; e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow=`0 16px 44px ${dis.accent}`; }}
                  onMouseOut={e=>{ e.currentTarget.style.borderColor=dis.border; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}>
                  <div style={{ width:'66px', height:'66px', background:dis.accent, borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'34px', marginBottom:'18px', border:`1.5px solid ${dis.border}` }}>{dis.icon}</div>
                  <h3 style={{ fontFamily:'Outfit', fontSize:'19px', fontWeight:900, color:'var(--text-primary)', marginBottom:'6px', letterSpacing:'-0.2px' }}>{key} Disease</h3>
                  <span style={{ display:'inline-block', background:dis.accent, color:dis.color, padding:'3px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:800, marginBottom:'12px', border:`1px solid ${dis.border}` }}>{dis.model}</span>
                  <p style={{ color:'var(--text-muted)', fontSize:'13px', lineHeight:1.65, fontWeight:500, marginBottom:'16px' }}>{dis.description}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', paddingTop:'12px', borderTop:'1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:600 }}>🧬 {dis.fields.length} parameters</span>
                    <span style={{ marginLeft:'auto', color:dis.color, fontSize:'13px', fontWeight:800, display:'flex', alignItems:'center', gap:'4px' }}>Start <ChevronRight size={14}/></span>
                  </div>
                </button>
              ))}
            </div>

            {/* Tip box */}
            <div style={{ marginTop:'28px', padding:'16px 20px', borderRadius:'14px', background:'rgba(30,58,138,0.06)', border:'1.5px solid rgba(30,58,138,0.18)', display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'18px', flexShrink:0 }}>💡</span>
              <p style={{ fontSize:'13px', color:'var(--text-secondary)', fontWeight:500, lineHeight:1.6, margin:0 }}>
                <strong>Tip:</strong> Use the <strong>Disease Risk Analysis</strong> flow (🩺 AI Diagnosis) first to get your recommended tests, then come back here to enter your lab values for a precise ML prediction.
              </p>
            </div>
          </div>
        )}

        {/* ── Data entry form ─────────────────────────────── */}
        {selectedDisease && d && (
          <div>
            {/* Disease context bar */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px', padding:'18px 22px', background:`${d.color}08`, border:`1.5px solid ${d.border}`, borderRadius:'18px', flexWrap:'wrap' }}>
              <div style={{ width:'54px', height:'54px', background:d.accent, borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', border:`1.5px solid ${d.border}`, flexShrink:0 }}>{d.icon}</div>
              <div style={{ flex:1 }}>
                <h2 style={{ fontFamily:'Outfit', fontSize:'20px', fontWeight:900, color:'var(--text-primary)', marginBottom:'3px' }}>{selectedDisease} Disease Analysis</h2>
                <p style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:600 }}>
                  Model: <span style={{ color:d.color, fontWeight:800 }}>{d.model}</span> &nbsp;·&nbsp; {d.fields.length} parameters required
                  {isDoctor && patientName && <span style={{ color:'var(--accent)', marginLeft:'10px' }}>· Patient: {patientName}</span>}
                </p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px', flexShrink:0 }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:'var(--text-muted)' }}>{filled}/{d.fields.length} filled</span>
                <div style={{ width:'120px', height:'8px', borderRadius:'10px', background:'var(--bg-raised)', overflow:'hidden', border:'1px solid var(--border-subtle)' }}>
                  <div style={{ height:'100%', width:`${progress}%`, borderRadius:'10px', background:`linear-gradient(90deg,${d.color}80,${d.color})`, transition:'width 0.3s ease' }}/>
                </div>
              </div>
              <button onClick={()=>setSelectedDisease(null)} className="btn btn-secondary btn-sm" style={{ flexShrink:0 }}>← Change</button>
            </div>

            {/* Info */}
            <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'13px 16px', borderRadius:'12px', background:'rgba(30,58,138,0.06)', border:'1.5px solid rgba(30,58,138,0.18)', marginBottom:'22px' }}>
              <span style={{ fontSize:'16px', flexShrink:0 }}>ℹ️</span>
              <p style={{ fontSize:'13px', color:'var(--text-secondary)', fontWeight:500, lineHeight:1.6, margin:0 }}>
                Enter accurate clinical values for best prediction accuracy. All fields are required. Placeholder values show example reference ranges.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card" style={{ marginBottom:'20px', borderTop:`3px solid ${d.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1px solid var(--border-subtle)' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:d.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>{d.icon}</div>
                  <div>
                    <h3 style={{ fontFamily:'Outfit', fontSize:'15px', fontWeight:800, color:'var(--text-primary)', marginBottom:'1px' }}>Clinical Parameters</h3>
                    <p style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:500 }}>All values from your lab report</p>
                  </div>
                </div>
                <div className="grid-2" style={{ gap:'16px' }}>
                  {d.fields.map(field => (
                    <div className="form-group" key={field.key} style={{ marginBottom:'4px' }}>
                      <label className="form-label" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span>{field.label}</span>
                        {field.unit && <span style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight:600, textTransform:'none', letterSpacing:0, background:'var(--bg-raised)', padding:'2px 7px', borderRadius:'6px' }}>{field.unit}</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select className="form-input" value={formData[field.key]??''} required
                          onChange={e=>handleChange(field.key, e.target.value)} style={{ fontWeight:600 }}>
                          <option value="">Select…</option>
                          {field.options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input type="number" className="form-input form-input-number"
                          placeholder={field.placeholder} required
                          step={field.step||'1'}
                          value={formData[field.key]??''}
                          onChange={e=>handleChange(field.key, e.target.value)}
                          style={{ fontWeight:600 }}/>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                <button type="submit" disabled={loading}
                  style={{ flex:1, minWidth:'200px', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'9px', padding:'14px 28px', borderRadius:'13px', border:'none', fontFamily:'Outfit', fontSize:'15px', fontWeight:800, color:'white', background:`linear-gradient(135deg,${d.color},${d.color}bb)`, boxShadow:`0 6px 20px ${d.accent}`, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, transition:'all 0.2s' }}>
                  {loading ? (
                    <><div className="loading-spinner" style={{ width:'18px', height:'18px', borderWidth:'2px' }}/> Analysing…</>
                  ) : (
                    <>🔬 Run {d.model} Prediction</>
                  )}
                </button>
                <button type="button" onClick={()=>setSelectedDisease(null)} className="btn btn-secondary btn-lg">Cancel</button>
              </div>
            </form>

            {loading && (
              <div style={{ textAlign:'center', padding:'40px', marginTop:'20px', background:'var(--bg-surface)', border:`1.5px solid ${d.border}`, borderRadius:'20px', boxShadow:'var(--shadow-md)' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'50%', border:`3px solid ${d.accent}`, borderTopColor:d.color, animation:'spin 0.9s linear infinite', margin:'0 auto 18px' }}/>
                <h3 style={{ fontFamily:'Outfit', fontSize:'18px', fontWeight:800, color:'var(--text-primary)', marginBottom:'8px' }}>{d.model} Model Processing…</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'13px', fontWeight:500 }}>Running {selectedDisease} disease analysis on your clinical data</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
