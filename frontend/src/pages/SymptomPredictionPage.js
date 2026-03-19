import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Upload, CheckCircle, ChevronRight, Activity, Brain, Zap, X, TrendingUp, AlertCircle, FileSearch, Stethoscope } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & DISEASE DATA
═══════════════════════════════════════════════════════════ */
const ALL_SYMPTOMS_FLAT = [
  { sym:'Chest pain or tightness',              cat:'Heart'     },
  { sym:'Shortness of breath',                  cat:'Heart'     },
  { sym:'Irregular heartbeat (palpitations)',   cat:'Heart'     },
  { sym:'Dizziness or lightheadedness',         cat:'Heart'     },
  { sym:'Fatigue on exertion',                  cat:'Heart'     },
  { sym:'Swollen ankles or feet',               cat:'Heart'     },
  { sym:'Pain radiating to arm or jaw',         cat:'Heart'     },
  { sym:'Excessive sweating without cause',     cat:'Heart'     },
  { sym:'Yellowing of skin or eyes (jaundice)', cat:'Liver'     },
  { sym:'Pain in upper-right abdomen',          cat:'Liver'     },
  { sym:'Chronic fatigue',                      cat:'Liver'     },
  { sym:'Nausea or vomiting',                   cat:'Liver'     },
  { sym:'Dark urine or pale stools',            cat:'Liver'     },
  { sym:'Loss of appetite',                     cat:'Liver'     },
  { sym:'Abdominal swelling (ascites)',         cat:'Liver'     },
  { sym:'Easy bruising or bleeding',            cat:'Liver'     },
  { sym:'Resting tremor (hand/finger shaking)', cat:'Parkinson' },
  { sym:'Muscle stiffness or rigidity',         cat:'Parkinson' },
  { sym:'Slowed movements (bradykinesia)',      cat:'Parkinson' },
  { sym:'Balance or coordination problems',    cat:'Parkinson' },
  { sym:'Micrographia (small handwriting)',    cat:'Parkinson' },
  { sym:'Soft or slurred speech',              cat:'Parkinson' },
  { sym:'Loss of smell',                       cat:'Parkinson' },
  { sym:'Facial masking (reduced expressions)',cat:'Parkinson' },
];

const DISEASE_TESTS = {
  Heart: {
    icon:'❤️', color:'#e11d48',
    gradient:'linear-gradient(135deg,#e11d48,#be123c)',
    glow:'rgba(225,29,72,0.22)', bg:'rgba(225,29,72,0.07)', border:'rgba(225,29,72,0.22)',
    tests:[
      { name:'Blood Pressure Measurement',          icon:'🩺', param:'trestbps', why:'Resting BP is a direct ML model input' },
      { name:'Fasting Serum Cholesterol (LDL/HDL)', icon:'🧪', param:'chol',     why:'Total cholesterol is a key Random Forest feature' },
      { name:'Fasting Blood Glucose Test',          icon:'🩸', param:'fbs',      why:'Fasting blood sugar >120 mg/dL is an ML binary feature' },
      { name:'Resting ECG / Electrocardiogram',    icon:'📈', param:'restecg',  why:'Resting ECG result is directly fed into the model' },
      { name:'Maximum Heart Rate Stress Test',     icon:'🏃', param:'thalach',  why:'Max achieved HR is the strongest heart predictor' },
      { name:'Exercise-Induced Angina Check',      icon:'💓', param:'exang',    why:'Angina on exercise is a binary ML feature' },
      { name:'ST Depression / Oldpeak (ECG)',      icon:'📉', param:'oldpeak',  why:'ST depression is a critical model input' },
      { name:'Coronary Angiography (CA vessels)',  icon:'🔬', param:'ca',       why:'No. of major vessels coloured by fluoroscopy' },
    ],
  },
  Liver: {
    icon:'🫀', color:'#d97706',
    gradient:'linear-gradient(135deg,#d97706,#b45309)',
    glow:'rgba(217,119,6,0.22)', bg:'rgba(217,119,6,0.07)', border:'rgba(217,119,6,0.22)',
    tests:[
      { name:'Total Bilirubin Test',               icon:'🧪', param:'Total_Bilirubin',             why:'Primary XGBoost liver model feature' },
      { name:'Direct Bilirubin Test',              icon:'🧫', param:'Direct_Bilirubin',            why:'Direct (conjugated) bilirubin — separate ML input' },
      { name:'Alkaline Phosphatase (ALP)',          icon:'⚗️', param:'Alkaline_Phosphotase',       why:'ALP enzyme level used directly in liver ML model' },
      { name:'SGPT / ALT (Liver Enzyme)',           icon:'🔬', param:'Alamine_Aminotransferase',   why:'Alanine aminotransferase — core XGBoost feature' },
      { name:'SGOT / AST (Liver Enzyme)',           icon:'🧬', param:'Aspartate_Aminotransferase', why:'Aspartate aminotransferase — required ML input' },
      { name:'Total Protein Test',                 icon:'🩺', param:'Total_Protiens',             why:'Assesses liver synthetic function (ML feature)' },
      { name:'Serum Albumin Level',                icon:'💊', param:'Albumin',                    why:'Albumin is a direct feature in liver ML model' },
      { name:'Albumin / Globulin Ratio',           icon:'📊', param:'Albumin_and_Globulin_Ratio', why:'A/G ratio — 10th and final liver model feature' },
    ],
  },
  Parkinson: {
    icon:'🧠', color:'#7c3aed',
    gradient:'linear-gradient(135deg,#7c3aed,#6d28d9)',
    glow:'rgba(124,58,237,0.22)', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.22)',
    tests:[
      { name:'Voice/Speech Recording Analysis', icon:'🎙️', param:'MDVP:Fo(Hz)',    why:'Average vocal fundamental frequency — primary SVM feature' },
      { name:'Maximum Vocal Pitch (Fhi)',        icon:'📢', param:'MDVP:Fhi(Hz)',   why:'Max vocal frequency — required model biomarker' },
      { name:'Minimum Vocal Pitch (Flo)',        icon:'🔉', param:'MDVP:Flo(Hz)',   why:'Min vocal frequency — indicates vocal control ability' },
      { name:'Jitter Analysis (Voice Variation)',icon:'📈', param:'MDVP:Jitter(%)',why:'Voice jitter % — core SVM feature' },
      { name:'Shimmer Analysis (Amplitude)',     icon:'〰️', param:'MDVP:Shimmer', why:'Shimmer measures amplitude variation — key Parkinson indicator' },
      { name:'Harmonic-to-Noise Ratio (HNR)',    icon:'🎵', param:'HNR',           why:'Voice clarity vs noise — degraded in PD patients' },
      { name:'Noise-to-Harmonic Ratio (NHR)',    icon:'🔊', param:'NHR',           why:'NHR inverse measure — required SVM model input' },
      { name:'Pitch Period Entropy (PPE)',        icon:'🌀', param:'PPE',           why:'Measures impaired pitch control — strongest Parkinson predictor' },
    ],
  },
};

