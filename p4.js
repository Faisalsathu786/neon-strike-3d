/* ============================================================
   Part 4 : HUD, menu, progression, main loop
   ============================================================ */
function announce(txt,sub){
 const el=document.getElementById('wave');
 el.innerHTML=txt+(sub?'<div style="font-size:15px;letter-spacing:2px;color:#dfe6ff;margin-top:8px">'+sub+'</div>':'');
 el.style.transition='none';el.style.opacity='1';
 requestAnimationFrame(()=>{el.style.transition='opacity 1.7s';el.style.opacity='0';});
}
function showCenter(title,sub,btn){
 const c=document.getElementById('center');c.classList.remove('hidden');c.style.display='flex';
 document.getElementById('cTitle').textContent=title;
 document.getElementById('cSub').textContent=sub;
 document.getElementById('cBtn').textContent=btn;
 if(document.exitPointerLock)document.exitPointerLock();
}
function hideCenter(){const c=document.getElementById('center');c.classList.add('hidden');c.style.display='none';}
function buildArmory(){
 const el=document.getElementById('ars');if(!el)return;el.innerHTML='';
 document.getElementById('xpVal').textContent=xp;
 WEAPONS.forEach((w,i)=>{const d=document.createElement('div');const owned=ownedWeapons[i];
  d.className='ar'+(i===selectedLoadout?' on ':' ')+(owned?'':'locked');
  d.innerHTML='<strong>'+w.name+'</strong><b>'+ (owned?'OWNED':w.price+' XP') +'</b>';
  d.onclick=()=>{if(owned){selectedLoadout=i;buildArmory();}else if(xp>=w.price){xp-=w.price;ownedWeapons[i]=true;selectedLoadout=i;try{localStorage.setItem('neon3d_xp',String(xp));localStorage.setItem('neon3d_weapons',JSON.stringify(ownedWeapons.map((v,j)=>v?j:null).filter(v=>v!==null)));}catch(e){}buildArmory();}else announce('NOT ENOUGH XP','Earn XP by completing waves');};
  el.appendChild(d);});
}
function updateHud(){
 const w=WEAPONS[player.wi];
 document.getElementById('score').textContent=score;
 document.getElementById('waveHud').textContent=wave;
 document.getElementById('hpfill').style.width=Math.max(0,player.hp/player.maxHp*100)+'%';
 document.getElementById('ammo').innerHTML=w.name+' · <b>'+player.mags[player.wi]+'</b> / '+w.mag;
 document.getElementById('objT').textContent=(mode==='free'?'SURVIVAL':('LEVEL '+(level+1)+' · '+LEVELS[level].name));
 document.getElementById('objS').textContent=(mode==='free'?'Survival · boss every 5 waves':('Clear '+LEVELS[level].waves+' waves'+(LEVELS[level].boss?' + '+BOSSES[LEVELS[level].boss].name+' BOSS':'')));
 const slots=document.getElementById('wslots');slots.innerHTML='';
 WEAPONS.forEach((wp,i)=>{const d=document.createElement('div');
  d.className='wslot'+(i===player.wi?' on':'');d.innerHTML=wp.name+'<small>'+(i+1)+' · '+player.mags[i]+'</small>';slots.appendChild(d);});
 const bb=document.getElementById('bossbar');
 if(boss&&!boss.dead){bb.style.display='block';
  document.getElementById('bossfill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
  document.getElementById('bosstext').textContent=boss.type+' BOSS  '+Math.ceil(Math.max(0,boss.hp))+' / '+Math.ceil(boss.maxHp);}
 else bb.style.display='none';
}
function buildLevels(){
 const el=document.getElementById('levels');el.innerHTML='';
 LEVELS.forEach((L,i)=>{const c=document.createElement('div');
  const locked=(i+1)>unlocked;c.className='lvcard'+(locked?' locked':'')+(i===level?' sel':'');
  const m=MAPS[L.map];
  c.innerHTML='<div class="swatch" style="background:linear-gradient(90deg,'+m.accent+','+m.wallTop+')"></div>'
   +'<div class="n">LV '+(i+1)+(locked?' 🔒':'')+'</div><div class="mn">'+L.name+'</div>'
   +'<div class="ob">'+m.name+'</div>'
   +(L.boss?'<div class="bs">👾 '+BOSSES[L.boss].name+'</div>':'<div class="bs" style="color:#8b93b8">no boss</div>');
  c.onclick=()=>{if(locked)return;level=i;buildLevels();};
  el.appendChild(c);});
}
function buildMaps(){
 const el=document.getElementById('maps');el.innerHTML='';
 MAPS.forEach((m,i)=>{const c=document.createElement('div');c.className='mapcard'+(i===selMap?' sel':'');
  c.innerHTML='<div class="swatch" style="background:linear-gradient(90deg,'+m.accent+','+m.wallTop+')"></div>'
   +'<div class="nm">'+m.name+'</div><div class="dz">'+m.diff+'</div>';
  c.onclick=()=>{selMap=i;buildMaps();};el.appendChild(c);});
}
function setMode(m){mode=m;
 document.getElementById('tabCamp').classList.toggle('on',m==='campaign');
 document.getElementById('tabFree').classList.toggle('on',m==='free');
 document.getElementById('campWrap').classList.toggle('hidden',m!=='campaign');
 document.getElementById('freeWrap').classList.toggle('hidden',m!=='free');}
function backToMenu(){
 state='menu';
 const c=document.getElementById('center');c.classList.add('hidden');c.style.display='none';
 document.getElementById('menu').classList.remove('hidden');
 document.getElementById('hud').style.display='none';
 document.getElementById('wslots').style.display='none';
 document.getElementById('bossbar').style.display='none';
 document.getElementById('crosshair').style.display='none';
 buildLevels();buildMaps();
}
function startGame(){
 const mi=(mode==='campaign')?LEVELS[level].map:selMap;
 buildWorld(MAPS[mi]);
 if(player.mesh){scene.remove(player.mesh);dispose(player.mesh);}
 player.mesh=buildHero();player.mesh.userData.gun.material.color.set(WEAPONS[selectedLoadout].color);player.mesh.userData.gun.scale.z=selectedLoadout===2?1.35:(selectedLoadout===3?1.85:(selectedLoadout===4?1.55:1.1));
 scene.add(player.mesh);
 player.x=MAP.spawn.x;player.z=MAP.spawn.z;player.hp=player.maxHp;player.ang=0;
 player.wi=selectedLoadout;player.mags=WEAPONS.map(w=>w.mag);player.reloading=false;player.reload=0;player.fireCd=0;inVehicle=false;FAST_RUN=false;const fb=document.getElementById('fastBtn');if(fb)fb.classList.remove('on');const pr=document.getElementById('pcRun');if(pr)pr.classList.remove('on');
 player.dashCd=0;player.dashT=0;player.hitFlash=0;player.walk=0;
 enemies.forEach(e=>scene.remove(e.mesh));enemies=[];
 bullets.forEach(b=>scene.remove(b.m));bullets=[];
 pickups.forEach(p=>scene.remove(p.m));pickups=[];
 parts.forEach(p=>scene.remove(p.m));parts=[];
 boss=null;bossSpawned=false;
 score=0;wave=0;camYaw=0;camPitch=0.34;
 document.getElementById('menu').classList.add('hidden');
 const cc=document.getElementById('center');cc.classList.add('hidden');cc.style.display='none';
 document.getElementById('hud').style.display='flex';
 document.getElementById('wslots').style.display='flex';
 document.getElementById('crosshair').style.display='block';
 document.getElementById('touch').style.display=IS_TOUCH?'block':'none';
 state='play';startWave();updateHud();last=performance.now();
}
function levelClear(){
 state='levelclear';sfx('clear');
 if(mode==='campaign'){unlocked=Math.min(LEVELS.length,Math.max(unlocked,level+2));
  try{localStorage.setItem('neon3d_unlocked',String(unlocked));}catch(e){}}
 const more=(mode==='campaign'&&level+1<LEVELS.length&&level+1<unlocked);
 showCenter(mode==='free'?'SURVIVED':'LEVEL '+(level+1)+' CLEARED','Score '+score,more?'▶ NEXT LEVEL':'☰ MENU');
 if(document.exitPointerLock)document.exitPointerLock();
}
function pauseGame(){if(state!=='play')return;state='pause';showCenter('PAUSED','Score '+score+' · wave '+wave,'▶ RESUME');if(document.exitPointerLock)document.exitPointerLock();}
function resumeGame(){const c=document.getElementById('center');c.classList.add('hidden');c.style.display='none';state='play';last=performance.now();}
function centerAction(){
 const c=document.getElementById('center');c.classList.add('hidden');c.style.display='none';
 if(state==='dead')startGame();
 else if(state==='clear'){startWave();state='play';last=performance.now();}
 else if(state==='levelclear'){if(mode==='campaign'&&level+1<LEVELS.length&&level+1<unlocked){level++;startGame();}else backToMenu();}
 else if(state==='pause')resumeGame();
}

document.getElementById('tabCamp').onclick=()=>setMode('campaign');
document.getElementById('tabFree').onclick=()=>setMode('free');
document.getElementById('start').onclick=startGame;
const enterCarBtn=document.getElementById('enterCar');if(enterCarBtn)enterCarBtn.onclick=e=>{e.preventDefault();toggleVehicle();};
const fastBtnUi=document.getElementById('fastBtn');if(fastBtnUi)fastBtnUi.onclick=e=>{e.preventDefault();e.stopPropagation();toggleFastRun();};
const carBtnUi=document.getElementById('carBtn');if(carBtnUi)carBtnUi.onclick=e=>{e.preventDefault();e.stopPropagation();toggleVehicle();};
const centerBtn=document.getElementById('cBtn');
centerBtn.onclick=e=>{e.preventDefault();e.stopPropagation();centerAction();};
centerBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();centerAction();},{passive:false});
buildLevels();buildMaps();buildArmory();setMode('campaign');
initMobile();

