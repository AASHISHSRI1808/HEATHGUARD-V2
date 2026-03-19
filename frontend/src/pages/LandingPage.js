import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowRight, CheckCircle, Shield, Zap, FileText, Calendar } from 'lucide-react';

export default function LandingPage() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCount(c => c < 95 ? c + 1 : c), 18);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '66px', position: 'relative', overflow: 'hidden' }}>
        {/* Mesh background */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 18% 40%, var(--accent-soft) 0%, transparent 55%), radial-gradient(ellipse at 82% 25%, rgba(30,58,138,0.08) 0%, transparent 50%), radial-gradient(ellipse at 55% 88%, rgba(132,204,22,0.06) 0%, transparent 52%)` }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)', backgroundSize: '36px 36px', maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 72%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 10%, transparent 72%)', opacity: 0.6 }} />

        {/* Floating health icons */}
        {[
          { emoji:'❤️', top:'18%', left:'8%',  size:'42px', delay:'0s' },
          { emoji:'🧬', top:'25%', right:'9%', size:'38px', delay:'0.7s' },
          { emoji:'🔬', top:'72%', left:'6%',  size:'34px', delay:'1.2s' },
          { emoji:'🧠', top:'68%', right:'7%', size:'40px', delay:'0.4s' },
          { emoji:'💊', top:'12%', left:'30%', size:'28px', delay:'0.9s' },
          { emoji:'🩺', top:'80%', right:'25%',size:'30px', delay:'1.5s' },
        ].map((f,i) => (
          <div key={i} style={{ position:'absolute', top:f.top, left:f.left, right:f.right, fontSize:f.size, opacity:0.18, animation:`float 4s ease-in-out ${f.delay} infinite`, pointerEvents:'none', userSelect:'none' }}>
            {f.emoji}
          </div>
        ))}

        <div style={{ textAlign: 'center', maxWidth: '880px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          {/* Live badge */}
          <div className="animate-fadeInUp" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', border: '1.5px solid var(--accent-glow)', borderRadius: '30px', padding: '8px 20px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 800 }}>ML-Powered Disease Prediction · Free · Instant Results</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fadeInUp stagger-1" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(38px, 6.5vw, 80px)', fontWeight: 900, lineHeight: 1.05, marginBottom: '22px', color: 'var(--text-primary)', letterSpacing: '-2px' }}>
            Predict Disease
            <br />
            <span className="gradient-text">Before It Strikes.</span>
          </h1>

          <p className="animate-fadeInUp stagger-2" style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 44px', lineHeight: 1.8, fontWeight: 500 }}>
            Advanced ML models for <strong style={{ color: 'var(--rose-500)' }}>Heart</strong>, <strong style={{ color: 'var(--amber-500)' }}>Liver</strong>, and <strong style={{ color: 'var(--violet-500)' }}>Parkinson's</strong> detection. Instant PDF reports. Connect with top specialists.
          </p>

          <div className="animate-fadeInUp stagger-3" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '56px' }}>
            <Link to="/register" className="btn btn-primary btn-xl">Start Free Analysis <ArrowRight size={18} /></Link>
            <Link to="/register" className="btn btn-secondary btn-xl">Join as Doctor 👨‍⚕️</Link>
          </div>

          {/* Stats strip */}
          <div className="animate-fadeInUp stagger-4" style={{ display: 'flex', background: 'var(--bg-surface)', border: '1.5px solid var(--border-subtle)', borderRadius: '22px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            {[
              { val: '3',          label: 'ML Models',   emoji: '🤖', color: 'var(--teal-500)'   },
              { val: `${count}%+`, label: 'Accuracy',    emoji: '🎯', color: 'var(--green-500)'  },
              { val: 'Instant',    label: 'PDF Reports', emoji: '📄', color: 'var(--blue-500)'   },
              { val: '100%',       label: 'Secure',      emoji: '🔒', color: 'var(--violet-500)' },
            ].map((s, i, a) => (
              <div key={i} style={{ flex: '1 1 100px', padding: '22px 12px', textAlign: 'center', borderRight: i < a.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{s.emoji}</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 900, color: s.color, marginBottom: '2px', letterSpacing: '-0.5px' }}>{s.val}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="section-label">Simple Process</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              3 Steps to Your Health Report
            </h2>
          </div>
          <div className="grid-3" style={{ gap: '24px' }}>
            {[
              { n:'01', emoji:'📝', title:'Enter Clinical Data',   desc:'Input your health parameters — blood pressure, cholesterol, liver enzymes, voice biomarkers. Guided form for each disease type.', color:'var(--cyan-500)',   soft:'rgba(30,58,138,0.1)',   border:'rgba(30,58,138,0.2)'   },
              { n:'02', emoji:'🤖', title:'AI Analysis Runs',      desc:'Trained ML models — Random Forest, XGBoost, SVM — process your data instantly to generate a precise disease risk prediction.', color:'var(--accent)',      soft:'var(--accent-soft)',    border:'var(--accent-glow)'    },
              { n:'03', emoji:'📊', title:'Get Report & Act',      desc:'Download your PDF report with risk scores, health recommendations, and instantly book a specialist consultation.', color:'var(--violet-500)', soft:'rgba(124,58,237,0.1)', border:'rgba(124,58,237,0.2)' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-base)', border: `1.5px solid var(--border-subtle)`, borderRadius: '22px', padding: '32px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s', cursor: 'default' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 50px ${s.soft}`; }}
                onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ position: 'absolute', top: '16px', right: '20px', fontFamily: 'Outfit, sans-serif', fontSize: '64px', fontWeight: 900, color: s.soft, lineHeight: 1 }}>{s.n}</div>
                <div style={{ width: '64px', height: '64px', background: s.soft, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px', border: `1.5px solid ${s.border}` }}>{s.emoji}</div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.3px' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7, fontWeight: 500 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disease Models ────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="section-label">ML Models</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              3 Disease Predictions
            </h2>
          </div>
          <div className="grid-3" style={{ gap: '24px' }}>
            {[
              { emoji:'❤️', name:'Heart Disease',  model:'Random Forest', params:13, acc:'93%', color:'var(--rose-500)',  soft:'rgba(225,29,72,0.08)',  border:'rgba(225,29,72,0.18)',  desc:'Cardiovascular risk using BP, cholesterol, ECG, chest pain patterns & more.' },
              { emoji:'🫀', name:'Liver Disease',  model:'XGBoost',       params:10, acc:'91%', color:'var(--amber-500)', soft:'rgba(217,119,6,0.08)',  border:'rgba(217,119,6,0.18)',  desc:'Hepatic health through bilirubin, ALT, AST & other liver function biomarkers.' },
              { emoji:'🧠', name:"Parkinson's",    model:'SVM',           params:22, acc:'95%', color:'var(--violet-500)',soft:'rgba(124,58,237,0.08)', border:'rgba(124,58,237,0.18)', desc:'Early detection via 22 vocal biomarker measurements with high-precision SVM.' },
            ].map((d, i) => (
              <div key={i} style={{ background: d.soft, border: `1.5px solid ${d.border}`, borderRadius: '22px', padding: '32px', transition: 'all 0.3s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 20px 50px ${d.soft}`; }}
                onMouseOut={e  => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ fontSize: '52px', marginBottom: '16px', animation: d.name==='Heart Disease'?'heartbeat 1.5s ease infinite':undefined }}>{d.emoji}</div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.3px' }}>{d.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.65, marginBottom: '20px', fontWeight: 500 }}>{d.desc}</p>
                <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--bg-surface)', border: `1px solid ${d.border}`, fontSize: '12px', fontWeight: 800, color: d.color }}>{d.model}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--bg-surface)', border: `1px solid ${d.border}`, fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{d.params} params</span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: d.color, fontSize: '12px', fontWeight: 800, color: 'white' }}>~{d.acc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '56px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px' }}>
              <div className="section-label">Everything Included</div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: '-0.8px', lineHeight: 1.15 }}>
                Complete Healthcare Ecosystem
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.8, marginBottom: '32px', fontWeight: 500 }}>
                From AI disease prediction to doctor booking — everything you need for proactive, data-driven healthcare.
              </p>
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free <ArrowRight size={16} /></Link>
            </div>
            <div style={{ flex: '1 1 380px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { emoji:'🔬', title:'AI Predictions',  desc:'3 ML models',          color:'var(--teal-500)',   soft:'rgba(13,148,136,0.1)'  },
                { emoji:'📄', title:'PDF Reports',      desc:'Instant download',     color:'var(--accent)',     soft:'var(--accent-soft)'    },
                { emoji:'👨‍⚕️',title:'Doctor Network', desc:'Find & book instantly',color:'var(--cyan-500)',   soft:'rgba(30,58,138,0.1)'   },
                { emoji:'📅', title:'Easy Booking',     desc:'Mock payment demo',    color:'var(--violet-500)',soft:'rgba(124,58,237,0.1)'  },
                { emoji:'📧', title:'Email Alerts',     desc:'Auto confirmations',   color:'var(--amber-500)', soft:'rgba(217,119,6,0.1)'   },
                { emoji:'🔒', title:'Secure & Private', desc:'JWT auth + encrypted', color:'var(--rose-500)',  soft:'rgba(225,29,72,0.08)'  },
              ].map((f, i) => (
                <div key={i} style={{ background: f.soft, border: `1.5px solid var(--border-subtle)`, borderRadius: '16px', padding: '20px', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${f.soft}`; }}
                  onMouseOut={e  => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ fontSize: '26px', marginBottom: '8px' }}>{f.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{f.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: 'var(--gradient-brand)', borderRadius: '32px', padding: '64px 48px', boxShadow: '0 28px 80px var(--accent-glow)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '170px', height: '170px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite', display: 'flex', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="64" height="64">
                  <path d="M32 4 L56 14 L56 34 C56 46 44 56 32 60 C20 56 8 46 8 34 L8 14 Z" fill="rgba(255,255,255,0.25)" />
                  <path d="M32 10 L50 18 L50 34 C50 43 41 51 32 54 C23 51 14 43 14 34 L14 18 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                  <rect x="28" y="22" width="8" height="20" rx="2" fill="white"/>
                  <rect x="22" y="28" width="20" height="8" rx="2" fill="white"/>
                  <polyline points="18,32 22,32 25,26 29,38 33,28 36,36 38,32 46,32" stroke="rgba(5,150,105,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: 'white', marginBottom: '16px', letterSpacing: '-0.8px' }}>
                Your Health, Our Priority
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', marginBottom: '36px', lineHeight: 1.75, fontWeight: 500 }}>
                Detect health risks early. Get AI-powered insights. Connect with specialists — all in one platform.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', background: 'white', color: '#1E3A8A', textDecoration: 'none', fontWeight: 900, fontSize: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseOut={e=>e.currentTarget.style.transform=''}>
                  Get Started Free <ArrowRight size={16} />
                </Link>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '15px', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.22)'}
                  onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '28px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="32" height="32">
                <defs>
                  <linearGradient id="footerShield" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)"/>
                    <stop offset="50%" stopColor="#1E3A8A"/>
                    <stop offset="100%" stopColor="#4f46e5"/>
                  </linearGradient>
                </defs>
                <path d="M32 4 L56 14 L56 34 C56 46 44 56 32 60 C20 56 8 46 8 34 L8 14 Z" fill="url(#footerShield)" />
                <rect x="28" y="22" width="8" height="20" rx="2" fill="white" opacity="0.95"/>
                <rect x="22" y="28" width="20" height="8" rx="2" fill="white" opacity="0.95"/>
                <polyline points="18,32 22,32 25,26 29,38 33,28 36,36 38,32 46,32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Health<span style={{ color: 'var(--accent)' }}>Guard</span></span>
          </div>
          <p style={{ color: 'var(--text-faint)', fontSize: '13px', fontWeight: 600 }}>© 2026 HealthGuard · AI Disease Prediction · FYP Project . Built By Ashish Srivastava & Ashutosh Maurya </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <span key={l} style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }}
                onMouseOver={e=>e.target.style.color='var(--accent)'}
                onMouseOut={e=>e.target.style.color='var(--text-muted)'}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
