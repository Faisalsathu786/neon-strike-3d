/* ============================================================
   Part 2 : state, input, weapons, combat helpers
   ============================================================ */
const SHAD=52;
sun.shadow.camera.left=-SHAD;sun.shadow.camera.right=SHAD;sun.shadow.camera.top=SHAD;sun.shadow.camera.bottom=-SHAD;
sun.shadow.camera.updateProjectionMatrix();

const WEAPONS=[
 {name:'PISTOL', mag:30,reload:1.0,fire:0.12,dmg:18,spread:0.012,pellets:1,speed:95, color:'#d6b36a',sfx:'pistol'},
 {name:'SMG',    mag:45,reload:1.25,fire:0.06,dmg:11,spread:0.038,pellets:1,speed:105,color:'#687b82',sfx:'smg'},
 {name:'SHOTGUN',mag:8, reload:1.6, fire:0.78,dmg:13,spread:0.09, pellets:9,speed:80, color:'#9b6d43',sfx:'shotgun'},
 {name:'SNIPER', mag:6, reload:1.9, fire:1.0, dmg:90,spread:0.002,pellets:1,speed:230,color:'#526b64',pierce:3,sfx:'sniper'},
 {name:'ROCKET', mag:4, reload:2.2, fire:1.3, dmg:55,spread:0.006,pellets:1,speed:62, color:'#575d60',rocket:true,sfx:'rocket'}
];
const ETYPE={
 grunt :{hp:42, speed:3.4,scale:1.00,color:'#c94f57',dmg:9, fire:1.6,range:30,score:60},
 runner:{hp:26, speed:6.2,scale:0.85,color:'#d28b3c',dmg:6, fire:1.3,range:16,score:50},
 tank  :{hp:140,speed:2.0,scale:1.5, color:'#65717a',dmg:16,fire:2.2,range:26,score:140},
 sniper:{hp:46, speed:2.6,scale:1.0, color:'#687f72',dmg:20,fire:2.6,range:70,score:110}
};
const BOSSES={
 hunter:{name:'HUNTER',hp:760, color:'#ff5c7a',speed:4.2,dmg:12,contact:16,fire:1.4,atks:['dash','spread']},
 titan :{name:'TITAN', hp:1400,color:'#b06bff',speed:2.6,dmg:18,contact:22,fire:1.9,atks:['radial','spread']},
 reaper:{name:'REAPER',hp:1250,color:'#5cffb0',speed:3.4,dmg:16,contact:20,fire:1.7,atks:['summon','radial']},
 warden:{name:'WARDEN',hp:1900,color:'#ffb02e',speed:3.0,dmg:20,contact:24,fire:1.8,atks:['radial','summon','spread']}
};
const LEVELS=[
 {map:0,waves:2,boss:null,    name:'FIRST STRIKE'},
 {map:2,waves:3,boss:'hunter',name:'SANDSTORM'},
 {map:5,waves:3,boss:'titan', name:'MAGMA CORE'},
 {map:1,waves:3,boss:'hunter',name:'DEEP JUNGLE'},
 {map:6,waves:3,boss:'reaper',name:'TOXIC RISE'},
 {map:3,waves:4,boss:'titan', name:'FROZEN DEPTHS'},
 {map:8,waves:4,boss:'warden',name:'WHITEOUT'},
 {map:7,waves:4,boss:'reaper',name:'SKYFALL'},
 {map:4,waves:4,boss:'hunter',name:'STATION 9'},
 {map:9,waves:5,boss:'warden',name:'NIGHTMARE'}
];

let state='menu',mode='campaign',level=0,unlocked=1,wave=1,score=0,selMap=0,bossSpawned=false;
try{unlocked=Math.max(1,Math.min(LEVELS.length,parseInt(localStorage.getItem('neon3d_unlocked')||'1')));}catch(e){}
let enemies=[],bullets=[],pickups=[],parts=[],boss=null;
let spawnQueue=[],spawnTimer=0,shake=0,camYaw=0,camPitch=0.34;

const player={x:0,z:0,r:0.8,hp:100,maxHp:100,speed:9,ang:0,mesh:null,
 wi:0,mags:WEAPONS.map(w=>w.mag),reloading:false,reload:0,fireCd:0,dashCd:0,dashT:0,dx:0,dz:0,walk:0,hitFlash:0,contactCd:0};

