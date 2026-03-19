/**
 * ═══════════════════════════════════════════════════════════════════
 *  HealthGuard — Production-Grade Rule-Based Medical Report Engine
 *  POST /api/ocr/analyze-report
 *
 *  Architecture (5 modules, zero AI APIs):
 *    1. EXTRACTION  — pdf-parse (primary) → Tesseract.js (OCR fallback)
 *    2. VALIDATION  — scored keyword + unit + structure detection (0-100)
 *    3. PARSING     — multi-pattern regex engine with medical fuzzy aliases
 *    4. ANALYSIS    — threshold-based clinical rule engine (Heart/Liver/PD)
 *    5. REPORT GEN  — structured human-readable visual output
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const pdfParse  = require('pdf-parse');
const Tesseract = require('tesseract.js');

/* ═══════════════════════════════════════════════════════════════════
   MODULE 0 — MULTER CONFIGURATION
═══════════════════════════════════════════════════════════════════ */
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg', 'image/jpg',
  'image/png',  'image/webp',
  'image/tiff', 'image/bmp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIMES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Unsupported file type: ${file.mimetype}. Upload PDF or image (JPG/PNG/WEBP).`)),
});

/* ═══════════════════════════════════════════════════════════════════
   MODULE 1 — TEXT EXTRACTION
   PDF  → pdf-parse (fast, exact) → Tesseract fallback if < 50 chars
   Image → Tesseract OCR directly
═══════════════════════════════════════════════════════════════════ */

function normaliseText(raw) {
  return raw
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function runTesseract(buffer) {
  // Tesseract only handles raster images (JPEG, PNG, WEBP, BMP, TIFF).
  // Never call this with a PDF buffer — it will throw "Pdf reading is not supported".
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', { logger: () => {} });
    return text || '';
  } catch (e) {
    console.warn('[OCR] Tesseract failed:', e.message);
    return '';
  }
}

async function extractTextFromPDF(buffer) {
  // Primary: pdf-parse (works on clean, digitally-generated PDFs)
  try {
    const result = await pdfParse(buffer, { max: 0 });
    const text = result.text || '';
    if (normaliseText(text).length >= 50) {
      return text;
    }
    // pdf-parse succeeded but returned no/little text (scanned/image-only PDF)
    console.info('[OCR] PDF has no embedded text layer. Scanned PDFs require pre-conversion to image.');
    return '';
  } catch (e) {
    // pdf-parse failed (corrupt XRef, encrypted, malformed PDF, etc.)
    console.warn('[OCR] pdf-parse failed:', e.message);
    // DO NOT pass the PDF buffer to Tesseract — Tesseract is an image OCR engine
    // and will crash with "Pdf reading is not supported".
    // Instead, surface a clear message so the user knows to re-upload as an image.
    console.info('[OCR] Corrupt or unreadable PDF — Tesseract cannot process PDFs directly.');
    return '';
  }
}

async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    return normaliseText(await extractTextFromPDF(buffer));
  }
  // Image files (JPEG, PNG, WEBP, BMP, TIFF) → Tesseract directly
  return normaliseText(await runTesseract(buffer));
}

/* ═══════════════════════════════════════════════════════════════════
   MODULE 2 — VALIDATION ENGINE
   Scoring:
     Units     → up to 35 pts
     Keywords  → up to 35 pts
     Structure → up to 20 pts
     Length    → up to 10 pts
   Pass threshold: score >= 40
═══════════════════════════════════════════════════════════════════ */

const UNIT_PATTERNS = [
  /\d+\.?\d*\s*mg\/d[lL]/,
  /\d+\.?\d*\s*[gG]\/d[lL]/,
  /\d+\.?\d*\s*[uU]\/[lL]/,
  /\d+\.?\d*\s*[iI][uU]\/[lL]/,
  /\d+\.?\d*\s*mm[Hh]g/,
  /\d+\/\d+/,
  /\d+\.?\d*\s*%/,
  /\d+\.?\d*\s*[mM][eE][qQ]\/[lL]/,
  /\d+\.?\d*\s*[mM][mM][oO][lL]\/[lL]/,
  /\d+\.?\d*\s*[hH][zZ]/,
  /\d+\.?\d*\s*bp[mM]?/,
];

const LAB_KEYWORDS = {
  cholesterol:5, ldl:4, hdl:4, triglycerides:4,
  'blood pressure':5, bp:3, ecg:5, ekg:5,
  'heart rate':4, pulse:3, tachycardia:5, bradycardia:5,
  'st depression':5, oldpeak:5,
  bilirubin:5, alt:4, sgpt:4, ast:4, sgot:4,
  alp:4, 'alkaline phosphatase':5, albumin:4,
  'total protein':4, 'liver function':5, lft:5, hepat:4,
  jitter:4, shimmer:4, hnr:4, harmonic:4, mdvp:5,
  'voice frequency':4, tremor:4, bradykinesia:5,
  haemoglobin:4, hemoglobin:4, wbc:3, rbc:3,
  platelet:3, glucose:4, creatinine:4, urea:3,
  sodium:3, potassium:3, calcium:3, hba1c:5, tsh:4,
};

const STRUCTURAL_MARKERS = [
  /\b(result|report|patient|name|age|sex|gender|date|specimen|sample|lab(?:oratory)?|hospital|clinic|doctor|physician|reference\s*range|normal\s*range|test\s*name)\b/i,
  /\b(positive|negative|normal|abnormal|high|low|borderline|critical)\b/i,
  /\b(pathology|diagnostic|investigation|examination|analysis|panel)\b/i,
];