const RISK_COLOR  = { Low:'#84CC16', Moderate:'#f59e0b', High:'#ef4444', 'Very High':'#dc2626' };
const RISK_BG     = { Low:'rgba(132,204,22,0.10)', Moderate:'rgba(245,158,11,0.10)', High:'rgba(239,68,68,0.10)', 'Very High':'rgba(220,38,38,0.14)' };
const RISK_BORDER = { Low:'rgba(132,204,22,0.30)', Moderate:'rgba(245,158,11,0.30)', High:'rgba(239,68,68,0.30)', 'Very High':'rgba(220,38,38,0.35)' };
const URGENCY_META = {
  routine:{ label:'Routine Follow-up',   icon:'✅', color:'#84CC16', bg:'rgba(132,204,22,0.10)' },
  soon:   { label:'Consult Doctor Soon', icon:'⚠️', color:'#f59e0b', bg:'rgba(245,158,11,0.10)' },
  urgent: { label:'Immediate Attention', icon:'🚨', color:'#ef4444', bg:'rgba(239,68,68,0.10)'  },
};
const STATUS_STYLE = {
  normal:             { bar:'#84CC16', bg:'rgba(132,204,22,0.12)', text:'#3B6D11',  label:'Normal'      },
  borderline:         { bar:'#f59e0b', bg:'rgba(245,158,11,0.12)', text:'#92400e',  label:'Borderline'  },
  high:               { bar:'#ef4444', bg:'rgba(239,68,68,0.12)',  text:'#991b1b',  label:'High'        },
  low:                { bar:'#3b82f6', bg:'rgba(59,130,246,0.12)', text:'#1e40af',  label:'Low'         },
  abnormal:           { bar:'#ef4444', bg:'rgba(239,68,68,0.12)',  text:'#991b1b',  label:'Abnormal'    },
  critical:           { bar:'#dc2626', bg:'rgba(220,38,38,0.15)',  text:'#7f1d1d',  label:'Critical'    },
  detected:           { bar:'#1E3A8A', bg:'rgba(30,58,138,0.10)', text:'#1e3a8a',  label:'Detected'    },
  'not available':    { bar:'var(--border)', bg:'var(--bg-raised)', text:'var(--text-faint)', label:'N/A' },
  'insufficient data':{ bar:'var(--border)', bg:'var(--bg-raised)', text:'var(--text-faint)', label:'N/A' },
};

/* ═══════════════════════════════════════════════════════════
   REPORT PARSER — structured text → JS object
═══════════════════════════════════════════════════════════ */
function parseReport(text) {
  // Escape special regex characters in label strings (handles parentheses, slashes, etc.)
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Helper to extract single-line value — works for any label including ones with parens
  const get = (label) => {
    const re = new RegExp(`^-?\\s*${esc(label)}[:\\s]+(.+)$`, 'im');
    const m  = text.match(re);
    return m ? m[1].trim() : null;
  };

  // Check for invalid
  const cls = get('CLASSIFICATION') || '';
  if (cls.toUpperCase().includes('INVALID') || text.includes('STOP_HERE')) {
    // Extract confidence specifically from the INVALID block
    const invConfMatch = text.match(/CLASSIFICATION[:\s]+INVALID[\s\S]*?CONFIDENCE[:\s]+(\d+)/i);
    return {
      invalid:   true,
      confidence: invConfMatch ? parseInt(invConfMatch[1]) : 70,
      reason:    get('REASON')    || 'This file does not appear to be a valid medical report.',
      whatToDo:  get('WHAT TO DO')|| 'Please upload a proper lab report, blood test, ECG, or clinical diagnostic document.',
    };
  }

  // Extract a disease section between two headings
  const getSection = (startLabel, endLabel) => {
    const idx1 = text.indexOf(startLabel);
    if (idx1 < 0) return '';
    const idx2 = endLabel ? text.indexOf(endLabel, idx1 + startLabel.length) : text.length;
    return idx2 > idx1 ? text.slice(idx1, idx2) : text.slice(idx1);
  };

  // Parse bullet list between two labels within a section
  const getBullets = (section, startLbl, endLbl) => {
    const idx1 = section.indexOf(startLbl);
    if (idx1 < 0) return [];
    const sub  = section.slice(idx1 + startLbl.length);
    const idx2 = endLbl ? sub.indexOf(endLbl) : sub.length;
    const chunk = idx2 > 0 ? sub.slice(0, idx2) : sub;
    return chunk.split('\n').map(l => l.replace(/^[-•*\s]+/,'').trim()).filter(l => l.length > 3);
  };

  const getInSection = (section, label) => {
    const re = new RegExp(`^${esc(label)}[:\\s]+(.+)$`, 'im');
    const m  = section.match(re);
    return m ? m[1].trim() : null;
  };

  const parseDisease = (name) => {
    const NEXT = { HEART:'LIVER', LIVER:'PARKINSON', PARKINSON:'STEP 4' };
    const sec  = getSection(`${name} DISEASE ANALYSIS:`, `${NEXT[name]} DISEASE ANALYSIS:`);
    const riskLevel = getInSection(sec, 'RISK LEVEL')  || 'Low';
    const prob      = parseInt(getInSection(sec, 'PROBABILITY')) || 10;
    const conf      = parseInt(getInSection(sec, 'CONFIDENCE'))  || 20;
    const insight   = getInSection(sec, 'CLINICAL INSIGHT')     || 'Insufficient data for detailed analysis.';
    const indicators= getBullets(sec, 'KEY INDICATORS:', 'MISSING DATA:');
    const missing   = getBullets(sec, 'MISSING DATA:',   'CLINICAL INSIGHT:');
    return { riskLevel, riskIcon: riskLevel==='Low'?'🟢':riskLevel==='Moderate'?'🟡':'🔴', probability:prob, confidence:conf, keyIndicators:indicators, missingData:missing, clinicalInsight:insight };
  };

  // Extract a numeric metric value — label matched safely (handles parens in label names)
  const extractMetric = (label) => {
    const val = get(label);
    if (!val || /^(not available|n\/a|none|-)$/i.test(val.trim())) {
      return { value: null, raw: 'Not Available', status: 'not available' };
    }
    const num = parseFloat(val.replace(/[^\d.-]/g, ''));
    return { value: isNaN(num) ? null : num, raw: val, status: 'detected' };
  };

  // Extract a text-only metric (ECG findings, motor symptoms, etc.)
  const extractTextMetric = (label) => {
    const val = get(label);
    if (!val || /^(not available|n\/a|none|-)$/i.test(val.trim())) {
      return { raw: 'Not Available', status: 'not available' };
    }
    return { raw: val, status: 'detected' };
  };

  // Confidence: grab the one right after "CLASSIFICATION: VALID" to avoid mixing with disease-level confidences
  const classificationConfMatch = text.match(/CLASSIFICATION[:\s]+VALID[\s\S]{0,200}?CONFIDENCE[:\s]+(\d+)/i);
  const reportConfidence = classificationConfMatch ? parseInt(classificationConfMatch[1]) : (parseInt(get('CONFIDENCE')) || 60);

  return {
    invalid:    false,
    reportType: get('REPORT TYPE') || 'Medical Assessment',
    confidence: reportConfidence,
    metrics: {
      heart: {
        cholesterol:   extractMetric('Cholesterol'),
        bloodPressure: extractMetric('Blood Pressure'),
        heartRate:     extractMetric('Heart Rate'),
        glucose:       extractMetric('Fasting Blood Sugar'),
        ecg:           extractTextMetric('ECG Findings'),
        stDepression:  extractMetric('ST Depression (Oldpeak)'),
      },
      liver: {
        bilirubin:  extractMetric('Total Bilirubin'),
        directBili: extractMetric('Direct Bilirubin'),
        alt:        extractMetric('ALT (SGPT)'),   // parens now handled by esc()
        ast:        extractMetric('AST (SGOT)'),   // parens now handled by esc()
        alp:        extractMetric('ALP'),
        albumin:    extractMetric('Albumin'),
        protein:    extractMetric('Total Protein'),
        agRatio:    extractMetric('A/G Ratio'),
      },
      parkinson: {
        jitter:  extractMetric('Voice Jitter'),
        shimmer: extractMetric('Voice Shimmer'),
        hnr:     extractMetric('HNR (Harmonic-to-Noise Ratio)'),
        fo:      extractMetric('Voice Frequency (Fo)'),
        motor:   extractTextMetric('Motor Symptoms Noted'),
      },
    },
    heart:     parseDisease('HEART'),
    liver:     parseDisease('LIVER'),
    parkinson: parseDisease('PARKINSON'),
    overall: {
      risk:           get('OVERALL RISK')    || 'Low',
      icon:           get('OVERALL ICON')    || '🟢',
      primaryConcern: get('PRIMARY CONCERN') || 'No primary concern identified',
      urgency:        (get('URGENCY') || 'routine').toLowerCase().trim(),
      summary:        get('PATIENT SUMMARY') || 'Assessment based on available data.',
    },
    recommendations: [1,2,3,4].map(i => get(`RECOMMENDATION ${i}`)).filter(Boolean),
    nextStep: get('NEXT STEP') || 'Consult a healthcare professional for a complete evaluation.',
  };
}