/* ---------- input ---------- */
const keys={};let mouseDown=false;
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;
 if(k==='escape'){if(state==='play')pauseGame();else if(state==='pause')resumeGame();}
 if(k==='r'&&state==='play')startReload();
 if(k==='q'&&state==='play')switchWeapon((player.wi+1)%WEAPONS.length);
 if(k==='shift'&&state==='play')tryDash();
 if(k>='1'&&k<='5'&&state==='play')switchWeapon(parseInt(k)-1);});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
const SENS=0.0026;
document.addEventListener('mousemove',e=>{
 if(document.pointerLockElement===cv||e.target===cv){
  camYaw-=e.movementX*SENS;camPitch=clamp(camPitch+e.movementY*SENS,-0.15,0.75);
 }
});
cv.addEventListener('mousedown',e=>{if(e.button===0)mouseDown=true;});
addEventListener('mouseup',()=>{mouseDown=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());

const TOUCH={move:{id:null,ox:0,oy:0,dx:0,dy:0},look:{id:null,lx:0,ly:0},fire:false};
const BTN={f:false,b:false,l:false,r:false,fire:false};let AUTO=false;
function initMobile(){
 if(!('ontouchstart' in window))return;
 document.getElementById('touch').style.display='block';
 const stick=document.getElementById('stick'),knob=document.getElementById('knob');
 function setKnob(dx,dy){knob.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px))';}
 function tstart(ev){for(const t of ev.changedTouches){
   const el=document.elementFromPoint(t.clientX,t.clientY);
   if(el&&el.id==='fireBtn'){TOUCH.fire=true;if(ev.cancelable)ev.preventDefault();continue;}
   if(t.clientX<innerWidth*0.45&&TOUCH.move.id===null){TOUCH.move.id=t.identifier;TOUCH.move.ox=t.clientX;TOUCH.move.oy=t.clientY;
     TOUCH.move.dx=0;TOUCH.move.dy=0;stick.style.display='block';stick.style.left=(t.clientX-55)+'px';stick.style.top=(t.clientY-55)+'px';setKnob(0,0);}
   else if(TOUCH.look.id===null){TOUCH.look.id=t.identifier;TOUCH.look.lx=t.clientX;TOUCH.look.ly=t.clientY;}
  } if(ev.cancelable)ev.preventDefault();}
 function tmove(ev){for(const t of ev.changedTouches){
   if(t.identifier===TOUCH.move.id){let dx=t.clientX-TOUCH.move.ox,dy=t.clientY-TOUCH.move.oy;const d=Math.hypot(dx,dy),max=55;
     if(d>max){dx*=max/d;dy*=max/d;}TOUCH.move.dx=dx/max;TOUCH.move.dy=dy/max;setKnob(dx,dy);}
   else if(t.identifier===TOUCH.look.id){camYaw-=(t.clientX-TOUCH.look.lx)*0.006;camPitch=clamp(camPitch+(t.clientY-TOUCH.look.ly)*0.006,-0.15,0.75);TOUCH.look.lx=t.clientX;TOUCH.look.ly=t.clientY;}
  } if(ev.cancelable)ev.preventDefault();}
 function tend(ev){for(const t of ev.changedTouches){
   if(t.identifier===TOUCH.move.id){TOUCH.move.id=null;TOUCH.move.dx=0;TOUCH.move.dy=0;stick.style.display='none';}
   if(t.identifier===TOUCH.look.id)TOUCH.look.id=null;}}
 const el=document.getElementById('touch');
 el.addEventListener('touchstart',tstart,{passive:false});
 el.addEventListener('touchmove',tmove,{passive:false});
 el.addEventListener('touchend',tend);el.addEventListener('touchcancel',tend);
 const fb=document.getElementById('fireBtn');
 fb.addEventListener('touchstart',e=>{e.preventDefault();TOUCH.fire=true;},{passive:false});
 fb.addEventListener('touchend',e=>{e.preventDefault();TOUCH.fire=false;},{passive:false});
 document.getElementById('swapBtn').addEventListener('touchstart',e=>{e.preventDefault();if(state==='play')switchWeapon((player.wi+1)%WEAPONS.length);},{passive:false});
}

