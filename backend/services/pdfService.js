const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/* ─── Brand Palette — Royal Health ──────────────────── */
/* Primary: #1E3A8A (deep navy) | Accent: #84CC16 (lime) */
const C = {
  green:      '#84CC16',   // Royal lime accent
  teal:       '#2E4DAD',   // Royal mid-blue
  blue:       '#1E3A8A',   // Royal primary navy
  darkBg:     '#060D22',   // Deep royal navy header
  darkCard:   '#0F1F4A',   // Dark card bg
  white:      '#ffffff',
  offWhite:   '#F8FAFF',   // Royal off-white
  muted:      '#8BA4E0',   // Periwinkle muted
  text:       '#0F1F4A',   // Dark navy body text
  textLight:  '#2E4DAD',   // Mid-navy light text
  red:        '#ef4444',
  amber:      '#f59e0b',
  good:       '#84CC16',   // lime = good / positive
  border:     '#C4CAF8',   // Periwinkle border
  lightGray:  '#F8FAFF',   // Royal secondary bg
  midGray:    '#EEF2FF',   // Royal raised bg
};

function riskColor(level) {
  return { Low: C.good, Moderate: C.amber, High: C.red, 'Very High': '#dc2626' }[level] || C.muted;
}

const pdfService = {
  async generatePDFBuffer(prediction) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0, compress: true });
      const buffers = [];
      doc.on('data', c => buffers.push(c));
      doc.on('end',  () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W  = doc.page.width;
      const H  = doc.page.height;
      const ml = 36;
      const mr = 36;
      const cw = W - ml - mr;

      /* ── HEADER ──────────────────────────────────── */
      doc.rect(0, 0, W, 90).fill(C.darkBg);

      // Logo shield (drawn with primitives)
      const lx = ml, ly = 16, ls = 54;
      const lcx = lx + ls/2;
      // Shield using polygon points
      doc.polygon([lcx, ly+ls*0.06], [lx+ls*0.88, ly+ls*0.22], [lx+ls*0.88, ly+ls*0.53], [lcx, ly+ls*0.94], [lx+ls*0.12, ly+ls*0.53], [lx+ls*0.12, ly+ls*0.22])
         .fill(C.green);
      // Inner shield overlay (teal)
      doc.polygon([lcx, ly+ls*0.13], [lx+ls*0.80, ly+ls*0.26], [lx+ls*0.80, ly+ls*0.52], [lcx, ly+ls*0.88], [lx+ls*0.20, ly+ls*0.52], [lx+ls*0.20, ly+ls*0.26])
         .fillOpacity(0.4).fill(C.teal).fillOpacity(1);
      // Cross vertical
      doc.rect(lcx - ls*0.06, ly+ls*0.31, ls*0.12, ls*0.38).fill(C.white);
      // Cross horizontal
      doc.rect(lcx - ls*0.19, ly+ls*0.44, ls*0.38, ls*0.12).fill(C.white);
      // Pulse line
      const plY = ly + ls * 0.50;
      doc.moveTo(lx+ls*0.22,plY).lineTo(lx+ls*0.30,plY).lineTo(lx+ls*0.37,plY-ls*0.12)
         .lineTo(lx+ls*0.44,plY+ls*0.12).lineTo(lx+ls*0.50,plY-ls*0.09).lineTo(lx+ls*0.56,plY+ls*0.06)
         .lineTo(lx+ls*0.60,plY).lineTo(lx+ls*0.72,plY)
         .strokeColor('rgba(255,255,255,0.9)').lineWidth(ls*0.04).stroke();

      // Brand text
      doc.font('Helvetica-Bold').fontSize(22).fillColor(C.white).text('Health', ml+62, 22, {continued:true})
         .fillColor(C.green).text('Guard');
      doc.font('Helvetica').fontSize(9).fillColor(C.muted).text('AI-Powered Disease Prediction Platform', ml+62, 47);

      // Report meta (right)
      const mX = W - mr - 200;
      doc.font('Helvetica').fontSize(7.5).fillColor(C.muted).text('REPORT ID', mX, 20)
         .fillColor(C.green).font('Helvetica-Bold').fontSize(9).text(prediction.reportId || '—', mX, 30)
         .fillColor(C.muted).font('Helvetica').fontSize(7.5).text('GENERATED', mX, 50)
         .fillColor(C.white).fontSize(8).text(new Date(prediction.createdAt).toLocaleString('en-IN', {dateStyle:'medium',timeStyle:'short'}), mX, 60);

      // Accent bar
      doc.rect(0, 90, W, 3).fill(C.green);

      /* ── BODY ─────────────────────────────────────── */
      let Y = 100;
      const colGap = 12;
      const col1W  = cw * 0.44;
      const col2W  = cw - col1W - colGap;

      function card(x, y, w, h, r=7) {
        doc.roundedRect(x, y, w, h, r).fill(C.lightGray);
        doc.roundedRect(x, y, w, h, r).strokeColor(C.border).lineWidth(0.7).stroke();
      }
      function secTitle(text, x, y) {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.teal).text(text.toUpperCase(), x, y, {characterSpacing:0.8});
        doc.moveTo(x, y+12).lineTo(x+170, y+12).strokeColor(C.border).lineWidth(0.5).stroke();
        return y + 17;
      }
      function row(label, val, x, y, lw=62) {
        doc.font('Helvetica').fontSize(8).fillColor(C.muted).text(label+':', x, y, {width:lw});
        doc.font('Helvetica-Bold').fontSize(8).fillColor(C.text).text(String(val||'—'), x+lw+2, y);
      }

      /* ── Patient Info Card ── */
      const piH = 112;
      card(ml, Y, col1W, piH);
      let ty = secTitle('Patient Information', ml+10, Y+10);
      [['Name',prediction.patientName],['Age',prediction.patientAge?`${prediction.patientAge} yrs`:'—'],
       ['Gender',prediction.patientGender],['Disease',`${prediction.diseaseType||'—'} Disease`]
      ].forEach(([l,v])=>{ row(l,v,ml+10,ty); ty+=16; });

      /* ── Prediction Result Card ── */
      const pred   = prediction.result || {};
      const isPos  = pred.prediction === 'Positive';
      const rColor = isPos ? C.red : C.good;
      const rc     = riskColor(pred.riskLevel);

      card(ml+col1W+colGap, Y, col2W, piH);
      // Top colour strip
      doc.rect(ml+col1W+colGap, Y, col2W, 26).fill(isPos?'#fef2f2':'#f0fdf4');
      doc.roundedRect(ml+col1W+colGap, Y, col2W, 7, 7).fill(isPos?'#fef2f2':'#f0fdf4');
      doc.font('Helvetica-Bold').fontSize(8).fillColor(rColor)
         .text('PREDICTION RESULT', ml+col1W+colGap+10, Y+9);

      let ry = Y + 32;
      doc.font('Helvetica-Bold').fontSize(22).fillColor(rColor)
         .text(pred.prediction||'—', ml+col1W+colGap+10, ry);

      ry += 30;
      // Probability pill
      doc.roundedRect(ml+col1W+colGap+10, ry, 90, 17, 8).fill((isPos?'#fee2e2':'#dcfce7'));
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(rColor)
         .text(`${pred.probability||0}% Confidence`, ml+col1W+colGap+14, ry+4);
      // Risk pill
      doc.roundedRect(ml+col1W+colGap+106, ry, 68, 17, 8).fill(rc+'28');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(rc)
         .text(pred.riskLevel||'—', ml+col1W+colGap+110, ry+4);

      Y += piH + 10;

      /* ── Input Parameters Card ── */
      const params = Object.entries(prediction.inputParameters || {});
      const pCols  = 3;
      const pRows  = Math.ceil(params.length / pCols);
      const paramH = 22 + pRows * 14 + 8;

      card(ml, Y, cw, paramH);
      let pY = secTitle('Input Parameters', ml+10, Y+10);
      const pColW = (cw - 20) / pCols;

      params.forEach(([key, val], i) => {
        const col  = i % pCols;
        const r    = Math.floor(i / pCols);
        const px   = ml + 10 + col * pColW;
        const py   = pY + r * 14;
        const lbl  = key.replace(/([A-Z])/g,' $1').replace(/_/g,' ').trim();
        doc.font('Helvetica').fontSize(7).fillColor(C.muted).text(lbl+':', px, py, {width:pColW*0.50});
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.text).text(String(val), px+pColW*0.50, py, {width:pColW*0.48});
      });

      Y += paramH + 10;

      /* ── Recommendations + Risk Bar ── */
      const recs   = prediction.recommendations || [];
      const gaugeW = 120;
      const recW   = cw - gaugeW - colGap;
      const recH   = Math.max(72, 22 + recs.length * 13 + 8);

      // Recs card
      card(ml, Y, recW, recH);
      let recY = secTitle('Medical Recommendations', ml+10, Y+10);
      recs.forEach(rec => {
        doc.circle(ml+15, recY+4.5, 2.5).fill(C.green);
        doc.font('Helvetica').fontSize(7.5).fillColor(C.textLight)
           .text(rec, ml+22, recY, {width:recW-30, lineGap:-1});
        recY += 13;
      });

      // Risk gauge card
      card(ml+recW+colGap, Y, gaugeW, recH);
      let gY = secTitle('Risk Level', ml+recW+colGap+8, Y+10);
      const levels = ['Low','Moderate','High','Very High'];
      const lColors = [C.good, C.amber, C.red, '#dc2626'];
      levels.forEach((lv, i) => {
        const bY   = gY + i * 13;
        const maxW = gaugeW - 20;
        const bW   = maxW * (i+1) / 4;
        const isA  = pred.riskLevel === lv;
        doc.roundedRect(ml+recW+colGap+8, bY, bW, 9, 4).fill(isA ? lColors[i] : lColors[i]+'40');
        doc.font(isA?'Helvetica-Bold':'Helvetica').fontSize(7)
           .fillColor(isA?lColors[i]:C.muted).text(lv, ml+recW+colGap+8+bW+4, bY+1);
      });

      Y += recH + 10;

      /* ── Disclaimer ── */
      const dH = 30;
      doc.roundedRect(ml, Y, cw, dH, 5).fill('#fffbeb');
      doc.roundedRect(ml, Y, cw, dH, 5).strokeColor('#fcd34d').lineWidth(0.6).stroke();
      doc.font('Helvetica').fontSize(7).fillColor('#92400e')
         .text('⚠  DISCLAIMER: This AI-generated report is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making health decisions.', ml+10, Y+7, {width:cw-20});

      /* ── FOOTER ─────────────────────────────────────── */
      doc.rect(0, H-34, W, 34).fill(C.darkBg);
      doc.font('Helvetica').fontSize(7.5).fillColor(C.muted)
         .text(`HealthGuard AI Healthcare Platform  ·  ${new Date().getFullYear()}  ·  healthguard.com  ·  ${prediction.reportId||'—'}`,
               0, H-20, {width:W, align:'center'});

      doc.end();
    });
  },

  async generatePredictionPDF(prediction, user) {
    const uploadsDir = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `HealthGuard_${prediction.reportId}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    const buffer   = await this.generatePDFBuffer(prediction);
    fs.writeFileSync(filepath, buffer);
    return filepath;
  }
};

module.exports = pdfService;