let last=performance.now();
let fpsAcc=0,fpsN=0,prCur=renderer.getPixelRatio();
function loop(now){
 requestAnimationFrame(loop);
 let dt=(now-last)/1000;last=now;if(dt>0.05)dt=0.05;
 fpsAcc+=dt;fpsN++;
 if(fpsN>=45){const avg=fpsAcc/fpsN;fpsAcc=0;fpsN=0;
  if(avg>0.032&&prCur>0.7){prCur=Math.max(0.7,prCur-0.25);renderer.setPixelRatio(prCur);}
  else if(avg<0.019&&prCur<MAXPR){prCur=Math.min(MAXPR,prCur+0.25);renderer.setPixelRatio(prCur);}}
 try{
  update(dt);updateCamera(dt);
  renderer.render(scene,camera);
 }catch(err){ if(!window.__loopErr){window.__loopErr=1;console.error('loop error',err);} }
}
cv.addEventListener('webglcontextlost',e=>{e.preventDefault();showingLost=1;announce('GRAPHICS RESET','Reload if screen stays blank');});
cv.addEventListener('webglcontextrestored',()=>{showingLost=0;});
let showingLost=0;
document.addEventListener('pointerlockerror',()=>{announce('CLICK TO AIM','Tap/click the screen');});
requestAnimationFrame(loop);