function isValidMedicalReport(text) {
  if (!text || text.length < 80) {
    return { valid:false, score:0, confidence:0, reportType:'Unknown', reasons:['File contains no readable text or is too short to analyse.'] };
  }
  const lower = text.toLowerCase();
  let score = 0;
  const matchedKeywords = [];

  const unitHits = UNIT_PATTERNS.filter(re => re.test(text)).length;
  score += Math.min(35, unitHits * 8);

  let kwScore = 0;
  for (const [kw, pts] of Object.entries(LAB_KEYWORDS)) {
    if (lower.includes(kw)) { kwScore += pts; matchedKeywords.push(kw); }
  }
  score += Math.min(35, kwScore);

  const structHits = STRUCTURAL_MARKERS.filter(re => re.test(text)).length;
  score += Math.min(20, structHits * 7);

  score += Math.min(10, Math.floor(text.length / 100));
  score = Math.min(100, score);

  const hasHeart  = ['cholesterol','ecg','ekg','blood pressure','heart rate','ldl','hdl'].some(k => matchedKeywords.includes(k));
  const hasLiver  = ['bilirubin','alt','ast','alp','albumin','sgpt','sgot','lft'].some(k => matchedKeywords.includes(k));
  const hasPark   = ['jitter','shimmer','hnr','mdvp','tremor','bradykinesia'].some(k => matchedKeywords.includes(k));

  let reportType = 'General Medical Document';
  if (hasHeart && hasLiver) reportType = 'Mixed Lab Panel (Cardiac + Hepatic)';
  else if (hasHeart)        reportType = 'Cardiac / Blood Panel';
  else if (hasLiver)        reportType = 'Liver Function Test (LFT)';
  else if (hasPark)         reportType = 'Neurological / Voice Analysis Report';
  else if (matchedKeywords.length > 0) reportType = 'General Pathology Report';

  const reasons = [];
  if (score < 40) {
    if (unitHits === 0)   reasons.push('No medical measurement units detected (mg/dL, mmHg, bpm, etc.)');
    if (kwScore < 5)      reasons.push(`Very few medical terms found (${matchedKeywords.length} term(s)). Ensure document is a proper lab/clinical report.`);
    reasons.push('Please upload a lab report, blood test, ECG, or clinical diagnostic document.');
  }

  return { valid: score >= 40, score, confidence: Math.min(95, score), reportType, matchedKeywords, reasons };
}

/* ═══════════════════════════════════════════════════════════════════
   MODULE 3 — REGEX PARSING ENGINE
   Multi-pattern approach: most-specific → generic per field
   Fuzzy aliases: ALT=SGPT, AST=SGOT, etc.
═══════════════════════════════════════════════════════════════════ */

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1] && m[1].trim()) return m[1].trim();
  }
  return null;
}

function extractAllMetrics(text) {
  const t = text;
  return {
    heart: {
      cholesterol:    firstMatch(t, [/(?:total\s+)?cholesterol\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mg\/d[lL])?)/i, /\bchol(?:esterol)?\b[^0-9]{0,10}([0-9]+\.?[0-9]*)/i]),
      bloodPressure:  firstMatch(t, [/(?:blood\s+pressure|b\.?\s*p\.?)\s*[:\-]?\s*([0-9]{2,3}\s*\/\s*[0-9]{2,3}\s*(?:mm\s*[hH][gG])?)/i, /\bBP\s*[:\-]?\s*([0-9]{2,3}\s*\/\s*[0-9]{2,3})/]),
      heartRate:      firstMatch(t, [/(?:heart\s+rate|pulse\s+rate|pulse|hr)\s*[:\-]?\s*([0-9]+\s*(?:bpm|beats?\/min|\/min)?)/i, /\bHR\s*[:\-]?\s*([0-9]+\s*(?:bpm)?)/]),
      fastingGlucose: firstMatch(t, [/(?:fasting\s+(?:blood\s+)?(?:glucose|sugar)|fbs|fbg)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mg\/d[lL])?)/i, /(?:blood\s+glucose|rbs)\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i]),
      ecgFindings:    firstMatch(t, [/(?:ecg|ekg|electrocardiogram)\s*(?:findings?|result|shows?)?\s*[:\-]?\s*([^\n]{5,100})/i, /(?:sinus\s+rhythm|cardiac\s+rhythm)\s*[:\-]?\s*([^\n]{4,80})/i]),
      stDepression:   firstMatch(t, [/(?:st[\s\-]?depression|oldpeak)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mm)?)/i]),
      ldl:            firstMatch(t, [/\b(?:ldl|low[\s\-]density\s+lipoprotein)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mg\/d[lL])?)/i]),
      hdl:            firstMatch(t, [/\b(?:hdl|high[\s\-]density\s+lipoprotein)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mg\/d[lL])?)/i]),
      triglycerides:  firstMatch(t, [/\b(?:triglycerides?|tgl|tg)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mg\/d[lL])?)/i]),
    },
    liver: {
      totalBilirubin:   firstMatch(t, [/total\s+bilirubin\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mg\/d[lL])?)/i, /\bt(?:otal)?[\s\.\-]?bil(?:irubin)?\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i]),
      directBilirubin:  firstMatch(t, [/direct\s+bilirubin\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:mg\/d[lL])?)/i, /conjugated\s+bilirubin\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i]),
      alt:              firstMatch(t, [/\b(?:alt|sgpt|alanine[\s\-]?aminotransferase|alamine[\s\-]?aminotransferase)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:[iIuU]\/[lL])?)/i]),
      ast:              firstMatch(t, [/\b(?:ast|sgot|aspartate[\s\-]?aminotransferase)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:[iIuU]\/[lL])?)/i]),
      alp:              firstMatch(t, [/\b(?:alp|alkaline[\s\-]?phospha(?:tase|se))\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:[iIuU]\/[lL])?)/i]),
      albumin:          firstMatch(t, [/\balbumin\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:g\/d[lL])?)/i]),
      totalProtein:     firstMatch(t, [/total\s+protein(?:s)?\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:g\/d[lL])?)/i, /protein\s*(?:,\s*total|total)\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i]),
      agRatio:          firstMatch(t, [/(?:a\/g|albumin\s*[\/\\]\s*globulin)\s*(?:ratio)?\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i, /\ba\s*:\s*g\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i]),
    },
    parkinson: {
      voiceJitter:   firstMatch(t, [/(?:mdvp\s*:\s*jitter|jitter\s*\(%\))\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*%?)/i, /\bjitter\b[^0-9]{0,15}([0-9]+\.?[0-9]*)/i]),
      voiceShimmer:  firstMatch(t, [/(?:mdvp\s*:\s*shimmer|shimmer)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:dB)?)/i]),
      hnr:           firstMatch(t, [/(?:hnr|harmonic[\s\-]to[\s\-]noise\s*ratio)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:dB)?)/i]),
      voiceFo:       firstMatch(t, [/(?:mdvp\s*:\s*fo|fo\s*\(hz\)|fundamental\s+freq(?:uency)?)\s*[:\-]?\s*([0-9]+\.?[0-9]*\s*(?:[hH][zZ])?)/i]),
      motorSymptoms: firstMatch(t, [/(?:motor\s+symptoms?|tremor|rigidity|bradykinesia)\s*[:\-]?\s*([^\n]{5,120})/i]),
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   MODULE 4 — RULE-BASED ANALYSIS ENGINE
   Clinical reference ranges (standard adult values)