/* ═══════════════════════════════════════════════════════════
   SYMPTOM-ONLY FALLBACK
═══════════════════════════════════════════════════════════ */
function buildFallback(syms, cats) {
  const hc = syms.filter(s=>s.cat==='Heart').length;
  const lc = syms.filter(s=>s.cat==='Liver').length;
  const pc = syms.filter(s=>s.cat==='Parkinson').length;
  const hp = Math.min(80, 8+hc*13), lp = Math.min(80, 8+lc*13), pp = Math.min(80, 8+pc*13);
  const mx = Math.max(hp,lp,pp);
  const dom = hp>=lp&&hp>=pp?'Heart Disease':lp>=pp?'Liver Disease':"Parkinson's Disease";
  const na = { value:null, raw:'Not Available', status:'not available' };
  const naT= { raw:'Not Available', status:'not available' };
  const makeDisease = (cat, count, prob, symsArr) => ({
    riskLevel: prob>=70?'High':prob>=40?'Moderate':'Low',
    riskIcon:  prob>=70?'🔴':prob>=40?'🟡':'🟢',
    probability: prob, confidence: Math.round(prob*0.5),
    keyIndicators: count>0 ? symsArr.map(s=>s.sym) : [`No ${cat.toLowerCase()} symptoms reported`],
    missingData:   ['No lab report uploaded','Lab values not available — symptom-based estimate only'],
    clinicalInsight:`${count} ${cat.toLowerCase()} symptom(s) reported. Lab confirmation required for definitive assessment.`,
  });
  return {
    invalid:false, reportType:'Symptom-Only Assessment', confidence:Math.min(50,15+syms.length*5),
    metrics:{ heart:{cholesterol:na,bloodPressure:na,heartRate:na,glucose:na,ecg:naT,stDepression:na}, liver:{bilirubin:na,directBili:na,alt:na,ast:na,alp:na,albumin:na,protein:na,agRatio:na}, parkinson:{jitter:na,shimmer:na,hnr:na,fo:na,motor:naT} },
    heart:    makeDisease('Heart',    hc, hp, syms.filter(s=>s.cat==='Heart')),
    liver:    makeDisease('Liver',    lc, lp, syms.filter(s=>s.cat==='Liver')),
    parkinson:makeDisease('Parkinson',pc, pp, syms.filter(s=>s.cat==='Parkinson')),
    overall:{ risk:mx>=70?'High':mx>=45?'Moderate':'Low', icon:mx>=70?'🔴':mx>=45?'🟡':'🟢', primaryConcern:dom, urgency:mx>=70?'soon':'routine', summary:`Symptom-based assessment for ${syms.length} symptom(s) across ${cats.length} category(ies). No lab report was provided — values estimated from symptoms only. Upload lab results for precise analysis.` },
    recommendations:['Upload your latest lab reports (blood test, LFT, ECG) for AI-powered document analysis.', cats.includes('Heart')?'Schedule a lipid profile, ECG, and blood pressure check with a cardiologist.':'Maintain regular cardiovascular screenings annually.', cats.includes('Liver')?'Get a full Liver Function Test (LFT) — bilirubin, ALT, AST, ALP, albumin.':'Avoid alcohol and maintain a liver-friendly diet.', 'Use the ML Prediction tool with your actual lab values for a precise risk score.'],
    nextStep:`Visit a diagnostic lab and get the recommended tests for ${dom}. Upload the results here for precise AI analysis.`,
  };
}

/* ═══════════════════════════════════════════════════════════
   UI COMPONENTS
═══════════════════════════════════════════════════════════ */
const Disclaimer = () => (
  <div style={{display:'flex',gap:'12px',alignItems:'flex-start',padding:'12px 16px',borderRadius:'12px',marginBottom:'20px',background:'rgba(217,119,6,0.07)',border:'1.5px solid rgba(217,119,6,0.25)'}}>
    <AlertTriangle size={14} color="#d97706" style={{flexShrink:0,marginTop:'2px'}}/>
    <p style={{fontSize:'12px',color:'#d97706',fontWeight:600,lineHeight:1.6,margin:0}}><strong>Medical Disclaimer:</strong> This AI analysis is for <em>informational purposes only</em>. It does not constitute medical advice or diagnosis. Always consult a qualified healthcare professional.</p>
  </div>
);

const Steps = ({ current }) => {
  const steps = [{n:1,label:'Symptoms',icon:'🩺'},{n:2,label:'Tests',icon:'🔬'},{n:3,label:'Upload',icon:'📄'},{n:4,label:'Report',icon:'📊'}];
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:'32px',flexWrap:'wrap',rowGap:'12px'}}>
      {steps.map((s,i) => (
        <React.Fragment key={s.n}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
            <div style={{width:'44px',height:'44px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'14px',fontFamily:'Outfit,sans-serif',background:current>s.n?'linear-gradient(135deg,#1E3A8A,#84CC16)':current===s.n?'var(--gradient-brand)':'var(--bg-raised)',color:current>=s.n?'white':'var(--text-muted)',border:current>=s.n?'none':'2px solid var(--border)',boxShadow:current>=s.n?'0 4px 14px var(--accent-glow)':'none',transition:'all 0.3s'}}>
              {current>s.n?'✓':s.icon}
            </div>
            <span style={{fontSize:'11px',fontWeight:700,color:current>=s.n?'var(--accent)':'var(--text-muted)',whiteSpace:'nowrap'}}>{s.label}</span>
          </div>
          {i < steps.length-1 && <div style={{height:'2px',width:'clamp(40px,7vw,80px)',background:current>s.n?'var(--accent)':'var(--border)',margin:'0 6px',marginBottom:'22px',transition:'background 0.3s',borderRadius:'2px'}}/>}
        </React.Fragment>
      ))}
    </div>
  );
};

function MetricRow({ label, metric, normalRange }) {
  const { raw, status } = metric || {raw:'Not Available',status:'not available'};
  const sc = STATUS_STYLE[status?.toLowerCase()] || STATUS_STYLE['not available'];
  const hasData = raw && raw !== 'Not Available' && raw !== 'N/A';
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 11px',borderRadius:'8px',background:hasData?sc.bg:'var(--bg-raised)',border:`1px solid ${hasData?sc.bar+'30':'var(--border-subtle)'}`,marginBottom:'5px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
        <div style={{width:'7px',height:'7px',borderRadius:'50%',background:hasData?sc.bar:'var(--border)',flexShrink:0}}/>
        <span style={{fontSize:'12px',fontWeight:600,color:'var(--text-secondary)'}}>{label}</span>
        {normalRange && <span style={{fontSize:'10px',color:'var(--text-faint)',fontWeight:500}}>({normalRange})</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
        <span style={{fontSize:'12px',fontWeight:800,color:hasData?sc.bar:'var(--text-faint)',fontFamily:'Outfit,sans-serif'}}>{raw}</span>
        {hasData && <span style={{fontSize:'10px',fontWeight:700,padding:'2px 6px',borderRadius:'5px',background:`${sc.bar}20`,color:sc.text,border:`1px solid ${sc.bar}25`}}>{sc.label}</span>}
      </div>
    </div>
  );
}

function ProbArc({ value, color, size=70 }) {
  const r=size/2-7, circ=2*Math.PI*r, dash=Math.min(value/100,1)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-raised)" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)'}}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="12" fontWeight="800" fontFamily="Outfit,sans-serif" style={{transform:'rotate(90deg)',transformOrigin:`${size/2}px ${size/2}px`}}>{value}%</text>
    </svg>
  );
}

