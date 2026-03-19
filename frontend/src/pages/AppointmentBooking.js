import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, MapPin, Star, CreditCard,
  CheckCircle, Shield, AlertCircle, X, ChevronRight,
  Smartphone, Building2, Wallet, Lock, RefreshCw,
} from 'lucide-react';

const TIME_SLOTS = [
  '9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM',
];

function getTomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
function getMaxDateStr() {
  const d = new Date(); d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}
function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function genId(prefix) {
  return prefix + Math.random().toString(36).substring(2,12).toUpperCase();
}
function QRCode({ size = 168 }) {
  return (
    <img
      src="/qr.img.jpeg"
      alt="UPI QR Code"
      width={size}
      height={size}
      style={{ display:'block', borderRadius:'4px', objectFit:'cover' }}
    />
  );
}

function RazorpayModal({ amount, doctorName, orderId, onSuccess, onDismiss }) {
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  const [tab,     setTab]     = useState('upi');
  const [stage,   setStage]   = useState('form');
  const [upiId,   setUpiId]   = useState('');
  const [upiApp,  setUpiApp]  = useState('');
  const [card,    setCard]    = useState({ number:'', name:'', expiry:'', cvv:'' });
  const [bank,    setBank]    = useState('');
  const [wallet,  setWallet]  = useState('');
  const [qrTimer, setQrTimer] = useState(300);
  const [qrExpired, setQrExpired] = useState(false);
  const timerRef = useRef(null);

  const paymentId = useRef(genId('pay_'));

  useEffect(() => {
    if (tab === 'qr' && stage === 'form') {
      timerRef.current = setInterval(() => {
        setQrTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); setQrExpired(true); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [tab, stage]);

  const resetQr = () => { setQrExpired(false); setQrTimer(300); };
  const fmt4    = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp  = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length>2 ? d.slice(0,2)+'/'+d.slice(2) : d; };

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const upiApps = [
    { id:'gpay',    name:'Google Pay', color:'#4285F4', bg:'#EFF6FF',
      icon: <svg viewBox="0 0 24 24" width="22" height="22"><text y="18" fontSize="18">G</text></svg> },
    { id:'phonepe', name:'PhonePe',    color:'#5f259f', bg:'#F5EEFF',
      icon: <svg viewBox="0 0 24 24" width="22" height="22"><text y="18" fontSize="18">P</text></svg> },
    { id:'paytm',   name:'Paytm',      color:'#00B9F1', bg:'#E6F9FF',
      icon: <svg viewBox="0 0 24 24" width="22" height="22"><text y="18" fontSize="18">T</text></svg> },
    { id:'bhim',    name:'BHIM UPI',   color:'#1A7F4B', bg:'#E8F7EE',
      icon: <svg viewBox="0 0 24 24" width="22" height="22"><text y="18" fontSize="18">B</text></svg> },
  ];

  const banks = [
    'State Bank of India','HDFC Bank','ICICI Bank','Axis Bank',
    'Kotak Mahindra Bank','Punjab National Bank','Bank of Baroda','Yes Bank',
    'Canara Bank','IndusInd Bank',
  ];

  const wallets = [
    { id:'phonepe_w', name:'PhonePe',   color:'#5f259f', emoji:'📱' },
    { id:'paytm_w',   name:'Paytm',     color:'#00B9F1', emoji:'💰' },
    { id:'amazon',    name:'Amazon Pay',color:'#FF9900', emoji:'📦' },
    { id:'mobikwik',  name:'MobiKwik',  color:'#2664AC', emoji:'🏦' },
  ];

  const canPay = () => {
    if (tab === 'upi')    return upiId.includes('@') && upiId.length > 4;
    if (tab === 'card')   return card.number.replace(/\s/g,'').length === 16 && card.name.trim().length > 1 && card.expiry.length === 5 && card.cvv.length >= 3;
    if (tab === 'net')    return !!bank;
    if (tab === 'wallet') return !!wallet;
    if (tab === 'qr')     return !qrExpired;
    return false;
  };

  const handlePay = () => {
    setStage('processing');
    setTimeout(() => {
      setStage('success');
      setTimeout(() => onSuccess(paymentId.current), 1600);
    }, 2800);
  };

  const rzpBlue  = '#528FF0';
  const rzpDark  = '#072654';
  const surface  = isDark ? '#111827' : '#FFFFFF';
  const raised   = isDark ? '#1F2937' : '#F8FAFF';
  const border   = isDark ? '#2D3748' : '#E2EEFF';
  const txt      = isDark ? '#F1F5F9' : '#0F172A';
  const muted    = isDark ? '#64748B' : '#64748B';
  const inputBg  = isDark ? '#0F172A' : '#F8FAFF';
  const tabActive= isDark ? '#1E3A5F' : '#EFF6FF';

  const TAB_ITEMS = [
    { key:'upi',    icon:<Smartphone size={13}/>,  label:'UPI'     },
    { key:'card',   icon:<CreditCard  size={13}/>,  label:'Card'    },
    { key:'net',    icon:<Building2   size={13}/>,  label:'Netbanking'},
    { key:'wallet', icon:<Wallet      size={13}/>,  label:'Wallet'  },
    { key:'qr',     icon:<span style={{fontSize:'13px'}}>⬛</span>, label:'QR Code'},
  ];

  const iStyle = {
    width:'100%', padding:'11px 14px', borderRadius:'10px',
    border:`1.5px solid ${border}`, background:inputBg, color:txt,
    fontFamily:'DM Sans,sans-serif', fontSize:'14px', fontWeight:500,
    outline:'none', boxSizing:'border-box', transition:'border-color 0.2s',
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(7,38,84,0.75)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
    }}>
      <div style={{
        width:'100%', maxWidth:'440px', borderRadius:'16px', overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.45)', background:surface,
        fontFamily:'DM Sans,sans-serif', maxHeight:'92vh', overflowY:'auto',
        animation:'rzpSlideIn 0.22s ease-out',
      }}>
        <style>{`
          @keyframes rzpSlideIn { from { opacity:0; transform:translateY(18px) scale(0.97); } to { opacity:1; transform:none; } }
          @keyframes rzpSpin { to { transform:rotate(360deg); } }
          @keyframes rzpPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes rzpCheck { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
          .rzp-tab:hover { background:${tabActive} !important; }
          .rzp-btn-pay:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 8px 28px rgba(82,143,240,0.45) !important; }
          .rzp-bank-btn:hover { border-color:${rzpBlue} !important; background:${tabActive} !important; }
          .rzp-upi-app:hover { border-color:${rzpBlue} !important; transform:translateY(-2px); }
          .rzp-input:focus { border-color:${rzpBlue} !important; box-shadow:0 0 0 3px rgba(82,143,240,0.15) !important; }
        `}</style>

        <div style={{
          background:`linear-gradient(135deg, ${rzpDark} 0%, #1a4a8a 60%, #2563EB 100%)`,
          padding:'0', position:'relative', overflow:'hidden',
        }}>
          <div style={{position:'absolute',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(255,255,255,0.04)',top:'-60px',right:'-40px'}}/>
          <div style={{position:'absolute',width:'120px',height:'120px',borderRadius:'50%',background:'rgba(255,255,255,0.06)',bottom:'-50px',left:'20px'}}/>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 0',position:'relative',zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'9px',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="rgba(255,255,255,0.9)" opacity="0.8"/>
                  <path d="M12 2v20M3 7l9 5 9-5" stroke="white" strokeWidth="1.2" fill="none"/>
                </svg>
              </div>
              <div>
                <div style={{color:'white',fontWeight:700,fontSize:'15px',letterSpacing:'-0.2px'}}>HealthGuard Pay</div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:'11px',fontWeight:500}}>Powered by Razorpay</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:'rgba(255,255,255,0.12)',borderRadius:'20px',backdropFilter:'blur(4px)'}}>
                <Lock size={10} color="rgba(255,255,255,0.8)"/>
                <span style={{color:'rgba(255,255,255,0.8)',fontSize:'11px',fontWeight:600}}>Secure</span>
              </div>
              <button onClick={onDismiss} style={{
                width:'30px',height:'30px',borderRadius:'8px',border:'none',cursor:'pointer',
                background:'rgba(255,255,255,0.12)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',
                backdropFilter:'blur(4px)',transition:'background 0.2s',
              }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.22)'}
                 onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
                <X size={14}/>
              </button>
            </div>
          </div>

          <div style={{margin:'16px 20px 20px',padding:'16px',background:'rgba(255,255,255,0.1)',borderRadius:'12px',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)',position:'relative',zIndex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{color:'rgba(255,255,255,0.65)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'4px'}}>Paying to</div>
                <div style={{color:'white',fontWeight:700,fontSize:'15px'}}>Dr. {doctorName}</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11.5px',marginTop:'2px'}}>Consultation · {orderId.slice(0,16)}...</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:'rgba(255,255,255,0.65)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'2px'}}>Amount</div>
                <div style={{color:'white',fontWeight:800,fontSize:'30px',lineHeight:1,letterSpacing:'-1px'}}>₹{amount}</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',marginTop:'2px'}}>INR</div>
              </div>
            </div>
          </div>
        </div>

        {stage === 'processing' && (
          <div style={{padding:'56px 24px',textAlign:'center'}}>
            <div style={{width:'72px',height:'72px',margin:'0 auto 22px',position:'relative'}}>
              <svg viewBox="0 0 72 72" width="72" height="72" style={{animation:'rzpSpin 0.9s linear infinite'}}>
                <circle cx="36" cy="36" r="30" fill="none" stroke={isDark?'#1E3A5F':'#DBEAFE'} strokeWidth="5"/>
                <circle cx="36" cy="36" r="30" fill="none" stroke={rzpBlue} strokeWidth="5"
                  strokeDasharray="60 130" strokeLinecap="round"/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px'}}>💳</div>
            </div>
            <div style={{fontWeight:700,color:txt,fontSize:'17px',marginBottom:'6px'}}>Processing Payment</div>
            <div style={{color:muted,fontSize:'13px',animation:'rzpPulse 1.5s ease infinite'}}>
              Verifying with secure gateway...
            </div>
            <div style={{marginTop:'20px',display:'flex',justifyContent:'center',gap:'6px'}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:rzpBlue,opacity:0.3,animation:`rzpPulse 1.2s ease ${i*0.2}s infinite`}}/>
              ))}
            </div>
          </div>
        )}

        {stage === 'success' && (
          <div style={{padding:'52px 24px',textAlign:'center'}}>
            <div style={{
              width:'76px',height:'76px',borderRadius:'50%',margin:'0 auto 20px',
              background:'linear-gradient(135deg,#10B981,#059669)',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 8px 28px rgba(16,185,129,0.35)',
            }}>
              <svg viewBox="0 0 44 44" width="40" height="40" fill="none">
                <path d="M10 22 L19 31 L34 14" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="60" strokeDashoffset="0" style={{animation:'rzpCheck 0.4s ease 0.1s both'}}/>
              </svg>
            </div>
            <div style={{fontWeight:800,color:txt,fontSize:'20px',marginBottom:'6px'}}>Payment Successful!</div>
            <div style={{color:muted,fontSize:'13.5px'}}>₹{amount} paid · Confirming appointment...</div>
            <div style={{marginTop:'16px',padding:'10px 16px',background:raised,borderRadius:'10px',display:'inline-flex',alignItems:'center',gap:'8px'}}>
              <span style={{color:muted,fontSize:'12px',fontWeight:500}}>Txn ID:</span>
              <span style={{color:txt,fontSize:'12px',fontWeight:700,fontFamily:'DM Mono,monospace'}}>{paymentId.current}</span>
            </div>
          </div>
        )}

        {stage === 'form' && (
          <div style={{padding:'0'}}>
            <div style={{display:'flex',borderBottom:`1px solid ${border}`,background:surface}}>
              {TAB_ITEMS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} className="rzp-tab" style={{
                  flex:1, padding:'13px 4px 11px', border:'none', borderBottom:`2.5px solid ${tab===t.key?rzpBlue:'transparent'}`,
                  cursor:'pointer', background:'transparent', color: tab===t.key?rzpBlue:muted,
                  fontWeight: tab===t.key?700:500, fontSize:'11px',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',
                  fontFamily:'DM Sans,sans-serif', transition:'all 0.18s',
                }}>
                  {t.icon}
                  <span style={{whiteSpace:'nowrap'}}>{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{padding:'22px 22px 28px'}}>

              {tab === 'upi' && (
                <div>
                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'12px',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:'10px'}}>
                      Pay via app
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      {upiApps.map(app => (
                        <button key={app.id} onClick={()=>{setUpiApp(app.id);setUpiId(app.id+'@oksbi');}} className="rzp-upi-app" style={{
                          padding:'13px 12px', border:`2px solid ${upiApp===app.id?app.color:border}`,
                          borderRadius:'12px', background: upiApp===app.id?app.bg:surface,
                          cursor:'pointer', display:'flex', alignItems:'center', gap:'10px',
                          fontSize:'13px', fontWeight:600, color:txt, transition:'all 0.18s',
                          fontFamily:'DM Sans,sans-serif',
                        }}>
                          <div style={{width:'32px',height:'32px',borderRadius:'8px',background:app.bg,border:`1px solid ${app.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>
                            {app.id==='gpay'?'📲':app.id==='phonepe'?'📱':app.id==='paytm'?'💳':'🏦'}
                          </div>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.name}</span>
                          {upiApp===app.id && <span style={{marginLeft:'auto',color:app.color,fontSize:'16px'}}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{position:'relative',marginBottom:'18px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                      <div style={{height:'1px',flex:1,background:border}}/>
                      <span style={{fontSize:'11.5px',color:muted,fontWeight:500,whiteSpace:'nowrap'}}>or enter UPI ID</span>
                      <div style={{height:'1px',flex:1,background:border}}/>
                    </div>
                    <input value={upiId} onChange={e=>{setUpiId(e.target.value);setUpiApp('');}}
                      placeholder="yourname@upi  (e.g. success@razorpay)" style={iStyle}
                      className="rzp-input"
                      onFocus={e=>e.target.style.borderColor=rzpBlue} onBlur={e=>e.target.style.borderColor=border}/>
                    {upiId && !upiId.includes('@') && (
                      <div style={{fontSize:'11.5px',color:'#EF4444',marginTop:'5px',display:'flex',alignItems:'center',gap:'4px'}}>
                        <AlertCircle size={11}/> Enter valid UPI ID with @
                      </div>
                    )}
                  </div>

                  <div style={{padding:'10px 12px',background:isDark?'#0F2A1A':'#F0FDF4',border:`1px solid ${isDark?'#166534':'#BBF7D0'}`,borderRadius:'8px',marginBottom:'18px',fontSize:'12px',color:isDark?'#86EFAC':'#15803D',fontWeight:500}}>
                    💡 Test: use <strong>success@razorpay</strong> to simulate success
                  </div>
                </div>
              )}

              {tab === 'card' && (
                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div style={{
                    height:'100px',borderRadius:'14px',padding:'16px 20px',
                    background:`linear-gradient(135deg, ${rzpDark}, #1a4a8a)`,
                    position:'relative',overflow:'hidden',marginBottom:'4px',
                  }}>
                    <div style={{position:'absolute',width:'140px',height:'140px',borderRadius:'50%',background:'rgba(255,255,255,0.05)',top:'-50px',right:'-30px'}}/>
                    <div style={{position:'absolute',width:'80px',height:'80px',borderRadius:'50%',background:'rgba(255,255,255,0.07)',bottom:'-30px',left:'30px'}}/>
                    <div style={{color:'rgba(255,255,255,0.5)',fontSize:'10px',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase'}}>Card Number</div>
                    <div style={{color:'white',fontSize:'17px',fontWeight:700,letterSpacing:'3px',fontFamily:'DM Mono,monospace',marginTop:'4px'}}>
                      {card.number || '•••• •••• •••• ••••'}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px'}}>
                      <span style={{color:'rgba(255,255,255,0.7)',fontSize:'11px',fontWeight:600}}>{card.name || 'CARDHOLDER NAME'}</span>
                      <span style={{color:'rgba(255,255,255,0.7)',fontSize:'11px',fontWeight:600,fontFamily:'DM Mono,monospace'}}>{card.expiry || 'MM/YY'}</span>
                    </div>
                  </div>

                  <div>
                    <label style={{fontSize:'11px',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'0.6px',display:'block',marginBottom:'6px'}}>Card Number</label>
                    <input value={card.number} onChange={e=>setCard({...card,number:fmt4(e.target.value)})}
                      placeholder="0000 0000 0000 0000" maxLength={19} className="rzp-input"
                      style={{...iStyle,letterSpacing:'1.5px',fontFamily:'DM Mono,monospace'}}
                      onFocus={e=>e.target.style.borderColor=rzpBlue} onBlur={e=>e.target.style.borderColor=border}/>
                  </div>
                  <div>
                    <label style={{fontSize:'11px',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'0.6px',display:'block',marginBottom:'6px'}}>Name on Card</label>
                    <input value={card.name} onChange={e=>setCard({...card,name:e.target.value.toUpperCase()})}
                      placeholder="JOHN DOE" className="rzp-input"
                      style={{...iStyle,textTransform:'uppercase'}}
                      onFocus={e=>e.target.style.borderColor=rzpBlue} onBlur={e=>e.target.style.borderColor=border}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'0.6px',display:'block',marginBottom:'6px'}}>Expiry</label>
                      <input value={card.expiry} onChange={e=>setCard({...card,expiry:fmtExp(e.target.value)})}
                        placeholder="MM/YY" maxLength={5} className="rzp-input"
                        style={{...iStyle,fontFamily:'DM Mono,monospace'}}
                        onFocus={e=>e.target.style.borderColor=rzpBlue} onBlur={e=>e.target.style.borderColor=border}/>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'0.6px',display:'block',marginBottom:'6px'}}>CVV</label>
                      <input value={card.cvv} onChange={e=>setCard({...card,cvv:e.target.value.replace(/\D/g,'').slice(0,4)})}
                        placeholder="•••" type="password" maxLength={4} className="rzp-input"
                        style={{...iStyle,fontFamily:'DM Mono,monospace'}}
                        onFocus={e=>e.target.style.borderColor=rzpBlue} onBlur={e=>e.target.style.borderColor=border}/>
                    </div>
                  </div>
                  <div style={{padding:'10px 12px',background:isDark?'#0F2A1A':'#F0FDF4',border:`1px solid ${isDark?'#166534':'#BBF7D0'}`,borderRadius:'8px',fontSize:'12px',color:isDark?'#86EFAC':'#15803D',fontWeight:500}}>
                    💡 Test card: <strong>4111 1111 1111 1111</strong> · Any future expiry · Any CVV
                  </div>
                </div>
              )}

              {tab === 'net' && (
                <div>
                  <div style={{marginBottom:'14px'}}>
                    <div style={{fontSize:'12px',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:'10px'}}>Popular Banks</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                      {banks.slice(0,4).map(b=>(
                        <button key={b} onClick={()=>setBank(b)} className="rzp-bank-btn" style={{
                          padding:'11px 12px',border:`1.5px solid ${bank===b?rzpBlue:border}`,
                          borderRadius:'10px',background:bank===b?tabActive:surface,
                          cursor:'pointer',fontSize:'12px',fontWeight:600,color:txt,
                          textAlign:'left',display:'flex',alignItems:'center',gap:'8px',
                          transition:'all 0.18s',fontFamily:'DM Sans,sans-serif',
                        }}>
                          <span style={{fontSize:'18px'}}>🏦</span>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                            {b.replace(' Bank','').replace('State ','SBI')}
                          </span>
                          {bank===b && <span style={{color:rzpBlue,fontWeight:800,fontSize:'14px'}}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:'12px',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:'8px'}}>All Banks</div>
                    <select value={bank} onChange={e=>setBank(e.target.value)}
                      style={{...iStyle,cursor:'pointer',appearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'calc(100% - 14px) center'}}
                      className="rzp-input"
                      onFocus={e=>e.target.style.borderColor=rzpBlue} onBlur={e=>e.target.style.borderColor=border}>
                      <option value="">Select your bank</option>
                      {banks.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {tab === 'wallet' && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  {wallets.map(w=>(
                    <button key={w.id} onClick={()=>setWallet(w.id)} style={{
                      padding:'20px 12px',border:`2px solid ${wallet===w.id?w.color:border}`,
                      borderRadius:'12px',background:wallet===w.id?`${w.color}12`:surface,
                      cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',
                      transition:'all 0.18s',fontFamily:'DM Sans,sans-serif',
                    }}>
                      <span style={{fontSize:'32px'}}>{w.emoji}</span>
                      <span style={{fontSize:'13px',fontWeight:700,color:wallet===w.id?w.color:txt}}>{w.name}</span>
                      {wallet===w.id && <span style={{fontSize:'11px',color:w.color,fontWeight:700,padding:'2px 8px',background:`${w.color}18`,borderRadius:'20px'}}>✓ Selected</span>}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'qr' && (
                <div style={{textAlign:'center'}}>
                  <div style={{marginBottom:'14px'}}>
                    <div style={{fontWeight:700,color:txt,fontSize:'14px',marginBottom:'4px'}}>Scan & Pay with any UPI app</div>
                    <div style={{color:muted,fontSize:'12.5px'}}>Open any UPI app → Scan QR → Pay ₹{amount}</div>
                  </div>

                  <div style={{
                    display:'inline-block',padding:'16px',
                    background:'white',borderRadius:'16px',
                    boxShadow:'0 4px 24px rgba(0,0,0,0.12)',
                    border:`3px solid ${qrExpired?'#EF4444':rzpBlue}`,
                    position:'relative',
                  }}>
                    <div style={{opacity:qrExpired?0.25:1,transition:'opacity 0.3s'}}>
                      <QRCode
                     size={168}
                        />
                    </div>
                    <div style={{
                      position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
                      width:'36px',height:'36px',borderRadius:'8px',background:'white',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:'11px',fontWeight:900,color:rzpDark,letterSpacing:'-0.5px',
                      opacity:qrExpired?0.2:1,
                    }}>UPI</div>

                    {qrExpired && (
                      <div style={{
                        position:'absolute',inset:0,borderRadius:'13px',
                        background:'rgba(255,255,255,0.92)',
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px',
                      }}>
                        <div style={{fontSize:'28px'}}>⏰</div>
                        <div style={{fontWeight:700,color:'#EF4444',fontSize:'13px'}}>QR Expired</div>
                        <button onClick={resetQr} style={{
                          display:'flex',alignItems:'center',gap:'5px',padding:'7px 14px',
                          background:rzpBlue,color:'white',border:'none',borderRadius:'8px',
                          cursor:'pointer',fontWeight:700,fontSize:'12px',
                        }}>
                          <RefreshCw size={12}/> Refresh
                        </button>
                      </div>
                    )}
                  </div>

                  {!qrExpired && (
                    <div style={{marginTop:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                      <div style={{
                        width:'8px',height:'8px',borderRadius:'50%',
                        background:qrTimer<60?'#EF4444':'#10B981',
                        animation:'rzpPulse 1.2s ease infinite',
                      }}/>
                      <span style={{fontSize:'12.5px',color:qrTimer<60?'#EF4444':muted,fontWeight:600,fontFamily:'DM Mono,monospace'}}>
                        Expires in {formatTime(qrTimer)}
                      </span>
                    </div>
                  )}

                  <div style={{marginTop:'16px',display:'flex',justifyContent:'center',gap:'12px',flexWrap:'wrap'}}>
                    {['📲 Google Pay','📱 PhonePe','💳 Paytm','🏦 BHIM'].map(a=>(
                      <div key={a} style={{fontSize:'12px',color:muted,fontWeight:500,display:'flex',alignItems:'center',gap:'4px'}}>
                        {a}
                      </div>
                    ))}
                  </div>

                  {/* ── CHANGE 2 & 3: UPI ID display + copy button ── */}
                  <div style={{marginTop:'14px',padding:'10px 14px',background:raised,border:`1px solid ${border}`,borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontSize:'10px',color:muted,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>UPI ID</div>
                      <div style={{fontSize:'13px',color:txt,fontWeight:700,fontFamily:'DM Mono,monospace'}}>89319844400@ybl</div>
                    </div>
                    <button onClick={()=>{navigator.clipboard?.writeText('89319844400@ybl');toast.success('UPI ID copied!');}}
                      style={{padding:'5px 10px',background:tabActive,border:`1px solid ${border}`,borderRadius:'7px',cursor:'pointer',fontSize:'11.5px',color:rzpBlue,fontWeight:700}}>
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {tab !== 'qr' && (
                <button onClick={handlePay} disabled={!canPay()} className="rzp-btn-pay" style={{
                  width:'100%', marginTop:'22px', padding:'15px 20px',
                  background: canPay()
                    ? `linear-gradient(135deg, ${rzpDark} 0%, #1a4a8a 50%, ${rzpBlue} 100%)`
                    : raised,
                  color: canPay()?'white':muted,
                  border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:700,
                  cursor: canPay()?'pointer':'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'9px',
                  boxShadow: canPay()?`0 6px 24px rgba(82,143,240,0.3)`:'none',
                  transition:'all 0.22s', fontFamily:'DM Sans,sans-serif',
                }}>
                  <Shield size={15}/>
                  Pay ₹{amount} Securely
                  {canPay() && <ChevronRight size={14}/>}
                </button>
              )}

              {tab === 'qr' && (
                <button onClick={handlePay} disabled={qrExpired} className="rzp-btn-pay" style={{
                  width:'100%', marginTop:'20px', padding:'14px 20px',
                  background: !qrExpired
                    ? `linear-gradient(135deg, ${rzpDark}, ${rzpBlue})`
                    : raised,
                  color: !qrExpired?'white':muted,
                  border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:700,
                  cursor: !qrExpired?'pointer':'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  boxShadow: !qrExpired?`0 6px 24px rgba(82,143,240,0.3)`:'none',
                  transition:'all 0.22s', fontFamily:'DM Sans,sans-serif',
                }}>
                  ✅ I've completed the payment
                </button>
              )}

              <div style={{marginTop:'16px',display:'flex',alignItems:'center',justifyContent:'center',gap:'16px',flexWrap:'wrap'}}>
                {[
                  {icon:'🔒',text:'256-bit SSL'},
                  {icon:'🛡️',text:'PCI DSS Safe'},
                  {icon:'🔐',text:'End-to-end encrypted'},
                ].map(s=>(
                  <div key={s.text} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                    <span style={{fontSize:'12px'}}>{s.icon}</span>
                    <span style={{fontSize:'11px',color:muted,fontWeight:500}}>{s.text}</span>
                  </div>
                ))}
              </div>

              <div style={{marginTop:'14px',textAlign:'center',paddingTop:'12px',borderTop:`1px solid ${border}`}}>
                <span style={{fontSize:'11px',color:muted,fontWeight:500}}>
                  Powered by{' '}
                  <span style={{color:rzpBlue,fontWeight:700}}>Razorpay</span>
                  {' '}· Mock Mode · No real charges
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   APPOINTMENT BOOKING PAGE
══════════════════════════════════════════════════════════════════ */
export default function AppointmentBooking() {
  const { doctorId }    = useParams();
  const [searchParams]  = useSearchParams();
  const predictionId    = searchParams.get('predictionId');
  const { user }        = useAuth();
  const navigate        = useNavigate();

  const [doctor,       setDoctor]      = useState(null);
  const [selectedDate, setDate]        = useState('');
  const [selectedSlot, setSlot]        = useState('');
  const [notes,        setNotes]       = useState('');
  const [loading,      setLoading]     = useState(true);
  const [booking,      setBooking]     = useState(false);
  const [done,         setDone]        = useState(false);
  const [showPay,      setShowPay]     = useState(false);
  const [currentOrder, setCurrentOrder]= useState(null);
  const [bookedSlots,  setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading]= useState(false);
  const [reportFile,   setReportFile]  = useState(null);
  const [reportBase64, setReportBase64]= useState(null);
  const [reportError,  setReportError] = useState('');
  const reportFileRef = useRef();

  const minDate = getTomorrowStr();
  const maxDate = getMaxDateStr();

  useEffect(() => {
    api.get(`/doctors/${doctorId}`)
      .then(r => setDoctor(r.data.doctor))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const fetchBookedSlots = useCallback(async (date) => {
    if (!date || !doctorId) return;
    setSlotsLoading(true);
    try {
      const res = await api.get(`/appointments/booked-slots?doctorId=${doctorId}&date=${date}`);
      setBookedSlots(res.data.bookedSlots || []);
    } catch { setBookedSlots([]); }
    finally { setSlotsLoading(false); }
  }, [doctorId]);

  const handleDateChange = (e) => {
    setDate(e.target.value); setSlot(''); fetchBookedSlots(e.target.value);
  };

  const handleReportFileChange = (e) => {
    const f = e.target.files[0]; if (!f) return; setReportError('');
    if (f.size > 10*1024*1024) { setReportError('File exceeds 10 MB limit.'); return; }
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setReportError('Only PDF or image files accepted.');
      setReportFile(null); setReportBase64(null); e.target.value=''; return;
    }
    setReportFile(f);
    const reader = new FileReader();
    reader.onload = () => setReportBase64(reader.result.split(',')[1]);
    reader.readAsDataURL(f);
  };

  const handleBookClick = async () => {
    if (!selectedDate || !selectedSlot) { toast.error('Please select date and time slot'); return; }
    if (bookedSlots.includes(selectedSlot)) { toast.error('This slot was just booked. Choose another.'); return; }
    setBooking(true);
    try {
      const res = await api.post('/payments/create-order', { amount: doctor.consultationFee });
      setCurrentOrder(res.data);
      setShowPay(true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not initiate payment');
    } finally { setBooking(false); }
  };

  const handlePaymentSuccess = async (paymentId) => {
    setShowPay(false);
    setBooking(true);
    try {
      await api.post('/payments/verify', {
        razorpay_order_id:   currentOrder.order.id,
        razorpay_payment_id: paymentId,
      });

      const patientReport = reportFile && reportBase64 ? {
        fileName: reportFile.name, fileType: reportFile.type,
        fileData: reportBase64, uploadedAt: new Date().toISOString(),
      } : undefined;

      const ar = await api.post('/appointments', {
        doctorId, predictionId: predictionId || null,
        appointmentDate: selectedDate, timeSlot: selectedSlot, notes, patientReport,
      });
      await api.post(`/appointments/${ar.data.appointment._id}/confirm`, {
        paymentId, orderId: currentOrder.order.id,
      });
      setDone(true);
      toast.success('🎉 Appointment confirmed!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setBooking(false); }
  };

  if (loading) return (
    <div className="page-container"><Navbar/>
      <div className="loading-container" style={{minHeight:'calc(100vh - 66px)'}}>
        <div className="loading-spinner" style={{width:'40px',height:'40px'}}/>
        <span style={{color:'var(--text-muted)',fontWeight:600}}>Loading doctor info...</span>
      </div>
    </div>
  );

  if (done) return (
    <div className="page-container"><Navbar/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'calc(100vh - 66px)',padding:'24px'}}>
        <div style={{textAlign:'center',maxWidth:'500px'}} className="animate-fadeInUp">
          <div style={{width:'110px',height:'110px',borderRadius:'50%',background:'rgba(132,204,22,0.12)',border:'3px solid var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 28px'}}>
            <CheckCircle size={56} color="var(--accent)"/>
          </div>
          <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'32px',fontWeight:900,color:'var(--text-primary)',marginBottom:'10px',letterSpacing:'-0.5px'}}>
            Appointment Confirmed! 🎉
          </h2>
          <p style={{color:'var(--text-muted)',marginBottom:'28px',fontSize:'15px'}}>
            A confirmation has been sent to {user.email}
          </p>
          <div style={{background:'var(--bg-surface)',border:'1.5px solid var(--border-subtle)',borderRadius:'20px',padding:'24px',marginBottom:'28px',textAlign:'left',boxShadow:'var(--shadow-sm)'}}>
            {[
              {emoji:'👨‍⚕️',label:'Doctor',     val:`Dr. ${doctor.name}`},
              {emoji:'🏥', label:'Hospital',   val:`${doctor.hospitalName}, ${doctor.city}`},
              {emoji:'📅', label:'Date',       val:formatDateLabel(selectedDate)},
              {emoji:'⏰', label:'Time',       val:selectedSlot},
              {emoji:'💰', label:'Amount Paid',val:`₹${doctor.consultationFee}`,bold:true,color:'var(--accent)'},
            ].map((r,i,a)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 0',borderBottom:i<a.length-1?'1px solid var(--border-subtle)':'none'}}>
                <span style={{fontSize:'20px',flexShrink:0}}>{r.emoji}</span>
                <span style={{color:'var(--text-muted)',fontSize:'13px',fontWeight:600,minWidth:'80px'}}>{r.label}</span>
                <span style={{color:r.color||'var(--text-primary)',fontWeight:r.bold?900:700,fontSize:'14px'}}>{r.val}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <button onClick={()=>navigate('/appointments')} className="btn btn-primary">View Appointments</button>
            <button onClick={()=>navigate('/dashboard')}    className="btn btn-secondary">Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <Navbar/>

      {showPay && currentOrder && (
        <RazorpayModal
          amount={doctor?.consultationFee}
          doctorName={doctor?.name}
          orderId={currentOrder.order.id}
          onSuccess={handlePaymentSuccess}
          onDismiss={()=>setShowPay(false)}
        />
      )}

      <div className="content-wrapper" style={{maxWidth:'940px'}}>
        <div className="page-header animate-fadeInUp">
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-subtitle">Select your preferred date and time, then pay securely</p>
        </div>

        {/* <div className="alert alert-info animate-fadeInUp stagger-1" style={{marginBottom:'24px'}}>
          <span style={{fontSize:'20px'}}>🧪</span>
          <div>
            <strong>Mock Payment Mode</strong> — Razorpay-style UI · No real money charged.
            Test card: <code>4111 1111 1111 1111</code> · Test UPI: <code>success@razorpay</code>
          </div>
        </div> */}

        <div className="grid-2" style={{gap:'24px',alignItems:'start'}}>

          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            <div className="card animate-fadeInUp stagger-2">
              <div style={{display:'flex',gap:'16px',marginBottom:'20px'}}>
                <div style={{width:'74px',height:'74px',borderRadius:'20px',background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'38px',flexShrink:0,border:'2px solid var(--accent-glow)'}}>👨‍⚕️</div>
                <div>
                  <h2 style={{fontFamily:'Outfit,sans-serif',fontSize:'22px',fontWeight:900,color:'var(--text-primary)',marginBottom:'6px',letterSpacing:'-0.3px'}}>Dr. {doctor?.name}</h2>
                  <span className="badge badge-teal">{doctor?.specialization}</span>
                </div>
              </div>
              {[
                {icon:<MapPin size={14}/>,label:`${doctor?.hospitalName}, ${doctor?.city}`},
                {icon:<Clock  size={14}/>,label:`${doctor?.experience} yrs experience`},
                {icon:<Star   size={14}/>,label:`${doctor?.rating} / 5.0 Rating`},
              ].map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',color:'var(--text-secondary)',fontSize:'14px',marginBottom:'10px',fontWeight:500}}>
                  <span style={{color:'var(--accent)',flexShrink:0}}>{item.icon}</span>{item.label}
                </div>
              ))}
              {doctor?.about && <p style={{color:'var(--text-muted)',fontSize:'13px',marginTop:'12px',lineHeight:1.65,fontWeight:500,paddingTop:'12px',borderTop:'1px solid var(--border-subtle)'}}>{doctor.about}</p>}
            </div>

            <div className="card animate-fadeInUp stagger-3" style={{border:'1.5px solid var(--accent-glow)',background:'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-raised) 100%)'}}>
              <h3 style={{fontFamily:'Outfit,sans-serif',fontSize:'15px',fontWeight:800,color:'var(--text-primary)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                💳 Payment Summary
              </h3>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border-subtle)',marginBottom:'10px'}}>
                <span style={{color:'var(--text-secondary)',fontSize:'14px',fontWeight:500}}>Consultation Fee</span>
                <span style={{fontWeight:700,color:'var(--text-primary)'}}>₹{doctor?.consultationFee}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',marginBottom:'14px'}}>
                <span style={{fontWeight:800,color:'var(--text-primary)',fontSize:'15px'}}>Total</span>
                <span style={{fontFamily:'Outfit,sans-serif',fontSize:'26px',fontWeight:900,color:'var(--accent)'}}>₹{doctor?.consultationFee}</span>
              </div>
              <div style={{display:'flex',gap:'7px',flexWrap:'wrap'}}>
                {['📱 UPI','💳 Card','🏦 Net Banking','👛 Wallet','⬛ QR Code'].map(m=>(
                  <span key={m} style={{padding:'4px 10px',background:'var(--bg-raised)',borderRadius:'20px',fontSize:'11px',color:'var(--text-muted)',fontWeight:600,border:'1px solid var(--border-subtle)'}}>{m}</span>
                ))}
              </div>
              <div style={{marginTop:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
                <Shield size={11} color="var(--accent)"/>
                <span style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:600}}>Mock Razorpay · No real charges</span>
              </div>
            </div>
          </div>

          <div className="card animate-fadeInUp stagger-4">
            <h3 style={{fontFamily:'Outfit,sans-serif',fontSize:'18px',fontWeight:900,color:'var(--text-primary)',marginBottom:'22px',letterSpacing:'-0.3px'}}>📅 Select Date &amp; Time</h3>

            <div className="form-group">
              <label className="form-label"><Calendar size={11} style={{display:'inline',marginRight:'5px'}}/>Appointment Date</label>
              <input type="date" className="form-input" value={selectedDate} min={minDate} max={maxDate} onChange={handleDateChange}/>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'7px',padding:'8px 11px',borderRadius:'9px',background:'var(--bg-raised)',border:'1px solid var(--border-subtle)'}}>
                <AlertCircle size={12} color="var(--text-muted)"/>
                <span style={{fontSize:'11.5px',color:'var(--text-muted)',fontWeight:600}}>
                  Tomorrow → Next 30 days
                  {selectedDate && <span style={{color:'var(--accent)',marginLeft:'6px'}}>· {formatDateLabel(selectedDate)}</span>}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span><Clock size={11} style={{display:'inline',marginRight:'5px'}}/>Time Slots</span>
                {slotsLoading && <span style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:600}}>Checking...</span>}
                {!slotsLoading && selectedDate && bookedSlots.length>0 && (
                  <span style={{fontSize:'11px',color:'#e11d48',fontWeight:600}}>{bookedSlots.length} booked</span>
                )}
              </label>
              {!selectedDate ? (
                <div style={{padding:'20px',textAlign:'center',background:'var(--bg-raised)',borderRadius:'12px',border:'1.5px dashed var(--border)'}}>
                  <div style={{fontSize:'24px',marginBottom:'6px'}}>📅</div>
                  <p style={{color:'var(--text-muted)',fontSize:'13px',fontWeight:600}}>Select a date first</p>
                </div>
              ) : (
                <>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginTop:'4px'}}>
                    {TIME_SLOTS.map(slot=>{
                      const isBooked=bookedSlots.includes(slot), isSel=selectedSlot===slot;
                      return (
                        <button key={slot} type="button" disabled={isBooked} onClick={()=>!isBooked&&setSlot(slot)}
                          style={{
                            padding:'10px 4px',border:`1.5px solid ${isBooked?'var(--border-subtle)':isSel?'var(--accent)':'var(--border-subtle)'}`,
                            borderRadius:'10px',cursor:isBooked?'not-allowed':'pointer',
                            fontSize:'12.5px',fontWeight:700,fontFamily:'Outfit,sans-serif',
                            background:isBooked?'var(--bg-sunken)':isSel?'var(--accent-soft)':'var(--bg-raised)',
                            color:isBooked?'var(--text-faint)':isSel?'var(--accent)':'var(--text-muted)',
                            transition:'all 0.18s',opacity:isBooked?0.5:1,
                            boxShadow:isSel?'0 0 0 3px var(--accent-soft)':'none',
                            position:'relative',overflow:'hidden',
                          }}>
                          {isBooked?<span style={{textDecoration:'line-through'}}>{slot}</span>:slot}
                          {isBooked&&<div style={{position:'absolute',top:'2px',right:'4px',fontSize:'8px',color:'#e11d48',fontWeight:800}}>FULL</div>}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{display:'flex',gap:'14px',marginTop:'10px',flexWrap:'wrap'}}>
                    {[
                      {color:'var(--accent-soft)',border:'var(--accent)',label:'Selected'},
                      {color:'var(--bg-raised)',border:'var(--border-subtle)',label:'Available'},
                      {color:'var(--bg-sunken)',border:'var(--border-subtle)',label:'Booked',muted:true},
                    ].map(l=>(
                      <div key={l.label} style={{display:'flex',alignItems:'center',gap:'5px'}}>
                        <div style={{width:'12px',height:'12px',borderRadius:'3px',background:l.color,border:`1px solid ${l.border}`,opacity:l.muted?0.5:1}}/>
                        <span style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:600}}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea className="form-input" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Describe your symptoms or concerns..."/>
            </div>

            <div className="form-group">
              <label className="form-label" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span>📎 Upload Medical Report</span>
                <span style={{fontWeight:500,fontSize:'12px',color:'var(--text-faint)',background:'var(--bg-raised)',padding:'2px 8px',borderRadius:'20px',border:'1px solid var(--border-subtle)'}}>Optional</span>
              </label>
              <input ref={reportFileRef} type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={handleReportFileChange}/>
              {reportFile ? (
                <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderRadius:'12px',background:'rgba(132,204,22,0.06)',border:'1.5px solid rgba(132,204,22,0.30)'}}>
                  <span style={{fontSize:'22px'}}>✅</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:'13px',color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{reportFile.name}</div>
                    <div style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:500,marginTop:'2px'}}>{(reportFile.size/1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={()=>{setReportFile(null);setReportBase64(null);setReportError('');if(reportFileRef.current)reportFileRef.current.value='';}}
                    style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'18px'}}>✕</button>
                </div>
              ) : (
                <div onClick={()=>reportFileRef.current?.click()}
                  style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',border:`1.5px dashed ${reportError?'#ef4444':'var(--border)'}`,background:reportError?'rgba(239,68,68,0.04)':'var(--bg-raised)',cursor:'pointer',transition:'all 0.2s'}}
                  onMouseOver={e=>{if(!reportError)e.currentTarget.style.borderColor='var(--accent)';}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor=reportError?'#ef4444':'var(--border)';}}>
                  <span style={{fontSize:'22px'}}>{reportError?'🚫':'📄'}</span>
                  <div>
                    {reportError
                      ? <div style={{fontWeight:700,fontSize:'12px',color:'#ef4444'}}>{reportError}</div>
                      : <><div style={{fontWeight:700,fontSize:'13px',color:'var(--text-secondary)'}}>Click to attach report</div>
                          <div style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:500,marginTop:'2px'}}>PDF, JPG, PNG · Max 10 MB</div></>
                    }
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleBookClick} className="btn btn-primary btn-full btn-lg" style={{marginTop:'4px'}}
              disabled={booking||!selectedDate||!selectedSlot||bookedSlots.includes(selectedSlot)}>
              {booking
                ? <><div className="loading-spinner" style={{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white'}}/> Processing...</>
                : <><CreditCard size={17}/> Pay ₹{doctor?.consultationFee} &amp; Book</>
              }
            </button>
            <p style={{textAlign:'center',color:'var(--text-faint)',fontSize:'11.5px',marginTop:'10px',fontWeight:600}}>
              🔒 UPI · Card · Net Banking · Wallet · QR Code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}