═══════════════════════════════════════════════════════════════════ */

function toNum(val) {
  if (!val) return null;
  const n = parseFloat(String(val).replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
}

function analyzeHeart(metrics, symptoms) {
  const m   = metrics.heart;
  const syms = symptoms.filter(s => s.cat === 'Heart');
  const indicators = [], missing = [];
  let riskScore = 0, dataPoints = 0;

  // Cholesterol
  const cholNum = toNum(m.cholesterol);
  if (cholNum !== null) {
    dataPoints++;
    if (cholNum >= 240)      { riskScore += 35; indicators.push(`Cholesterol ${cholNum} mg/dL — High (≥240, risk threshold)`); }
    else if (cholNum >= 200) { riskScore += 18; indicators.push(`Cholesterol ${cholNum} mg/dL — Borderline high (200–239)`); }
    else                     { indicators.push(`Cholesterol ${cholNum} mg/dL — Optimal (<200)`); }
  } else missing.push('Total Cholesterol');

  // LDL
  const ldlNum = toNum(m.ldl);
  if (ldlNum !== null) {
    dataPoints++;
    if (ldlNum >= 160)      { riskScore += 25; indicators.push(`LDL ${ldlNum} mg/dL — High (≥160)`); }
    else if (ldlNum >= 130) { riskScore += 12; indicators.push(`LDL ${ldlNum} mg/dL — Borderline high`); }
    else                    { indicators.push(`LDL ${ldlNum} mg/dL — Acceptable`); }
  } else missing.push('LDL Cholesterol');

  // HDL
  const hdlNum = toNum(m.hdl);
  if (hdlNum !== null) {
    dataPoints++;
    if (hdlNum < 40)       { riskScore += 20; indicators.push(`HDL ${hdlNum} mg/dL — Low (<40, increased cardiovascular risk)`); }
    else if (hdlNum >= 60) { riskScore -= 5;  indicators.push(`HDL ${hdlNum} mg/dL — Protective (≥60)`); }
    else                   { indicators.push(`HDL ${hdlNum} mg/dL — Normal (40–59)`); }
  } else missing.push('HDL Cholesterol');

  // Triglycerides
  const tgNum = toNum(m.triglycerides);
  if (tgNum !== null) {
    dataPoints++;
    if (tgNum >= 200)      { riskScore += 20; indicators.push(`Triglycerides ${tgNum} mg/dL — High (≥200)`); }
    else if (tgNum >= 150) { riskScore += 10; indicators.push(`Triglycerides ${tgNum} mg/dL — Borderline (150–199)`); }
    else                   { indicators.push(`Triglycerides ${tgNum} mg/dL — Normal (<150)`); }
  } else missing.push('Triglycerides');

  // Blood Pressure
  const bpMatch = m.bloodPressure && m.bloodPressure.match(/([0-9]+)\s*\/\s*([0-9]+)/);
  if (bpMatch) {
    dataPoints++;
    const sys = parseInt(bpMatch[1]), dia = parseInt(bpMatch[2]);
    if (sys >= 140 || dia >= 90)      { riskScore += 30; indicators.push(`Blood Pressure ${m.bloodPressure} — Stage 2 Hypertension (≥140/90 mmHg)`); }
    else if (sys >= 130 || dia >= 80) { riskScore += 18; indicators.push(`Blood Pressure ${m.bloodPressure} — Stage 1 Hypertension`); }
    else if (sys >= 120)              { riskScore += 8;  indicators.push(`Blood Pressure ${m.bloodPressure} — Elevated`); }
    else                              { indicators.push(`Blood Pressure ${m.bloodPressure} — Normal`); }
  } else missing.push('Blood Pressure');

  // Heart Rate
  const hrNum = toNum(m.heartRate);
  if (hrNum !== null) {
    dataPoints++;
    if (hrNum > 100)     { riskScore += 15; indicators.push(`Heart Rate ${hrNum} bpm — Tachycardia (>100 bpm)`); }
    else if (hrNum < 60) { riskScore += 10; indicators.push(`Heart Rate ${hrNum} bpm — Bradycardia (<60 bpm)`); }
    else                 { indicators.push(`Heart Rate ${hrNum} bpm — Normal (60–100)`); }
  } else missing.push('Heart Rate');

  // Fasting Glucose
  const glcNum = toNum(m.fastingGlucose);
  if (glcNum !== null) {
    dataPoints++;
    if (glcNum >= 126)      { riskScore += 20; indicators.push(`Fasting Glucose ${glcNum} mg/dL — Diabetic range (≥126)`); }
    else if (glcNum >= 100) { riskScore += 10; indicators.push(`Fasting Glucose ${glcNum} mg/dL — Pre-diabetic (100–125)`); }
    else                    { indicators.push(`Fasting Glucose ${glcNum} mg/dL — Normal`); }
  } else missing.push('Fasting Blood Glucose');

  // ECG Findings
  if (m.ecgFindings) {
    dataPoints++;
    const ecgLower = m.ecgFindings.toLowerCase();
    if (/abnormal|ischemi|infarct|block|arrhythmia|fibrillation|flutter/.test(ecgLower)) {
      riskScore += 35; indicators.push(`ECG: ${m.ecgFindings} — Abnormal finding`);
    } else {
      indicators.push(`ECG: ${m.ecgFindings}`);
    }
  } else missing.push('ECG / Electrocardiogram');

  // ST Depression
  const stNum = toNum(m.stDepression);
  if (stNum !== null) {
    dataPoints++;
    if (stNum >= 2)      { riskScore += 30; indicators.push(`ST Depression ${stNum} mm — Significant (≥2 mm)`); }
    else if (stNum >= 1) { riskScore += 15; indicators.push(`ST Depression ${stNum} mm — Borderline`); }
    else                 { indicators.push(`ST Depression ${stNum} mm — Minimal`); }
  } else missing.push('ST Depression (Oldpeak)');

  // Symptoms
  syms.forEach(s => { riskScore += 5; indicators.push(`Reported symptom: ${s.sym}`); });

  riskScore = Math.max(0, Math.min(100, riskScore));
  const confidence = dataPoints === 0 ? (syms.length > 0 ? 30 : 10) : Math.min(90, 40 + dataPoints * 7);
  const riskLevel  = riskScore >= 65 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low';
  const probability = Math.min(95, Math.max(5, riskScore));

  const insight = dataPoints === 0 && syms.length === 0
    ? 'No cardiac data or symptoms available. A cardiac workup with lipid panel and ECG is recommended.'
    : riskLevel === 'High'
      ? `Significant cardiac risk factors detected across ${dataPoints} lab parameter(s). Immediate cardiology consultation required.`
      : riskLevel === 'Moderate'
        ? 'Borderline cardiac risk. Lifestyle modifications and physician review within 2–4 weeks advised.'
        : 'Cardiac parameters appear within acceptable range. Continue annual cardiovascular screenings.';

  if (indicators.length === 0) indicators.push('No significant cardiac indicators detected in this report');
  return { riskLevel, probability, confidence, keyIndicators: indicators, missingData: missing, clinicalInsight: insight };
}

function analyzeLiver(metrics, symptoms) {
  const m   = metrics.liver;
  const syms = symptoms.filter(s => s.cat === 'Liver');
  const indicators = [], missing = [];
  let riskScore = 0, dataPoints = 0;

  const tbNum = toNum(m.totalBilirubin);
  if (tbNum !== null) {
    dataPoints++;
    if (tbNum > 3.0)      { riskScore += 35; indicators.push(`Total Bilirubin ${tbNum} mg/dL — Severely elevated (>3.0, jaundice risk)`); }
    else if (tbNum > 1.2) { riskScore += 18; indicators.push(`Total Bilirubin ${tbNum} mg/dL — Elevated (>1.2)`); }
    else                  { indicators.push(`Total Bilirubin ${tbNum} mg/dL — Normal (0.2–1.2)`); }
  } else missing.push('Total Bilirubin');

  const dbNum = toNum(m.directBilirubin);
  if (dbNum !== null) {
    dataPoints++;
    if (dbNum > 0.3) { riskScore += 15; indicators.push(`Direct Bilirubin ${dbNum} mg/dL — Elevated (>0.3)`); }
    else             { indicators.push(`Direct Bilirubin ${dbNum} mg/dL — Normal`); }
  } else missing.push('Direct Bilirubin');

  const altNum = toNum(m.alt);
  if (altNum !== null) {
    dataPoints++;
    if (altNum > 200)     { riskScore += 40; indicators.push(`ALT (SGPT) ${altNum} U/L — Severely elevated (>200, significant liver injury)`); }
    else if (altNum > 56) { riskScore += 25; indicators.push(`ALT (SGPT) ${altNum} U/L — Elevated (>56)`); }
    else                  { indicators.push(`ALT (SGPT) ${altNum} U/L — Normal (7–56)`); }
  } else missing.push('ALT (SGPT)');

  const astNum = toNum(m.ast);
  if (astNum !== null) {
    dataPoints++;
    if (astNum > 200)     { riskScore += 40; indicators.push(`AST (SGOT) ${astNum} U/L — Severely elevated (>200)`); }
    else if (astNum > 40) { riskScore += 25; indicators.push(`AST (SGOT) ${astNum} U/L — Elevated (>40)`); }
    else                  { indicators.push(`AST (SGOT) ${astNum} U/L — Normal (10–40)`); }
  } else missing.push('AST (SGOT)');

  if (altNum && astNum && altNum > 0) {
    const ratio = astNum / altNum;
    if (ratio > 2) { riskScore += 15; indicators.push(`AST/ALT ratio ${ratio.toFixed(1)} — Elevated (>2.0 suggests alcoholic liver disease)`); }
  }

  const alpNum = toNum(m.alp);
  if (alpNum !== null) {
    dataPoints++;
    if (alpNum > 300)      { riskScore += 30; indicators.push(`ALP ${alpNum} U/L — Severely elevated (>300)`); }
    else if (alpNum > 147) { riskScore += 15; indicators.push(`ALP ${alpNum} U/L — Elevated (>147)`); }
    else                   { indicators.push(`ALP ${alpNum} U/L — Normal (44–147)`); }
  } else missing.push('ALP (Alkaline Phosphatase)');

  const albNum = toNum(m.albumin);
  if (albNum !== null) {
    dataPoints++;
    if (albNum < 2.5)      { riskScore += 30; indicators.push(`Albumin ${albNum} g/dL — Severely low (<2.5, poor synthetic function)`); }
    else if (albNum < 3.5) { riskScore += 18; indicators.push(`Albumin ${albNum} g/dL — Low (<3.5)`); }
    else                   { indicators.push(`Albumin ${albNum} g/dL — Normal (3.5–5.0)`); }
  } else missing.push('Serum Albumin');

  const tpNum = toNum(m.totalProtein);
  if (tpNum !== null) {
    dataPoints++;
    if (tpNum < 5.5)      { riskScore += 15; indicators.push(`Total Protein ${tpNum} g/dL — Low (<5.5)`); }
    else if (tpNum > 8.5) { riskScore += 8;  indicators.push(`Total Protein ${tpNum} g/dL — Elevated (>8.5)`); }
    else                  { indicators.push(`Total Protein ${tpNum} g/dL — Normal (6.0–8.3)`); }
  } else missing.push('Total Protein');

  const agNum = toNum(m.agRatio);
  if (agNum !== null) {
    dataPoints++;
    if (agNum < 1.0) { riskScore += 20; indicators.push(`A/G Ratio ${agNum} — Low (<1.0, possible liver/kidney disease)`); }
    else             { indicators.push(`A/G Ratio ${agNum} — Normal (1.0–2.5)`); }
  } else missing.push('A/G Ratio');

  syms.forEach(s => { riskScore += 5; indicators.push(`Reported symptom: ${s.sym}`); });

  riskScore = Math.max(0, Math.min(100, riskScore));
  const confidence = dataPoints === 0 ? (syms.length > 0 ? 30 : 10) : Math.min(90, 40 + dataPoints * 7);
  const riskLevel  = riskScore >= 65 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low';
  const probability = Math.min(95, Math.max(5, riskScore));

  const insight = dataPoints === 0 && syms.length === 0
    ? 'No hepatic lab data available. A Liver Function Test (LFT) is recommended.'
    : riskLevel === 'High'
      ? `Significantly elevated liver enzymes and/or bilirubin detected across ${dataPoints} parameter(s). Urgent hepatology consultation required.`
      : riskLevel === 'Moderate'
        ? 'Some liver parameters outside normal range. Repeat LFT in 4–6 weeks. Avoid alcohol and hepatotoxic medications.'
        : 'Liver function parameters within normal limits. Maintain a liver-healthy lifestyle.';

  if (indicators.length === 0) indicators.push('No significant hepatic indicators detected');
  return { riskLevel, probability, confidence, keyIndicators: indicators, missingData: missing, clinicalInsight: insight };
}

function analyzeParkinson(metrics, symptoms) {
  const m    = metrics.parkinson;
  const syms = symptoms.filter(s => s.cat === 'Parkinson');
  const indicators = [], missing = [];
  let riskScore = 0, dataPoints = 0;

  const jNum = toNum(m.voiceJitter);
  if (jNum !== null) {
    dataPoints++;
    if (jNum >= 2.0)       { riskScore += 40; indicators.push(`Voice Jitter ${jNum}% — Severely abnormal (≥2.0%)`); }
    else if (jNum >= 1.04) { riskScore += 25; indicators.push(`Voice Jitter ${jNum}% — Abnormal (≥1.04% threshold)`); }
    else                   { indicators.push(`Voice Jitter ${jNum}% — Normal (<1.04%)`); }
  } else missing.push('Voice Jitter (MDVP:Jitter%)');

  const shNum = toNum(m.voiceShimmer);
  if (shNum !== null) {
    dataPoints++;
    if (shNum >= 6.0)      { riskScore += 40; indicators.push(`Voice Shimmer ${shNum} dB — Severely abnormal (≥6.0)`); }
    else if (shNum >= 3.3) { riskScore += 25; indicators.push(`Voice Shimmer ${shNum} dB — Abnormal (≥3.3 threshold)`); }
    else                   { indicators.push(`Voice Shimmer ${shNum} dB — Normal (<3.3)`); }
  } else missing.push('Voice Shimmer (MDVP:Shimmer)');

  const hnrNum = toNum(m.hnr);
  if (hnrNum !== null) {
    dataPoints++;
    if (hnrNum <= 10)      { riskScore += 35; indicators.push(`HNR ${hnrNum} dB — Severely low (≤10 dB)`); }
    else if (hnrNum <= 20) { riskScore += 18; indicators.push(`HNR ${hnrNum} dB — Low (≤20 dB)`); }
    else                   { indicators.push(`HNR ${hnrNum} dB — Normal (>20 dB)`); }
  } else missing.push('HNR (Harmonic-to-Noise Ratio)');

  const foNum = toNum(m.voiceFo);
  if (foNum !== null) {
    dataPoints++;
    if (foNum < 85 || foNum > 300) { riskScore += 20; indicators.push(`Voice Frequency ${foNum} Hz — Outside normal range (85–255 Hz)`); }
    else                            { indicators.push(`Voice Frequency ${foNum} Hz — Normal range`); }
  } else missing.push('Fundamental Voice Frequency (Fo)');

  if (m.motorSymptoms) {
    dataPoints++;
    indicators.push(`Motor finding: ${m.motorSymptoms}`);
    riskScore += 20;
  } else missing.push('Motor symptom documentation');

  syms.forEach(s => { riskScore += 6; indicators.push(`Reported symptom: ${s.sym}`); });

  riskScore = Math.max(0, Math.min(100, riskScore));
  const confidence = dataPoints === 0 ? (syms.length > 0 ? 30 : 10) : Math.min(90, 40 + dataPoints * 10);
  const riskLevel  = riskScore >= 65 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low';
  const probability = Math.min(95, Math.max(5, riskScore));

  const insight = dataPoints === 0 && syms.length === 0
    ? "No Parkinson's voice biomarkers or symptoms detected. A formal neurological evaluation is required."
    : riskLevel === 'High'
      ? "Multiple abnormal voice biomarkers consistent with significant vocal impairment. Immediate neurologist referral strongly recommended."
      : riskLevel === 'Moderate'
        ? "Some voice biomarker irregularities noted. Neurological follow-up and comprehensive voice analysis advised."
        : "Voice biomarkers within normal range. Continue routine neurological monitoring.";

  if (indicators.length === 0) indicators.push('No significant neurological indicators detected');
  return { riskLevel, probability, confidence, keyIndicators: indicators, missingData: missing, clinicalInsight: insight };
}

function computeOverall(heart, liver, parkinson) {
  const scores = [heart, liver, parkinson];
  const risks  = { Low:1, Moderate:2, High:3 };
  const maxRisk = scores.reduce((a, b) => risks[a.riskLevel] >= risks[b.riskLevel] ? a : b);
  const moderateCount = scores.filter(s => s.riskLevel === 'Moderate').length;
  let overallRisk = maxRisk.riskLevel;
  if (overallRisk === 'Moderate' && moderateCount >= 2) overallRisk = 'High';

  const byProb = [...scores].sort((a, b) => b.probability - a.probability);
  const labels = ['Heart Disease', 'Liver Disease', "Parkinson's Disease"];
  const primaryConcern = labels[scores.indexOf(byProb[0])];
  const urgency = overallRisk === 'High' ? 'urgent' : overallRisk === 'Moderate' ? 'soon' : 'routine';

  const parts = [];
  if (heart.probability > 30)     parts.push(`cardiac risk (${heart.probability}%)`);
  if (liver.probability > 30)     parts.push(`hepatic risk (${liver.probability}%)`);
  if (parkinson.probability > 30) parts.push(`neurological risk (${parkinson.probability}%)`);

  const summary = parts.length > 0
    ? `Analysis identified ${parts.join(', ')}. Primary concern is ${primaryConcern}. ${urgency === 'urgent' ? 'Immediate medical attention is required.' : urgency === 'soon' ? 'Medical consultation recommended within 1–2 weeks.' : 'Routine follow-up and healthy lifestyle maintenance advised.'}`
    : 'No significant risk factors identified across analysed parameters. Maintain regular health screenings.';

  return { risk: overallRisk, primaryConcern, urgency, summary };
}

function buildRecommendations(heart, liver, parkinson) {
  const recs = [];
  if (heart.riskLevel === 'High') {
    recs.push('Consult a Cardiologist urgently — schedule ECG, lipid panel, and echocardiogram.');
    recs.push('Adopt a heart-healthy diet: reduce saturated fats, sodium, and processed foods.');
    recs.push('Eliminate smoking and alcohol; begin supervised cardiac rehabilitation if advised.');
  } else if (heart.riskLevel === 'Moderate') {
    recs.push('Schedule a cardiology review with complete lipid profile and ECG within 2 weeks.');
    recs.push('Engage in 150 minutes of moderate aerobic exercise weekly; monitor blood pressure daily.');
  } else {
    recs.push('Continue annual cardiovascular screenings; maintain healthy weight, BP, and cholesterol.');
  }
  if (liver.riskLevel === 'High') {
    recs.push('Consult a Hepatologist urgently — elevated liver enzymes indicate significant hepatic stress.');
    recs.push('Avoid all alcohol and hepatotoxic drugs (high-dose paracetamol, NSAIDs) immediately.');
  } else if (liver.riskLevel === 'Moderate') {
    recs.push('Repeat Liver Function Test (LFT) in 4–6 weeks; monitor ALT, AST, and bilirubin trends.');
    recs.push('Follow a liver-protective diet: leafy greens, berries, olive oil; limit alcohol.');
  } else {
    recs.push('Maintain liver health — limit alcohol, stay hydrated, avoid unnecessary medications.');
  }
  if (parkinson.riskLevel === 'High') {
    recs.push('Seek urgent neurologist referral — voice biomarkers suggest significant neurological changes.');
  } else if (parkinson.riskLevel === 'Moderate') {
    recs.push('Schedule neurological evaluation — some voice parameters outside normal range.');
  } else {
    recs.push("Maintain brain health: regular exercise, cognitive activities, quality sleep.");
  }
  recs.push('Use the HealthGuard ML Prediction Tool with your exact lab values for a clinical-grade risk score.');
  return recs;
}

function buildNextStep(overall) {
  if (overall.urgency === 'urgent') return `Visit a hospital or specialist clinic within 24–48 hours for urgent ${overall.primaryConcern} evaluation.`;
  if (overall.urgency === 'soon')   return `Book an appointment with the appropriate specialist for ${overall.primaryConcern} within 1–2 weeks.`;
  return 'Schedule a routine health check-up within 3 months. Upload updated lab reports for ongoing monitoring.';
}

/* ═══════════════════════════════════════════════════════════════════
   MODULE 5 — VISUAL REPORT GENERATOR
   Produces structured text consumed by parseReport() on frontend
   AND a standalone human-readable medical report
═══════════════════════════════════════════════════════════════════ */

function riskEmoji(level) { return level === 'High' ? '🔴' : level === 'Moderate' ? '🟡' : '🟢'; }
function na(val)          { return val || 'Not Available'; }

function generateVisualReport(validation, metrics, heart, liver, parkinson, overall, recommendations, nextStep, patientCtx) {
  const m = metrics;
  const urgencyLabel = overall.urgency === 'urgent'
    ? '🚨 Urgent — Seek immediate medical attention'
    : overall.urgency === 'soon'
      ? '⚠️  Soon — Consult a doctor within 1–2 weeks'
      : '✅  Routine — Regular follow-up recommended';

  return `CLASSIFICATION: VALID
CONFIDENCE: ${validation.confidence}%
REPORT TYPE: ${validation.reportType}

════════════════════════════════════════════════
✅ Medical Report Verified
   Confidence: ${validation.confidence}%
   Report Type: ${validation.reportType}
════════════════════════════════════════════════
${patientCtx ? `\n👤 Patient Context:\n${patientCtx}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧾 Extracted Medical Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❤️  Heart Metrics:
- Cholesterol: ${na(m.heart.cholesterol)}
- Blood Pressure: ${na(m.heart.bloodPressure)}
- Heart Rate: ${na(m.heart.heartRate)}
- Fasting Blood Sugar: ${na(m.heart.fastingGlucose)}
- ECG Findings: ${na(m.heart.ecgFindings)}
- ST Depression (Oldpeak): ${na(m.heart.stDepression)}
- LDL Cholesterol: ${na(m.heart.ldl)}
- HDL Cholesterol: ${na(m.heart.hdl)}
- Triglycerides: ${na(m.heart.triglycerides)}

🟡 Liver Metrics:
- Total Bilirubin: ${na(m.liver.totalBilirubin)}
- Direct Bilirubin: ${na(m.liver.directBilirubin)}
- ALT (SGPT): ${na(m.liver.alt)}
- AST (SGOT): ${na(m.liver.ast)}
- ALP: ${na(m.liver.alp)}
- Albumin: ${na(m.liver.albumin)}
- Total Protein: ${na(m.liver.totalProtein)}
- A/G Ratio: ${na(m.liver.agRatio)}

🧠 Parkinson Indicators:
- Voice Jitter: ${na(m.parkinson.voiceJitter)}
- Voice Shimmer: ${na(m.parkinson.voiceShimmer)}
- HNR (Harmonic-to-Noise Ratio): ${na(m.parkinson.hnr)}
- Voice Frequency (Fo): ${na(m.parkinson.voiceFo)}
- Motor Symptoms Noted: ${na(m.parkinson.motorSymptoms)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Disease Risk Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HEART DISEASE ANALYSIS:
RISK LEVEL: ${heart.riskLevel}
PROBABILITY: ${heart.probability}
CONFIDENCE: ${heart.confidence}
KEY INDICATORS:
${heart.keyIndicators.map(i => `- ${i}`).join('\n')}
MISSING DATA:
${heart.missingData.length > 0 ? heart.missingData.map(d => `- ${d}`).join('\n') : '- Sufficient cardiac data available'}
CLINICAL INSIGHT: ${heart.clinicalInsight}

❤️  Heart Disease   Risk: ${riskEmoji(heart.riskLevel)} ${heart.riskLevel}   Probability: ${heart.probability}%
Key Indicators:
${heart.keyIndicators.slice(0,4).map(i => `  • ${i}`).join('\n')}
${heart.missingData.length > 0 ? `Missing Data:\n${heart.missingData.slice(0,3).map(d => `  • ${d}`).join('\n')}` : ''}
Clinical Insight:
  ${heart.clinicalInsight}

LIVER DISEASE ANALYSIS:
RISK LEVEL: ${liver.riskLevel}
PROBABILITY: ${liver.probability}
CONFIDENCE: ${liver.confidence}
KEY INDICATORS:
${liver.keyIndicators.map(i => `- ${i}`).join('\n')}
MISSING DATA:
${liver.missingData.length > 0 ? liver.missingData.map(d => `- ${d}`).join('\n') : '- Sufficient hepatic data available'}
CLINICAL INSIGHT: ${liver.clinicalInsight}

🟡 Liver Disease   Risk: ${riskEmoji(liver.riskLevel)} ${liver.riskLevel}   Probability: ${liver.probability}%
Key Indicators:
${liver.keyIndicators.slice(0,4).map(i => `  • ${i}`).join('\n')}
${liver.missingData.length > 0 ? `Missing Data:\n${liver.missingData.slice(0,3).map(d => `  • ${d}`).join('\n')}` : ''}
Clinical Insight:
  ${liver.clinicalInsight}

PARKINSON DISEASE ANALYSIS:
RISK LEVEL: ${parkinson.riskLevel}
PROBABILITY: ${parkinson.probability}
CONFIDENCE: ${parkinson.confidence}
KEY INDICATORS:
${parkinson.keyIndicators.map(i => `- ${i}`).join('\n')}
MISSING DATA:
${parkinson.missingData.length > 0 ? parkinson.missingData.map(d => `- ${d}`).join('\n') : '- Sufficient neurological data available'}
CLINICAL INSIGHT: ${parkinson.clinicalInsight}

🧠 Parkinson's   Risk: ${riskEmoji(parkinson.riskLevel)} ${parkinson.riskLevel}   Probability: ${parkinson.probability}%
Key Indicators:
${parkinson.keyIndicators.slice(0,4).map(i => `  • ${i}`).join('\n')}
${parkinson.missingData.length > 0 ? `Missing Data:\n${parkinson.missingData.slice(0,3).map(d => `  • ${d}`).join('\n')}` : ''}
Clinical Insight:
  ${parkinson.clinicalInsight}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Overall Health Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERALL RISK: ${overall.risk}
OVERALL ICON: ${riskEmoji(overall.risk)}
PRIMARY CONCERN: ${overall.primaryConcern}
URGENCY: ${overall.urgency}
PATIENT SUMMARY: ${overall.summary}

Overall Risk: ${riskEmoji(overall.risk)} ${overall.risk}
Primary Concern: ${overall.primaryConcern}
Urgency: ${urgencyLabel}
Patient Summary:
  ${overall.summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Clinical Recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${recommendations.map((r, i) => `RECOMMENDATION ${i + 1}: ${r}`).join('\n')}

${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Next Step
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEP: ${nextStep}

${nextStep}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Medical Disclaimer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This analysis is generated by a rule-based system for informational purposes only.
It does NOT constitute medical advice or clinical diagnosis.
Always consult a qualified healthcare professional for medical decisions.
`;
}

function generateInvalidReport(validation) {
  return `CLASSIFICATION: INVALID
CONFIDENCE: ${validation.score}%
REASON: ${validation.reasons[0] || 'This file does not appear to be a valid medical report.'}
WHAT TO DO: Upload a proper lab report, blood test, ECG, or clinical diagnostic document.
STOP_HERE

════════════════════════════════════════════════
❌ Invalid Report Detected   Confidence: ${validation.score}%
════════════════════════════════════════════════

Reason:
${validation.reasons.map(r => `  • ${r}`).join('\n')}

What to do:
  • Upload a proper lab report, blood test result, or ECG report
  • Ensure the document contains medical values (mg/dL, mmHg, U/L, etc.)
  • Supported formats: PDF, JPG, PNG, WEBP
  • For best results, use a digitally-generated lab PDF
`;
}

/* ═══════════════════════════════════════════════════════════════════
   ROUTES
═══════════════════════════════════════════════════════════════════ */
router.post('/analyze-report', upload.single('file'), async (req, res) => {
  try {
    let symptoms = [];
    try { symptoms = JSON.parse(req.body.symptoms || '[]'); } catch (_) {}
    const patientCtx = req.body.patientCtx || '';

    let rawText = '';
    if (req.file) {
      rawText = await extractText(req.file.buffer, req.file.mimetype);
    }

    // ── Corrupt / unreadable PDF ─────────────────────────────────────────────────
    // pdf-parse failed OR returned no text. Tesseract cannot process PDFs
    // (it crashes with "Pdf reading is not supported"), so surface a clear message.
    if (req.file && req.file.mimetype === 'application/pdf' && !rawText.trim()) {
      const unreadableReport = `CLASSIFICATION: INVALID
CONFIDENCE: 0%
REASON: Could not extract text from this PDF.
WHAT TO DO: This PDF may be corrupt, password-protected, or image-only. Please export each page as a JPG or PNG and re-upload.
STOP_HERE

════════════════════════════════════════════════
❌ PDF Unreadable — No Text Could Be Extracted
════════════════════════════════════════════════

Possible reasons:
  • The PDF has a corrupt or invalid internal structure (bad XRef)
  • The PDF is password-protected or encrypted
  • The PDF was created by scanning a paper report (no text layer)

What to do:
  • Open the PDF in any viewer (Adobe Reader, Chrome, etc.)
  • Take a screenshot or export as JPG / PNG
  • Re-upload that image — the OCR engine will read it correctly
  • Or request a digitally-generated PDF from your lab / hospital
`;
      return res.json({
        success: true, hasFile: true, extractedText: '',
        structuredText: unreadableReport, classification: 'INVALID', confidence: 0,
        message: 'Could not read this PDF. Please re-upload as a JPG or PNG image.',
      });
    }

    // ── Symptom-only path (no file uploaded, or image text extraction failed) ──
    if (!req.file || !rawText.trim()) {
      const fakeVal = { valid:true, score:45, confidence:45, reportType:'Symptom-Only Assessment', matchedKeywords:[], reasons:[] };
      const emptyM  = {
        heart:     { cholesterol:null, bloodPressure:null, heartRate:null, fastingGlucose:null, ecgFindings:null, stDepression:null, ldl:null, hdl:null, triglycerides:null },
        liver:     { totalBilirubin:null, directBilirubin:null, alt:null, ast:null, alp:null, albumin:null, totalProtein:null, agRatio:null },
        parkinson: { voiceJitter:null, voiceShimmer:null, hnr:null, voiceFo:null, motorSymptoms:null },
      };
      const h = analyzeHeart(emptyM, symptoms);
      const l = analyzeLiver(emptyM, symptoms);
      const p = analyzeParkinson(emptyM, symptoms);
      const o = computeOverall(h, l, p);
      const r = buildRecommendations(h, l, p);
      const n = buildNextStep(o);
      const report = generateVisualReport(fakeVal, emptyM, h, l, p, o, r, n, patientCtx);
      return res.json({ success:true, hasFile:false, structuredText:report, classification:'VALID', confidence:45, message:'Symptom-only assessment generated.', analysis:{heart:h,liver:l,parkinson:p,overall:o,recommendations:r,nextStep:n,metrics:emptyM} });
    }

    const validation = isValidMedicalReport(rawText);
    if (!validation.valid) {
      return res.json({ success:true, hasFile:true, extractedText:rawText, structuredText:generateInvalidReport(validation), classification:'INVALID', confidence:validation.score, message:validation.reasons[0] });
    }

    const metrics   = extractAllMetrics(rawText);
    const heart     = analyzeHeart(metrics, symptoms);
    const liver     = analyzeLiver(metrics, symptoms);
    const parkinson = analyzeParkinson(metrics, symptoms);
    const overall   = computeOverall(heart, liver, parkinson);
    const recs      = buildRecommendations(heart, liver, parkinson);
    const nextStep  = buildNextStep(overall);
    const report    = generateVisualReport(validation, metrics, heart, liver, parkinson, overall, recs, nextStep, patientCtx);

    return res.json({
      success:true, hasFile:true, extractedText:rawText, structuredText:report,
      classification:'VALID', confidence:validation.confidence, reportType:validation.reportType,
      message:`Analysis complete — ${validation.reportType}`,
      analysis:{ heart, liver, parkinson, overall, recommendations:recs, nextStep, metrics },
    });

  } catch (err) {
    console.error('[OCR] error:', err);
    return res.status(500).json({ success:false, message:`Analysis failed: ${err.message}` });
  }
});

router.get('/health', (_req, res) => {
  res.json({ success:true, message:'Rule-based medical analysis engine is running', version:'2.0.0', engines:['pdf-parse','tesseract.js'], modules:['extraction','validation','parsing','analysis','report-generation'] });
});

module.exports = router;