/* ---------- combat helpers ---------- */
function worldDir(){const v=new T.Vector3();camera.getWorldDirection(v);return v;}
function muzzle(side){return {x:player.x-Math.sin(player.ang)*-0.55*side,z:player.z-Math.cos(player.ang)*-0.55*side};}
function shoot(){
 const w=WEAPONS[player.wi];
 if(player.reloading)return;
 if(player.mags[player.wi]<=0){startReload();return;}
 player.mags[player.wi]--;player.fireCd=w.fire;
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);
 const pitch=clamp(0.34-camPitch,-0.7,0.7);
 const dy0=Math.sin(pitch),hz=Math.max(0.15,Math.cos(pitch));
 const base=Math.atan2(fx,fz);
 const mx0=player.x+fx*1.0,mz0=player.z+fz*1.0,my0=1.75;
 for(let i=0;i<w.pellets;i++){
   const a=base+rnd(-w.spread,w.spread);
   const dir=new T.Vector3(Math.sin(a)*hz,dy0+rnd(-w.spread,w.spread)*0.5,Math.cos(a)*hz).normalize();
   const m=sph(w.rocket?0.3:0.16,w.color,8);
   m.position.set(mx0,my0,mz0);
   scene.add(m);
   bullets.push({m,x:mx0,y:my0,z:mz0,dx:dir.x,dy:dir.y,dz:dir.z,spd:w.speed,
     dmg:w.dmg,owner:'p',life:w.rocket?3:2.2,color:w.color,pierce:w.pierce||0,rocket:!!w.rocket,hit:null});
 }
 sfx(w.sfx||'pistol');
 const g=player.mesh.userData.gun;g.scale.set(1,1,1.55);
 setTimeout(()=>{g.scale.set(1,1,1);},70);
 burst(mx0,my0,mz0,w.color,5,3);
 shake=Math.min(shake+w.fire*2,0.5);
}
function eshot(e,tx,tz,ty,spd,dmg){
 const dx=tx-e.x,dy=ty-e.cy,dz=tz-e.z,L=Math.hypot(dx,dy,dz)||1;
 const m=sph(0.16,e.monsterColor,8);m.position.set(e.x,e.cy,e.z);scene.add(m);
 bullets.push({m,x:e.x,y:e.cy,z:e.z,dx:dx/L,dy:dy/L,dz:dz/L,spd,dmg,owner:'e',life:3,color:e.monsterColor});
 const now=performance.now();if(now-(eshot._t||0)>110){eshot._t=now;sfx('eshot');}
}
function explode(x,y,z,radius,dmg,color){
 sfx('explode');burst(x,y,z,color,26,9);burst(x,y,z,'#ffe08a',12,6);shake=Math.min(shake+0.9,1.2);
 for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.z-z);
  if(d<radius+e.r){const f=Math.max(0.3,1-d/(radius+e.r));e.hp-=dmg*f;e.flash=0.4;if(e.hp<=0)killEnemy(e);}}
 if(boss&&!boss.dead){const d=Math.hypot(boss.x-x,boss.z-z);
  if(d<radius+boss.r){boss.hp-=dmg*Math.max(0.3,1-d/(radius+boss.r));boss.flash=0.4;if(boss.hp<=0)killBoss();}}
}
function burst(x,y,z,color,n,spd){
 if(LOW)n=Math.max(2,Math.round(n*0.5));
 if(parts.length>240)n=Math.min(n,5);
 for(let i=0;i<n;i++){const s=sph(rnd(0.1,0.24),color,6);s.position.set(x,y,z);scene.add(s);
  parts.push({m:s,vx:rnd(-1,1)*spd,vy:rnd(0.4,1.4)*spd,vz:rnd(-1,1)*spd,life:1,max:rnd(0.3,0.7)});}
}
function spark(x,y,z,color){burst(x,y,z,color,LOW?2:3,3.4);}
function spawnPoint(minDist){
 let x=0,z=0,t=0;
 do{const a=rnd(0,TAU),d=rnd(minDist,minDist+16);
  x=player.x+Math.cos(a)*d;z=player.z+Math.sin(a)*d;
  x=clamp(x,-HW+3,HW-3);z=clamp(z,-HD+3,HD-3);
 }while(hitWalls(x,z,1.4)&&++t<60);
 return {x,z};
}
function spawnEnemy(type){
 const c=ETYPE[type],p=spawnPoint(26);
 const mesh=buildMonster(c.color,c.scale);mesh.position.set(p.x,0,p.z);mesh.rotation.y=Math.PI;scene.add(mesh);
 enemies.push({type,x:p.x,z:p.z,r:0.95*c.scale,cy:1.9*c.scale,mesh,hp:c.hp,maxHp:c.hp,scale:c.scale,
  speed:c.speed*(1+(mode==='free'?wave*0.02:level*0.02)),dmg:c.dmg,fire:c.fire,range:c.range,
  fireCd:rnd(0.8,2),flash:0,dead:false,wob:rnd(0,6.28),monsterColor:c.color,score:c.score,ang:0});
}
function spawnBoss(key){
 const c=BOSSES[key],p=spawnPoint(30);
 const mesh=buildBoss(key,c.color);mesh.position.set(p.x,0,p.z);mesh.rotation.y=Math.PI;scene.add(mesh);
 const sc=1+(mode==='campaign'?level*0.05:wave*0.02);
 boss={key,type:c.name,x:p.x,z:p.z,r:1.9,cy:3.6,mesh,hp:c.hp*sc,maxHp:c.hp*sc,speed:c.speed,dmg:c.dmg,
  contact:c.contact,fire:c.fire,atks:c.atks,fireCd:2,atkCd:2,phase:1,flash:0,dead:false,state:'idle',t:0,ang:0,dashA:0,
  monsterColor:c.color};
 sfx('boss');
}
function startWave(){
 wave++;bossSpawned=false;spawnQueue.length=0;
 const n=(mode==='campaign')?(4+level+wave*2):(3+Math.floor(wave*1.6));
 for(let i=0;i<n;i++){
  const r=Math.random();let type='grunt';
  if(wave>=2&&r<0.28)type='runner';
  else if(wave>=3&&r>0.82)type='tank';
  else if(wave>=4&&r>0.68&&r<0.78)type='sniper';
  spawnQueue.push(type);
 }
 announce('WAVE '+wave,(mode==='campaign'?LEVELS[level].name:'SURVIVAL'));
 sfx('wave');updateHud();
}
function killEnemy(e){e.dead=true;score+=e.score;sfx('kill');burst(e.x,e.cy,e.z,e.monsterColor,18,7);
 scene.remove(e.mesh);dispose(e.mesh);
 const r=Math.random();if(r<0.14)addPickup(e.x,e.z,'hp');else if(r<0.27)addPickup(e.x,e.z,'ammo');}
