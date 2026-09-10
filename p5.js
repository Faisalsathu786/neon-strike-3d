/* ============================================================
   Part 5 : sound (WebAudio, no external files) + mute toggle
   ============================================================ */
let ACtx=null,SFXM=true;
try{SFXM=localStorage.getItem('neon3d_mute')!=='1';}catch(e){}
function audioInit(){
 if(ACtx)return;
 const Ctx=window.AudioContext||window.webkitAudioContext;
 if(!Ctx)return;
 try{ACtx=new Ctx();}catch(e){ACtx=null;}
}
function ac(){
 audioInit();
 if(ACtx&&ACtx.state==='suspended'){try{ACtx.resume();}catch(e){}}
 return ACtx;
}
function sfxTone(freq,dur,type,vol,slideTo,delay){
 const c=ac();if(!c||!SFXM)return;
 const t=c.currentTime+(delay||0);
 const o=c.createOscillator(),g=c.createGain();
 o.type=type||'square';
 o.frequency.setValueAtTime(Math.max(20,freq),t);
 if(slideTo)o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo),t+dur);
 const v=vol==null?0.16:vol;
 g.gain.setValueAtTime(0.0001,t);
 g.gain.linearRampToValueAtTime(v,t+0.008);
 g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 o.connect(g);g.connect(c.destination);
 o.start(t);o.stop(t+dur+0.03);
}
function sfxNoise(dur,vol,cut,q,delay){
 const c=ac();if(!c||!SFXM)return;
 const t=c.currentTime+(delay||0);
 const n=Math.max(1,Math.floor(c.sampleRate*dur));
 const buf=c.createBuffer(1,n,c.sampleRate);
 const d=buf.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
 const s=c.createBufferSource();s.buffer=buf;
 const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=cut||1400;f.Q.value=q||1;
 const g=c.createGain();g.gain.value=vol==null?0.22:vol;
 s.connect(f);f.connect(g);g.connect(c.destination);
 s.start(t);s.stop(t+dur+0.02);
}
function sfx(name){
 if(!SFXM)return;
 switch(name){
  case 'pistol': sfxTone(700,0.07,'square',0.15,240);sfxNoise(0.05,0.12,2600,1);break;
  case 'smg': sfxTone(820,0.045,'square',0.11,320);sfxNoise(0.035,0.09,3200,1);break;
  case 'shotgun': sfxTone(190,0.16,'sawtooth',0.2,60);sfxNoise(0.16,0.26,1300,1);break;
  case 'sniper': sfxTone(1250,0.13,'sawtooth',0.18,120);sfxNoise(0.11,0.18,3600,1);break;
  case 'rocket': sfxTone(150,0.3,'sawtooth',0.2,50);sfxNoise(0.24,0.2,800,1);break;
  case 'hit': sfxTone(430,0.045,'square',0.06,250);break;
  case 'eshot': sfxTone(320,0.06,'sawtooth',0.045,180);break;
  case 'kill': sfxTone(260,0.12,'triangle',0.13,120);break;
  case 'explode': sfxNoise(0.42,0.38,600,1);sfxTone(95,0.36,'sawtooth',0.17,40);break;
  case 'reload': sfxTone(320,0.05,'square',0.1,520);sfxTone(520,0.06,'square',0.1,300,0.14);break;
  case 'pickup': sfxTone(880,0.08,'sine',0.16,1320);break;
  case 'hurt': sfxTone(210,0.2,'sawtooth',0.22,90);break;
  case 'dash': sfxNoise(0.18,0.17,2000,1);break;
  case 'wave': sfxTone(520,0.12,'triangle',0.16,780);sfxTone(780,0.18,'triangle',0.16,1040,0.13);break;
  case 'boss': sfxTone(110,0.5,'sawtooth',0.22,60);sfxTone(88,0.7,'sawtooth',0.22,45,0.26);break;
  case 'clear': [523,659,784,1046].forEach((f,i)=>sfxTone(f,0.22,'triangle',0.16,null,i*0.12));break;
  case 'dead': sfxTone(300,0.9,'sawtooth',0.22,60);break;
 }
}
function audioUnlock(){const c=ac();if(c&&c.state==='suspended'){try{c.resume();}catch(e){}}}
['pointerdown','keydown','touchstart'].forEach(ev=>{try{addEventListener(ev,audioUnlock,{passive:true});}catch(e){}});

const muteBtn=document.getElementById('muteBtn');
function refreshMute(){if(muteBtn)muteBtn.textContent=SFXM?'\uD83D\uDD0A':'\uD83D\uDD07';}
refreshMute();
if(muteBtn)muteBtn.addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 SFXM=!SFXM;
 try{localStorage.setItem('neon3d_mute',SFXM?'0':'1');}catch(err){}
 refreshMute();
 if(SFXM)sfx('pickup');
});

/* ============================================================
   On-screen controls: PC move-pad + fire, mobile auto-fire, aim lock
   ============================================================ */
try{document.body.classList.add(IS_TOUCH?'istouch':'ispc');}catch(e){}
function holdBtn(id,setter){
 const el=document.getElementById(id);if(!el)return;
 const on=e=>{if(e.cancelable)e.preventDefault();audioUnlock();setter(true);};
 const off=e=>{if(e.cancelable)e.preventDefault();setter(false);};
 el.addEventListener('pointerdown',on);
 el.addEventListener('pointerup',off);
 el.addEventListener('pointerleave',off);
 el.addEventListener('pointercancel',off);
 el.addEventListener('contextmenu',e=>e.preventDefault());
}
holdBtn('pbF',v=>BTN.f=v);holdBtn('pbB',v=>BTN.b=v);holdBtn('pbL',v=>BTN.l=v);holdBtn('pbR',v=>BTN.r=v);holdBtn('bigFire',v=>BTN.fire=v);
const autoBtnEl=document.getElementById('autoBtn');
if(autoBtnEl)autoBtnEl.addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();audioUnlock();
 AUTO=!AUTO;autoBtnEl.classList.toggle('on',AUTO);
});
const lockBtn=document.getElementById('lockBtn');
if(lockBtn)lockBtn.addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 if(document.pointerLockElement===cv){if(document.exitPointerLock)document.exitPointerLock();}
 else if(cv.requestPointerLock)cv.requestPointerLock();
});