function DiseaseCard({ title, icon, color, data }) {
  const { riskLevel, probability, confidence, keyIndicators, missingData, clinicalInsight } = data;
  const rc=RISK_COLOR[riskLevel]||'#84CC16', rbg=RISK_BG[riskLevel]||'rgba(132,204,22,0.10)', rbd=RISK_BORDER[riskLevel]||'rgba(132,204,22,0.30)';
  return (
    <div style={{background:'var(--bg-surface)',border:`1.5px solid ${color}20`,borderRadius:'18px',overflow:'hidden',boxShadow:'var(--shadow-sm)'}}>
      <div style={{background:`linear-gradient(135deg, ${color}10, ${color}05)`,borderBottom:`1px solid ${color}18`,padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'42px',height:'42px',borderRadius:'12px',background:`${color}15`,border:`1.5px solid ${color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{icon}</div>
          <div>
            <div style={{fontFamily:'Outfit,sans-serif',fontSize:'14px',fontWeight:900,color:'var(--text-primary)'}}>{title}</div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'3px'}}>
              <span style={{padding:'2px 9px',borderRadius:'20px',fontSize:'10px',fontWeight:800,background:rbg,color:rc,border:`1px solid ${rbd}`}}>{riskLevel} Risk</span>
              <span style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:600}}>Conf: {confidence}%</span>
            </div>
          </div>
        </div>
        <ProbArc value={probability} color={rc} size={68}/>
      </div>
      <div style={{padding:'14px 18px'}}>
        <div style={{marginBottom:'14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}>
            <span style={{fontSize:'10px',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Risk Probability</span>
            <span style={{fontSize:'12px',fontWeight:900,color:rc}}>{probability}%</span>
          </div>
          <div style={{height:'8px',borderRadius:'6px',background:'var(--bg-raised)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${probability}%`,borderRadius:'6px',background:`linear-gradient(90deg, ${rc}60, ${rc})`,transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)'}}/>
          </div>
        </div>

        {keyIndicators?.length>0 && (
          <div style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'7px',display:'flex',alignItems:'center',gap:'5px'}}><AlertCircle size={10}/> Key Indicators</div>
            {keyIndicators.slice(0,4).map((ind,i) => (
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'7px',marginBottom:'5px'}}>
                <div style={{width:'6px',height:'6px',borderRadius:'50%',background:color,flexShrink:0,marginTop:'5px'}}/>
                <span style={{fontSize:'11px',color:'var(--text-secondary)',fontWeight:600,lineHeight:1.5}}>{ind}</span>
              </div>
            ))}
          </div>
        )}

        {missingData?.length>0 && (
          <div style={{marginBottom:'12px',padding:'9px 11px',borderRadius:'9px',background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.22)'}}>
            <div style={{fontSize:'10px',fontWeight:800,color:'#92400e',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>⚠ Missing Data</div>
            {missingData.slice(0,3).map((m,i) => <div key={i} style={{fontSize:'11px',color:'#d97706',fontWeight:500,marginBottom:'3px'}}>• {m}</div>)}
          </div>
        )}

        {clinicalInsight && (
          <div style={{padding:'9px 12px',borderRadius:'9px',background:`${color}08`,border:`1px solid ${color}20`}}>
            <div style={{fontSize:'10px',fontWeight:800,color:color,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px'}}>🩺 Clinical Insight</div>
            <p style={{fontSize:'12px',color:'var(--text-secondary)',fontWeight:500,lineHeight:1.6,margin:0}}>{clinicalInsight}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProbBar({ label, icon, probability, risk }) {
  const rc=RISK_COLOR[risk]||'#84CC16';
  return (
    <div style={{marginBottom:'14px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'14px'}}>{icon}</span>
          <span style={{fontSize:'13px',fontWeight:700,color:'var(--text-primary)'}}>{label}</span>
          <span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:800,background:RISK_BG[risk],color:rc,border:`1px solid ${RISK_BORDER[risk]}`}}>{risk}</span>
        </div>
        <span style={{fontSize:'14px',fontWeight:900,color:rc,fontFamily:'Outfit,sans-serif'}}>{probability}%</span>
      </div>
      <div style={{height:'10px',borderRadius:'8px',background:'var(--bg-raised)',overflow:'hidden',border:'1px solid var(--border-subtle)'}}>
        <div style={{height:'100%',width:`${probability}%`,borderRadius:'8px',background:`linear-gradient(90deg, ${rc}60, ${rc})`,transition:'width 1.3s cubic-bezier(0.4,0,0.2,1)',boxShadow:`0 0 8px ${rc}40`}}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function SymptomPredictionPage() {
  const { user } = useAuth();
  const [step,               setStep]              = useState(1);
  const [selectedSymptoms,   setSelectedSymptoms]  = useState([]);
  const [detectedCategories, setDetectedCategories]= useState([]);
  const [uploadedFile,       setUploadedFile]      = useState(null);
  const [additionalNotes,    setAdditionalNotes]   = useState('');
  const [analysisResult,     setAnalysisResult]    = useState(null);
  const [loading,            setLoading]           = useState(false);
  const [fileError,          setFileError]         = useState('');
  const [searchSym,          setSearchSym]         = useState('');
  const fileRef = useRef();

  const toggleSymptom = (sym, cat) => {
    const exists = selectedSymptoms.find(s => s.sym === sym);
    const next   = exists ? selectedSymptoms.filter(s => s.sym !== sym) : [...selectedSymptoms, { sym, cat }];
    setSelectedSymptoms(next);
    setDetectedCategories([...new Set(next.map(s => s.cat))]);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileError('');
    if (f.size > 10*1024*1024) { setFileError('File exceeds 10 MB.'); return; }
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setFileError('Only PDF or image files (JPG, PNG) are accepted.');
      setUploadedFile(null); e.target.value=''; return;
    }
    setUploadedFile(f);
  };

  /* ─────────────────────────────────────────────────────────
     OCR ANALYSIS — replaces Gemini API
     Sends file to /api/ocr/analyze-report (local, no API key)
     Receives structured text → passes to parseReport()
  ───────────────────────────────────────────────────────── */
  const OCR_ENDPOINT = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ocr/analyze-report`;

  const runAIAnalysis = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const symptomsText = selectedSymptoms.map(s => s.sym).join(', ');
      const patientCtx   = `Patient: ${user?.name||'Unknown'} | Age: ${user?.age||'?'} | Gender: ${user?.gender||'?'}
Reported Symptoms: ${symptomsText||'None'}
Symptom Categories: ${detectedCategories.join(', ')||'None'}
Additional Notes: ${additionalNotes||'None'}`;

      let parsed = null;

      if (uploadedFile) {
        /* ── Send file to backend OCR service ── */
        const formData = new FormData();
        formData.append('file',       uploadedFile);
        formData.append('patientCtx', patientCtx);
        formData.append('symptoms',   JSON.stringify(selectedSymptoms));

        try {
          const resp = await fetch(OCR_ENDPOINT, {
            method: 'POST',
            body:   formData,
            // No Content-Type header — browser sets multipart boundary automatically
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.success && data.structuredText) {
              parsed = parseReport(data.structuredText);
            } else {
              console.warn('OCR service returned error:', data.message);
            }
          } else {
            const err = await resp.json().catch(() => ({}));
            console.warn('OCR endpoint error:', resp.status, err.message || '');
          }
        } catch (fetchErr) {
          console.warn('OCR fetch failed (is backend running?):', fetchErr.message);
        }
      }

      /* ── Fallback: symptom-only if no file or OCR failed ── */
      if (!parsed || (!parsed.invalid && !parsed.overall)) {
        parsed = buildFallback(selectedSymptoms, detectedCategories);
      }

      setAnalysisResult(parsed);
      setStep(4);
    } catch (err) {
      console.error('runAIAnalysis:', err);
      setAnalysisResult(buildFallback(selectedSymptoms, detectedCategories));
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const filteredSymptoms = ALL_SYMPTOMS_FLAT.filter(s => s.sym.toLowerCase().includes(searchSym.toLowerCase()));
  const resetAll = () => { setStep(1); setSelectedSymptoms([]); setDetectedCategories([]); setUploadedFile(null); setAdditionalNotes(''); setAnalysisResult(null); setFileError(''); setSearchSym(''); };

  return (
    <div className="page-container" style={{background:'var(--bg-base)'}}>
      <Navbar/>
      <div className="content-wrapper">

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'10px',padding:'8px 20px',borderRadius:'30px',background:'rgba(30,58,138,0.10)',border:'1.5px solid rgba(30,58,138,0.25)',marginBottom:'16px'}}>
            <span style={{fontSize:'16px'}}>🩺</span>
            <span style={{fontSize:'12px',fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'1px'}}>AI Clinical Report System</span>
          </div>
          <h1 style={{fontFamily:'Outfit,sans-serif',fontSize:'clamp(22px,4vw,34px)',fontWeight:900,color:'var(--text-primary)',letterSpacing:'-0.5px',marginBottom:'10px'}}>AI-Powered Symptom Checker</h1>
          <p style={{color:'var(--text-muted)',fontSize:'14px',lineHeight:1.7,maxWidth:'560px',margin:'0 auto',fontWeight:500}}>Select symptoms → get recommended tests → upload your report → receive a structured clinical analysis → Use ML model for risk prediction</p>
        </div>

        <Steps current={step}/>

        {/* ══ STEP 1 ══════════════════════════════════ */}
        {step===1 && (
          <div className="card animate-fadeInUp" style={{borderTop:'3px solid var(--accent)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'20px',fontWeight:900,color:'var(--text-primary)',marginBottom:'4px'}}>Select Your Symptoms</h2>
                <p style={{color:'var(--text-muted)',fontSize:'13px',fontWeight:500}}>Tap all symptoms you are currently experiencing</p>
              </div>
              {selectedSymptoms.length>0 && <div style={{padding:'6px 16px',borderRadius:'20px',background:'var(--accent-soft)',border:'1.5px solid var(--accent-glow)',fontWeight:700,fontSize:'13px',color:'var(--accent)'}}>{selectedSymptoms.length} selected</div>}
            </div>

            <div style={{position:'relative',marginBottom:'20px'}}>
              <input type="text" value={searchSym} onChange={e=>setSearchSym(e.target.value)} placeholder="Search symptoms…" style={{width:'100%',padding:'11px 16px 11px 40px',borderRadius:'12px',border:'1.5px solid var(--border)',background:'var(--input-bg)',color:'var(--text-primary)',fontSize:'13px',fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'16px'}}>🔍</span>
              {searchSym && <button onClick={()=>setSearchSym('')} style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'16px'}}>✕</button>}
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'9px',marginBottom:'24px'}}>
              {filteredSymptoms.map(({sym,cat}) => {
                const g=DISEASE_TESTS[cat], sel=!!selectedSymptoms.find(s=>s.sym===sym);
                return <button key={sym} onClick={()=>toggleSymptom(sym,cat)} style={{padding:'9px 14px',borderRadius:'10px',border:`1.5px solid ${sel?g.color:'var(--border)'}`,background:sel?g.bg:'var(--bg-raised)',color:sel?g.color:'var(--text-secondary)',cursor:'pointer',fontSize:'13px',fontWeight:sel?700:500,fontFamily:'Outfit,sans-serif',transition:'all 0.18s',display:'flex',alignItems:'center',gap:'6px'}}>{sel&&<span style={{fontSize:'12px'}}>✓</span>}{sym}</button>;
              })}
              {filteredSymptoms.length===0 && <div style={{width:'100%',textAlign:'center',padding:'32px',color:'var(--text-muted)',fontWeight:600}}>No symptoms found for "{searchSym}"</div>}
            </div>

            {selectedSymptoms.length>0 && (
              <div style={{padding:'13px 15px',borderRadius:'12px',background:'var(--accent-soft)',border:'1.5px solid var(--accent-glow)',marginBottom:'20px'}}>
                <p style={{fontWeight:700,fontSize:'11px',color:'var(--accent)',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Selected symptoms</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {selectedSymptoms.map(({sym,cat}) => { const g=DISEASE_TESTS[cat]; return <span key={sym} onClick={()=>toggleSymptom(sym,cat)} style={{padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:700,background:g.bg,color:g.color,border:`1px solid ${g.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}>{sym}<X size={10}/></span>; })}
                </div>
              </div>
            )}

            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button onClick={()=>setStep(2)} disabled={selectedSymptoms.length===0} className="btn btn-primary" style={{opacity:selectedSymptoms.length===0?0.45:1,gap:'8px'}}>View Recommended Tests <ChevronRight size={16}/></button>
            </div>
          </div>
        )}

        {/* ══ STEP 2 ══════════════════════════════════ */}
        {step===2 && (
          <div className="card animate-fadeInUp" style={{borderTop:'3px solid #1E3A8A'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'20px',fontWeight:900,color:'var(--text-primary)',marginBottom:'4px'}}>Recommended Diagnostic Tests</h2>
                <p style={{color:'var(--text-muted)',fontSize:'13px',fontWeight:500}}>Based on features required by our trained ML models</p>
              </div>
              <button onClick={()=>setStep(1)} style={{background:'none',border:'1.5px solid var(--border)',borderRadius:'10px',padding:'7px 14px',color:'var(--text-secondary)',cursor:'pointer',fontWeight:700,fontSize:'13px'}}>← Back</button>
            </div>

            <div style={{padding:'12px 16px',borderRadius:'12px',background:'rgba(30,58,138,0.07)',border:'1.5px solid rgba(30,58,138,0.20)',marginBottom:'24px',display:'flex',gap:'12px'}}>
              <span style={{fontSize:'18px',flexShrink:0}}>🧬</span>
              <p style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:1.6,fontWeight:500,margin:0}}>Each test maps to a <strong>feature required by our trained ML models</strong> — Random Forest (Heart), XGBoost (Liver), SVM (Parkinson's).</p>
            </div>

            {detectedCategories.map(cat => {
              const g=DISEASE_TESTS[cat], catSyms=selectedSymptoms.filter(s=>s.cat===cat).map(s=>s.sym);
              return (
                <div key={cat} style={{marginBottom:'28px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',padding:'11px 15px',borderRadius:'12px',background:g.bg,border:`1.5px solid ${g.border}`}}>
                    <div style={{width:'40px',height:'40px',borderRadius:'12px',background:g.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',boxShadow:`0 3px 12px ${g.glow}`,flexShrink:0}}>{g.icon}</div>
                    <div style={{flex:1}}>
                      <h3 style={{fontFamily:'Outfit,sans-serif',fontSize:'15px',fontWeight:900,color:g.color,marginBottom:'2px'}}>{cat} Disease Tests</h3>
                      <p style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:600}}>Triggered by: {catSyms.slice(0,3).join(' · ')}{catSyms.length>3?` +${catSyms.length-3} more`:''}</p>
                    </div>
                    <span style={{padding:'2px 10px',borderRadius:'20px',background:g.gradient,color:'white',fontSize:'11px',fontWeight:800}}>{g.tests.length} tests</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'9px'}}>
                    {g.tests.map(t => (
                      <div key={t.name} style={{display:'flex',gap:'10px',alignItems:'flex-start',padding:'12px 14px',borderRadius:'11px',background:'var(--bg-surface)',border:`1.5px solid ${g.border}`,transition:'all 0.2s'}}
                        onMouseOver={e=>{e.currentTarget.style.background=g.bg;e.currentTarget.style.transform='translateY(-2px)';}}
                        onMouseOut={e=>{e.currentTarget.style.background='var(--bg-surface)';e.currentTarget.style.transform='';}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'9px',background:g.bg,border:`1px solid ${g.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',flexShrink:0}}>{t.icon}</div>
                        <div>
                          <div style={{fontWeight:800,fontSize:'12px',color:'var(--text-primary)',marginBottom:'3px'}}>{t.name}</div>
                          <div style={{fontSize:'10px',color:'var(--text-muted)',lineHeight:1.5,fontWeight:500,marginBottom:'4px'}}>{t.why}</div>
                          <div style={{fontSize:'10px',fontWeight:800,color:g.color,background:g.bg,padding:'2px 7px',borderRadius:'5px',display:'inline-block',border:`1px solid ${g.border}`}}>ML param: {t.param}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{display:'flex',justifyContent:'space-between',gap:'10px',flexWrap:'wrap'}}>
              <button onClick={()=>setStep(1)} className="btn btn-secondary">← Back</button>
              <button onClick={()=>setStep(3)} className="btn btn-primary" style={{gap:'8px'}}>Upload Reports <ChevronRight size={16}/></button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 ══════════════════════════════════ */}
        {step===3 && (
          <div className="card animate-fadeInUp" style={{borderTop:'3px solid #84CC16'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'20px',fontWeight:900,color:'var(--text-primary)',marginBottom:'4px'}}>Upload Medical Report</h2>
                <p style={{color:'var(--text-muted)',fontSize:'13px',fontWeight:500}}>Our OCR engine will extract text and generate a structured clinical report .</p>
              </div>
              <button onClick={()=>setStep(2)} style={{background:'none',border:'1.5px solid var(--border)',borderRadius:'10px',padding:'7px 14px',color:'var(--text-secondary)',cursor:'pointer',fontWeight:700,fontSize:'13px'}}>← Back</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:'9px',marginBottom:'20px'}}>
              {[{icon:'🩸',label:'Blood Test',desc:'CBC, LFT, Lipid'},{icon:'📈',label:'ECG Report',desc:'Electrocardiogram'},{icon:'📡',label:'Scan Report',desc:'Ultrasound, MRI, CT'},{icon:'🧪',label:'Biochemistry',desc:'Enzyme & protein'}].map(g=>(
                <div key={g.label} style={{padding:'11px',borderRadius:'11px',background:'var(--bg-raised)',border:'1.5px solid var(--border-subtle)',textAlign:'center'}}>
                  <div style={{fontSize:'20px',marginBottom:'4px'}}>{g.icon}</div>
                  <div style={{fontWeight:700,fontSize:'12px',color:'var(--text-primary)',marginBottom:'2px'}}>{g.label}</div>
                  <div style={{fontSize:'10px',color:'var(--text-muted)',fontWeight:500}}>{g.desc}</div>
                </div>
              ))}
            </div>

            {/* AI flow info */}
            <div style={{padding:'12px 16px',borderRadius:'12px',background:'rgba(132,204,22,0.07)',border:'1.5px solid rgba(132,204,22,0.25)',marginBottom:'16px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
              <FileSearch size={15} color="#84CC16" style={{flexShrink:0,marginTop:'2px'}}/>
              <div>
                <p style={{fontSize:'12px',fontWeight:800,color:'#3B6D11',marginBottom:'3px'}}>3-Step Analysis Flow</p>
                <p style={{fontSize:'11px',color:'var(--text-muted)',lineHeight:1.6,fontWeight:500,margin:0}}><strong>1. Extract</strong> — pdf-parse reads text-based PDFs · Tesseract OCR reads images &amp; scanned PDFs · <strong>2. Parse</strong> — Regex engine extracts medical values · <strong>3. Report</strong> — Structured clinical risk analysis generated .</p>
              </div>
            </div>

            <div onClick={()=>fileRef.current.click()} style={{border:`2.5px dashed ${fileError?'#ef4444':uploadedFile?'#84CC16':'var(--border)'}`,borderRadius:'16px',padding:'38px 24px',textAlign:'center',cursor:'pointer',background:fileError?'rgba(239,68,68,0.04)':uploadedFile?'rgba(132,204,22,0.05)':'var(--bg-raised)',transition:'all 0.25s'}}
              onMouseOver={e=>{if(!fileError)e.currentTarget.style.borderColor=uploadedFile?'#84CC16':'var(--accent)';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=fileError?'#ef4444':uploadedFile?'#84CC16':'var(--border)';}}>
              <input ref={fileRef} type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={handleFileChange}/>
              {uploadedFile ? (
                <><div style={{fontSize:'40px',marginBottom:'10px'}}>✅</div><div style={{fontWeight:900,color:'#84CC16',fontSize:'15px',marginBottom:'4px',fontFamily:'Outfit,sans-serif'}}>{uploadedFile.name}</div><div style={{fontSize:'12px',color:'var(--text-muted)'}}>{(uploadedFile.size/1024).toFixed(1)} KB · Click to replace</div><div style={{marginTop:'10px',display:'inline-block',padding:'4px 12px',borderRadius:'20px',background:'rgba(132,204,22,0.12)',border:'1px solid rgba(132,204,22,0.30)',fontSize:'11px',fontWeight:700,color:'#84CC16'}}>✓ Ready for AI analysis</div></>
              ) : fileError ? (
                <><div style={{fontSize:'40px',marginBottom:'10px'}}>🚫</div><div style={{fontWeight:800,color:'#ef4444',fontSize:'14px',marginBottom:'8px'}}>Invalid File</div><div style={{fontSize:'12px',color:'#ef4444',lineHeight:1.6,maxWidth:'400px',margin:'0 auto',fontWeight:600}}>{fileError}</div><div style={{marginTop:'12px',fontSize:'11px',color:'var(--text-muted)',fontWeight:600}}>Click to upload a different file</div></>
              ) : (
                <><Upload size={36} color="var(--text-muted)" style={{marginBottom:'12px'}}/><div style={{fontWeight:800,color:'var(--text-secondary)',fontSize:'15px',marginBottom:'6px',fontFamily:'Outfit,sans-serif'}}>Drop your medical report here</div><div style={{fontSize:'12px',color:'var(--text-muted)',fontWeight:500,lineHeight:1.6}}>Lab reports, ECG, scans · PDF, JPG, PNG · Max 10 MB</div><div style={{marginTop:'10px',fontSize:'11px',color:'var(--text-muted)',background:'var(--bg-surface)',padding:'4px 12px',borderRadius:'16px',display:'inline-block',border:'1px solid var(--border)'}}>Local OCR extracts values.</div></>
              )}
            </div>

            <div style={{marginTop:'18px',marginBottom:'22px'}}>
              <label style={{display:'block',fontWeight:700,fontSize:'13px',color:'var(--text-secondary)',marginBottom:'7px'}}>Additional Notes <span style={{fontWeight:500,color:'var(--text-muted)'}}>(optional)</span></label>
              <textarea value={additionalNotes} onChange={e=>setAdditionalNotes(e.target.value)} placeholder="E.g. symptoms for 3 weeks, family history of heart disease, on medication…" rows={3}
                style={{width:'100%',padding:'12px 14px',borderRadius:'12px',border:'1.5px solid var(--border)',background:'var(--input-bg)',color:'var(--text-primary)',fontSize:'13px',fontFamily:'Outfit,sans-serif',resize:'vertical',outline:'none',boxSizing:'border-box'}}/>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',gap:'10px',flexWrap:'wrap'}}>
              <button onClick={()=>setStep(2)} className="btn btn-secondary">← Back</button>
              <button onClick={runAIAnalysis} disabled={loading} className="btn btn-primary" style={{minWidth:'220px',gap:'8px'}}>
                {loading ? <><span className="loading-spinner" style={{width:'16px',height:'16px',borderWidth:'2px',display:'inline-block',marginRight:'6px'}}/> Generating Clinical Report…</> : <><Stethoscope size={16}/> Generate AI Clinical Report</>}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 4: REPORT ═══════════════════════════ */}
        {step===4 && analysisResult && (
          <div className="animate-fadeInUp">

            {/* INVALID */}
            {analysisResult.invalid && (
              <div style={{marginBottom:'24px'}}>
                <div style={{padding:'32px',borderRadius:'20px',background:'rgba(239,68,68,0.06)',border:'2px solid rgba(239,68,68,0.28)',textAlign:'center',marginBottom:'20px'}}>
                  <div style={{fontSize:'52px',marginBottom:'12px'}}>🚫</div>
                  <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'22px',fontWeight:900,color:'#ef4444',marginBottom:'8px'}}>❌ Invalid Report Detected</h2>
                  <div style={{display:'inline-block',padding:'4px 14px',borderRadius:'20px',background:'rgba(239,68,68,0.10)',border:'1px solid rgba(239,68,68,0.28)',fontSize:'13px',fontWeight:700,color:'#ef4444',marginBottom:'16px'}}>Confidence: {analysisResult.confidence}%</div>
                  <div style={{maxWidth:'500px',margin:'0 auto'}}>
                    <p style={{fontSize:'14px',color:'var(--text-secondary)',lineHeight:1.7,fontWeight:500,marginBottom:'16px'}}><strong>Reason:</strong> {analysisResult.reason}</p>
                    <div style={{padding:'14px 18px',borderRadius:'12px',background:'rgba(132,204,22,0.08)',border:'1.5px solid rgba(132,204,22,0.25)',textAlign:'left'}}>
                      <p style={{fontSize:'12px',fontWeight:800,color:'#3B6D11',marginBottom:'6px'}}>What to do next:</p>
                      <p style={{fontSize:'12px',color:'var(--text-secondary)',fontWeight:500,lineHeight:1.6,margin:0}}>{analysisResult.whatToDo}</p>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
                  <button onClick={()=>setStep(3)} className="btn btn-primary" style={{gap:'8px'}}><Upload size={15}/> Upload Different Report</button>
                  <button onClick={()=>{setUploadedFile(null);runAIAnalysis();}} className="btn btn-secondary" style={{gap:'8px'}}><Brain size={15}/> Analyse Symptoms Only</button>
                </div>
              </div>
            )}

            {/* VALID */}
            {!analysisResult.invalid && (
              <>
                <Disclaimer/>

                {/* Classification Badge */}
                <div style={{padding:'18px 22px',borderRadius:'16px',background:'linear-gradient(135deg,rgba(30,58,138,0.08),rgba(132,204,22,0.06))',border:'1.5px solid rgba(30,58,138,0.20)',marginBottom:'20px',display:'flex',gap:'14px',alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{width:'46px',height:'46px',borderRadius:'13px',background:'rgba(132,204,22,0.15)',border:'1.5px solid rgba(132,204,22,0.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>✅</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'11px',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'3px'}}>Medical Report Verified</div>
                    <div style={{fontFamily:'Outfit,sans-serif',fontSize:'15px',fontWeight:900,color:'var(--text-primary)',marginBottom:'4px'}}>{analysisResult.reportType}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                      <span style={{fontSize:'12px',color:'var(--text-muted)',fontWeight:600}}>AI Confidence:</span>
                      <div style={{display:'flex',alignItems:'center',gap:'3px'}}>
                        {[...Array(5)].map((_,i)=><div key={i} style={{width:'18px',height:'5px',borderRadius:'3px',background:i<Math.round(analysisResult.confidence/20)?'#84CC16':'var(--border)',transition:'background 0.3s'}}/>)}
                        <span style={{fontSize:'12px',fontWeight:800,color:'#84CC16',marginLeft:'4px'}}>{analysisResult.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const urg=analysisResult.overall?.urgency||'routine', um=URGENCY_META[urg]||URGENCY_META.routine;
                    return <div style={{padding:'7px 14px',borderRadius:'10px',background:um.bg,border:`1px solid ${um.color}40`,display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}><span style={{fontSize:'14px'}}>{um.icon}</span><span style={{fontSize:'12px',fontWeight:800,color:um.color}}>{um.label}</span></div>;
                  })()}
                </div>

                {/* Overall Summary */}
                {analysisResult.overall && (()=>{
                  const ov=analysisResult.overall, rc=RISK_COLOR[ov.risk]||'#84CC16';
                  return (
                    <div style={{padding:'20px 24px',borderRadius:'18px',marginBottom:'20px',background:`linear-gradient(135deg, ${RISK_BG[ov.risk]} 0%, var(--bg-surface) 100%)`,border:`2px solid ${rc}`,boxShadow:`0 8px 28px ${RISK_BG[ov.risk]}`,position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',right:'-20px',top:'-30px',width:'150px',height:'150px',borderRadius:'50%',background:`${rc}05`,pointerEvents:'none'}}/>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'14px'}}>
                        <div>
                          <p style={{fontSize:'10px',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:'10px'}}>📌 Overall Health Summary</p>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px',flexWrap:'wrap'}}>
                            <span style={{padding:'5px 18px',borderRadius:'30px',fontWeight:900,fontSize:'16px',fontFamily:'Outfit,sans-serif',background:RISK_BG[ov.risk],color:rc,border:`2px solid ${rc}`}}>{ov.icon} {ov.risk} Risk</span>
                            {ov.primaryConcern&&ov.primaryConcern!=='No primary concern identified'&&<span style={{fontSize:'12px',fontWeight:700,color:'var(--text-secondary)',padding:'4px 11px',background:'var(--bg-raised)',borderRadius:'8px',border:'1px solid var(--border)'}}>Primary: {ov.primaryConcern}</span>}
                          </div>
                          <p style={{fontSize:'13px',color:'var(--text-secondary)',lineHeight:1.7,fontWeight:500,maxWidth:'500px',margin:0}}>{ov.summary}</p>
                        </div>
                        <Activity size={44} color={rc} style={{opacity:0.18,flexShrink:0}}/>
                      </div>
                    </div>
                  );
                })()}

                {/* Risk Probability Chart */}
                <div className="card" style={{marginBottom:'20px'}}>
                  <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'16px',fontWeight:900,color:'var(--text-primary)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>📊 Disease Risk Probability</h2>
                  <ProbBar label="Heart Disease"       icon="❤️" probability={analysisResult.heart?.probability||0}    risk={analysisResult.heart?.riskLevel||'Low'}/>
                  <ProbBar label="Liver Disease"       icon="🫀" probability={analysisResult.liver?.probability||0}    risk={analysisResult.liver?.riskLevel||'Low'}/>
                  <ProbBar label="Parkinson's Disease" icon="🧠" probability={analysisResult.parkinson?.probability||0} risk={analysisResult.parkinson?.riskLevel||'Low'}/>
                </div>

                {/* Extracted Data */}
                {analysisResult.metrics && (
                  <div className="card" style={{marginBottom:'20px'}}>
                    <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'16px',fontWeight:900,color:'var(--text-primary)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>🧾 Extracted Medical Data</h2>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:'16px'}}>
                      <div style={{padding:'13px',borderRadius:'12px',border:'1.5px solid rgba(225,29,72,0.18)',background:'rgba(225,29,72,0.02)'}}>
                        <div style={{fontSize:'13px',fontWeight:900,color:'#e11d48',marginBottom:'10px'}}>❤️ Heart Metrics</div>
                        <MetricRow label="Cholesterol"      metric={analysisResult.metrics.heart.cholesterol}   normalRange="125–200 mg/dL"/>
                        <MetricRow label="Blood Pressure"   metric={analysisResult.metrics.heart.bloodPressure} normalRange="90–120 mmHg"/>
                        <MetricRow label="Heart Rate"       metric={analysisResult.metrics.heart.heartRate}     normalRange="60–100 bpm"/>
                        <MetricRow label="Fasting Glucose"  metric={analysisResult.metrics.heart.glucose}       normalRange="70–100 mg/dL"/>
                        <MetricRow label="ST Depression"    metric={analysisResult.metrics.heart.stDepression}  normalRange="< 1.0 mm"/>
                        <MetricRow label="ECG Findings"     metric={analysisResult.metrics.heart.ecg}/>
                      </div>
                      <div style={{padding:'13px',borderRadius:'12px',border:'1.5px solid rgba(217,119,6,0.18)',background:'rgba(217,119,6,0.02)'}}>
                        <div style={{fontSize:'13px',fontWeight:900,color:'#d97706',marginBottom:'10px'}}>🫀 Liver Metrics</div>
                        <MetricRow label="Total Bilirubin"  metric={analysisResult.metrics.liver.bilirubin}  normalRange="0.3–1.2 mg/dL"/>
                        <MetricRow label="Direct Bilirubin" metric={analysisResult.metrics.liver.directBili} normalRange="0.0–0.3 mg/dL"/>
                        <MetricRow label="ALT (SGPT)"       metric={analysisResult.metrics.liver.alt}        normalRange="7–56 IU/L"/>
                        <MetricRow label="AST (SGOT)"       metric={analysisResult.metrics.liver.ast}        normalRange="10–40 IU/L"/>
                        <MetricRow label="ALP"              metric={analysisResult.metrics.liver.alp}        normalRange="44–147 IU/L"/>
                        <MetricRow label="Albumin"          metric={analysisResult.metrics.liver.albumin}    normalRange="3.5–5.0 g/dL"/>
                        <MetricRow label="Total Protein"    metric={analysisResult.metrics.liver.protein}    normalRange="6.0–8.3 g/dL"/>
                        <MetricRow label="A/G Ratio"        metric={analysisResult.metrics.liver.agRatio}    normalRange="1.0–2.5"/>
                      </div>
                      <div style={{padding:'13px',borderRadius:'12px',border:'1.5px solid rgba(124,58,237,0.18)',background:'rgba(124,58,237,0.02)'}}>
                        <div style={{fontSize:'13px',fontWeight:900,color:'#7c3aed',marginBottom:'10px'}}>🧠 Parkinson Indicators</div>
                        <MetricRow label="Voice Jitter"     metric={analysisResult.metrics.parkinson.jitter}  normalRange="0.0–0.01%"/>
                        <MetricRow label="Voice Shimmer"    metric={analysisResult.metrics.parkinson.shimmer} normalRange="0.0–0.03"/>
                        <MetricRow label="HNR"              metric={analysisResult.metrics.parkinson.hnr}     normalRange="20–35 dB"/>
                        <MetricRow label="Voice Frequency"  metric={analysisResult.metrics.parkinson.fo}      normalRange="85–255 Hz"/>
                        <MetricRow label="Motor Symptoms"   metric={analysisResult.metrics.parkinson.motor}/>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disease Cards */}
                <div style={{marginBottom:'20px'}}>
                  <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'16px',fontWeight:900,color:'var(--text-primary)',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px'}}>📊 Individual Disease Analysis</h2>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:'14px'}}>
                    <DiseaseCard title="Heart Disease"       icon="❤️" color="#e11d48" data={analysisResult.heart||{}}/>
                    <DiseaseCard title="Liver Disease"       icon="🫀" color="#d97706" data={analysisResult.liver||{}}/>
                    <DiseaseCard title="Parkinson's Disease" icon="🧠" color="#7c3aed" data={analysisResult.parkinson||{}}/>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="card" style={{marginBottom:'20px',borderLeft:'4px solid var(--accent)'}}>
                  <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'16px',fontWeight:900,color:'var(--text-primary)',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px'}}>💡 Clinical Recommendations</h2>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'14px'}}>
                    {(analysisResult.recommendations||[]).map((r,i) => (
                      <div key={i} style={{display:'flex',gap:'10px',alignItems:'flex-start',padding:'11px 13px',borderRadius:'10px',background:'var(--bg-raised)',border:'1.5px solid var(--border-subtle)'}}>
                        <div style={{width:'24px',height:'24px',borderRadius:'7px',background:'var(--accent-soft)',border:'1.5px solid var(--accent-glow)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:900,color:'var(--accent)',flexShrink:0}}>{i+1}</div>
                        <p style={{fontSize:'13px',color:'var(--text-secondary)',lineHeight:1.65,fontWeight:500,margin:0}}>{r}</p>
                      </div>
                    ))}
                  </div>
                  {analysisResult.nextStep && (
                    <div style={{padding:'12px 14px',borderRadius:'10px',background:'var(--accent-soft)',border:'1.5px solid var(--accent-glow)',display:'flex',gap:'9px',alignItems:'flex-start'}}>
                      <span style={{fontSize:'15px',flexShrink:0}}>🚀</span>
                      <p style={{fontSize:'13px',color:'var(--accent)',fontWeight:700,margin:0}}><strong>Next Step: </strong>{analysisResult.nextStep}</p>
                    </div>
                  )}
                </div>

                {/* ML CTA */}
                <div className="card" style={{background:'linear-gradient(135deg,rgba(30,58,138,0.10),rgba(132,204,22,0.08))',border:'1.5px solid rgba(30,58,138,0.28)',marginBottom:'20px'}}>
                  <div style={{display:'flex',gap:'14px',alignItems:'center',flexWrap:'wrap'}}>
                    <div style={{width:'50px',height:'50px',borderRadius:'14px',background:'rgba(30,58,138,0.12)',border:'1.5px solid rgba(30,58,138,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',flexShrink:0}}>🔬</div>
                    <div style={{flex:1}}>
                      <h3 style={{fontFamily:'Outfit,sans-serif',fontSize:'15px',fontWeight:900,color:'var(--text-primary)',marginBottom:'3px'}}>Ready for Precise ML Prediction?</h3>
                      <p style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:1.55,fontWeight:500,margin:0}}>Enter your lab values into our trained models — Random Forest · XGBoost · SVM — for clinical-grade prediction.</p>
                    </div>
                    <a href="/predict" style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'11px 18px',borderRadius:'12px',background:'linear-gradient(135deg,#1E3A8A,#84CC16)',color:'white',textDecoration:'none',fontWeight:800,fontSize:'13px',fontFamily:'Outfit,sans-serif',boxShadow:'0 4px 16px rgba(30,58,138,0.35)',flexShrink:0}}
                      onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform=''}>
                      Run ML Prediction <Zap size={14}/>
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  <button onClick={resetAll} className="btn btn-secondary">🔄 Start New Analysis</button>
                  <button onClick={()=>setStep(3)} className="btn btn-secondary">📄 Upload Different Report</button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