function killBoss(){boss.dead=true;score+=1500;sfx('explode');sfx('clear');
 burst(boss.x,boss.cy,boss.z,boss.monsterColor,60,12);burst(boss.x,boss.cy,boss.z,'#ffe08a',30,9);shake=1.6;
 scene.remove(boss.mesh);dispose(boss.mesh);boss=null;
 if(mode==='campaign')levelClear();}
function addPickup(x,z,type){
 const m=new T.Mesh(new T.BoxGeometry(0.7,0.7,0.7),new T.MeshBasicMaterial({color:new T.Color(type==='hp'?'#5cffb0':'#ffe08a')}));
 m.position.set(x,1.0,z);scene.add(m);pickups.push({x,z,m,type,life:18});}
function startReload(){const w=WEAPONS[player.wi];if(player.reloading||player.mags[player.wi]>=w.mag)return;player.reloading=true;player.reload=w.reload;sfx('reload');}
function switchWeapon(i){if(i<0||i>=WEAPONS.length||i===player.wi)return;player.wi=i;player.reloading=false;player.reload=0;player.fireCd=0.15;
 if(player.mesh){player.mesh.userData.gun.material.color.set(WEAPONS[i].color);player.mesh.userData.gun.scale.z=i===2?1.35:(i===3?1.85:(i===4?1.55:1.1));}updateHud();}
function tryDash(){if(player.dashCd>0||state!=='play')return;player.dashCd=1.2;player.dashT=0.16;sfx('dash');
 player.dx=Math.sin(player.ang);player.dz=Math.cos(player.ang);}
function playerHit(d){if(state!=='play')return;player.hp-=d;player.hitFlash=1;shake=Math.min(shake+0.5,1);sfx('hurt');
 burst(player.x,1.6,player.z,'#ff5c7a',8,5);updateHud();
 if(player.hp<=0){player.hp=0;updateHud();state='dead';sfx('dead');showCenter('MISSION FAILED','Score '+score+' · wave '+wave,'↻ RETRY');}}
function moveXZ(o,dx,dz){if(!hitWalls(o.x+dx,o.z,o.r))o.x+=dx;if(!hitWalls(o.x,o.z+dz,o.r))o.z+=dz;}
