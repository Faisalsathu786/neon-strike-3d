/* ============================================================
   Part 3 : update loop, bullets, enemies, boss, waves, camera
   ============================================================ */
function eshotDir(e,a,spd,dmg){
 const m=sph(0.16,e.monsterColor,8);m.position.set(e.x,e.cy,e.z);scene.add(m);
 bullets.push({m,x:e.x,y:e.cy,z:e.z,dx:Math.sin(a),dy:-0.12,dz:Math.cos(a),spd,dmg,owner:'e',life:3,color:e.monsterColor});
}
function moveBullets(dt){
 for(let i=bullets.length-1;i>=0;i--){
  const b=bullets[i];b.life-=dt;
  const step=b.spd*dt;
  b.x+=b.dx*step;b.y+=b.dy*step;b.z+=b.dz*step;
  b.m.position.set(b.x,b.y,b.z);
  let dead=b.life<=0;
  if(!dead&&(b.x<-HW+0.5||b.x>HW-0.5||b.z<-HD+0.5||b.z>HD-0.5||b.y<0.1))dead=true;
  if(!dead&&b.owner==='p'){
   if(hitWalls(b.x,b.z,0.18)){if(b.rocket)explode(b.x,b.y,b.z,7,45,b.color);dead=true;}
   if(!dead)for(const e of enemies){if(e.dead)continue;if(b.hit&&b.hit.indexOf(e)>=0)continue;
    if(Math.hypot(e.x-b.x,e.cy-b.y,e.z-b.z)<e.r+0.4){
      if(b.rocket){explode(b.x,b.y,b.z,7.5,45,b.color);dead=true;break;}
      e.hp-=b.dmg;e.flash=0.35;if(e.hp<=0)killEnemy(e);
      if(b.pierce>0){b.pierce--;b.hit=b.hit||[];b.hit.push(e);}else{dead=true;break;}}}
   if(!dead&&boss&&!boss.dead&&Math.hypot(boss.x-b.x,boss.cy-b.y,boss.z-b.z)<boss.r+0.5){
     if(b.rocket){explode(b.x,b.y,b.z,8,45,b.color);dead=true;}
     else{boss.hp-=b.dmg;boss.flash=0.3;if(boss.hp<=0)killBoss();if(b.pierce>0)b.pierce--;else dead=true;}}
  }
  if(!dead&&b.owner==='e'&&Math.hypot(player.x-b.x,1.7-b.y,player.z-b.z)<1.0){playerHit(b.dmg);dead=true;}
  if(dead){scene.remove(b.m);b.m.geometry.dispose();bullets.splice(i,1);}
 }
}
function update(dt){
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt/p.max;
  p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.vy-=9*dt;
  if(p.life<=0){scene.remove(p.m);p.m.geometry.dispose();parts.splice(i,1);}}
 for(let i=pickups.length-1;i>=0;i--){const pk=pickups[i];pk.life-=dt;pk.m.rotation.y+=dt*2;
  pk.m.position.y=1.0+Math.sin(pk.life*4)*0.16;
  if(pk.life<=0){scene.remove(pk.m);pickups.splice(i,1);continue;}
  if(Math.hypot(player.x-pk.x,player.z-pk.z)<1.6){
    if(pk.type==='hp')player.hp=Math.min(player.maxHp,player.hp+25);
    else{player.mags[player.wi]=WEAPONS[player.wi].mag;player.reloading=false;}
    burst(pk.x,1.2,pk.z,pk.type==='hp'?'#5cffb0':'#ffe08a',14,6);
    scene.remove(pk.m);pickups.splice(i,1);updateHud();}}
 shake*=Math.max(0,1-dt*6);player.hitFlash=Math.max(0,player.hitFlash-dt*4);
 player.contactCd=Math.max(0,player.contactCd-dt);
 if(state!=='play')return;

 /* player move */
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=-fz,rz=fx;
 let mx=0,mz=0;
 if(keys['w']||keys['arrowup']){mx+=fx;mz+=fz;}
 if(keys['s']||keys['arrowdown']){mx-=fx;mz-=fz;}
 if(keys['d']||keys['arrowright']){mx+=rx;mz+=rz;}
 if(keys['a']||keys['arrowleft']){mx-=rx;mz-=rz;}
 if(TOUCH.move.id!==null){mx+=fx*(-TOUCH.move.dy)+rx*TOUCH.move.dx;mz+=fz*(-TOUCH.move.dy)+rz*TOUCH.move.dx;}
 const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
 player.dashCd=Math.max(0,player.dashCd-dt);
 if(player.dashT>0){player.dashT-=dt;moveXZ(player,player.dx*player.speed*3*dt,player.dz*player.speed*3*dt);burst(player.x,1.0,player.z,'#7cf6ff',1,2);}
 else moveXZ(player,mx*player.speed*dt,mz*player.speed*dt);
 player.x=clamp(player.x,-HW+1.2,HW-1.2);player.z=clamp(player.z,-HD+1.2,HD-1.2);
 const av=worldDir();const al=Math.hypot(av.x,av.z)||1;player.ang=Math.atan2(av.x,av.z);
 player.mesh.rotation.y=Math.atan2(-(av.x/al),-(av.z/al));
 player.walk+=dt*(ml>0.05?11:0);
 player.mesh.position.set(player.x,ml>0.05?Math.abs(Math.sin(player.walk))*0.13:0,player.z);

 /* shooting */
 player.fireCd-=dt;
 if((mouseDown||TOUCH.fire)&&player.fireCd<=0&&!player.reloading)shoot();
 if(player.reloading){player.reload-=dt;if(player.reload<=0){player.mags[player.wi]=WEAPONS[player.wi].mag;player.reloading=false;updateHud();}}

 moveBullets(dt);

 /* enemies */
 for(const e of enemies){if(e.dead)continue;
  e.flash=Math.max(0,e.flash-dt*2);e.wob+=dt*3;
  const dx=player.x-e.x,dz=player.z-e.z,d=Math.hypot(dx,dz)||1;
  const see=los(e.x,e.z,player.x,player.z);
  if(d>e.range*0.62||!see){moveXZ(e,(dx/d)*e.speed*dt,(dz/d)*e.speed*dt);}
  e.mesh.position.set(e.x,Math.abs(Math.sin(e.wob))*0.09,e.z);
  e.mesh.rotation.y=Math.atan2(-(dx/d),-(dz/d));
  e.mesh.scale.setScalar(e.flash>0?1+e.flash*0.18:1);
  e.fireCd-=dt;
  if(see&&d<e.range&&e.fireCd<=0){e.fireCd=e.fire;eshot(e,player.x,player.z,1.7,e.type==='sniper'?150:115,e.dmg);}
  if(d<e.r+player.r&&player.contactCd<=0){playerHit(e.dmg*0.6);player.contactCd=0.6;}
 }
 for(let i=0;i<enemies.length;i++){const a=enemies[i];if(a.dead)continue;
  for(let j=i+1;j<enemies.length;j++){const b=enemies[j];if(b.dead)continue;
   const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),min=a.r+b.r;
   if(d>0.001&&d<min){const push=(min-d)/2,ux=dx/d,uz=dz/d;
    if(!hitWalls(a.x-ux*push,a.z-uz*push,a.r)){a.x-=ux*push;a.z-=uz*push;}
    if(!hitWalls(b.x+ux*push,b.z+uz*push,b.r)){b.x+=ux*push;b.z+=uz*push;}}}}
 enemies=enemies.filter(e=>!e.dead);

 /* boss */
 if(boss&&!boss.dead){
  boss.flash=Math.max(0,boss.flash-dt*2);boss.phase=(boss.hp<boss.maxHp*0.5)?2:1;
  const dx=player.x-boss.x,dz=player.z-boss.z,d=Math.hypot(dx,dz)||1,ang=Math.atan2(dx,dz);
  if(boss.state==='dash'){boss.t-=dt;moveXZ(boss,Math.cos(boss.dashA)*17*dt,Math.sin(boss.dashA)*17*dt);if(boss.t<=0)boss.state='idle';}
  else{let vx=0,vz=0;const sp=boss.speed*(boss.phase===2?1.25:1);
   if(d>9){vx=dx/d;vz=dz/d;}else if(d<5.5){vx=-dx/d;vz=-dz/d;}
   moveXZ(boss,vx*sp*dt,vz*sp*dt);}
  boss.mesh.position.set(boss.x,0,boss.z);
  boss.mesh.rotation.y=Math.atan2(-(dx/d),-(dz/d));
  boss.mesh.scale.setScalar(boss.flash>0?1+boss.flash*0.08:1);
  boss.fireCd-=dt;boss.atkCd-=dt;
  if(boss.fireCd<=0){boss.fireCd=boss.fire/(boss.phase===2?1.5:1);eshot(boss,player.x,player.z,1.7,80,boss.dmg);}
  if(boss.atkCd<=0){boss.atkCd=boss.phase===2?rnd(1.4,2.2):rnd(2.2,3.2);
   const atk=boss.atks[Math.floor(Math.random()*boss.atks.length)];
   if(atk==='spread'){const n=boss.phase===2?11:7;for(let i=0;i<n;i++)eshotDir(boss,ang+(i-(n-1)/2)*0.16,72,9);burst(boss.x,boss.cy,boss.z,boss.monsterColor,12,5);}
   else if(atk==='radial'){const n=boss.phase===2?26:18;for(let i=0;i<n;i++)eshotDir(boss,i/n*TAU,62,8);burst(boss.x,boss.cy,boss.z,boss.monsterColor,20,6);}
   else if(atk==='summon'){for(let i=0;i<3+(boss.phase===2?2:0);i++)spawnEnemy(Math.random()<0.5?'runner':'grunt');}
   else if(atk==='dash'){boss.state='dash';boss.t=0.5;boss.dashA=ang;}
  }
  if(d<boss.r+player.r&&player.contactCd<=0){playerHit(boss.contact);player.contactCd=0.85;}
 }

 /* waves */
 spawnTimer-=dt;
 if(spawnQueue.length&&spawnTimer<=0){spawnEnemy(spawnQueue.shift());spawnTimer=rnd(0.45,0.85);}
 if(state==='play'&&!spawnQueue.length&&enemies.length===0&&!boss){
  score+=40*wave;updateHud();
  const L=(mode==='campaign')?LEVELS[level]:null;
  if(L&&wave>=L.waves){
   if(L.boss&&!bossSpawned){bossSpawned=true;spawnBoss(L.boss);announce('⚠ BOSS FIGHT',BOSSES[L.boss].name);updateHud();}
   else levelClear();
  }else if(mode==='free'&&wave%5===0&&!bossSpawned){
   bossSpawned=true;spawnBoss(['hunter','titan','reaper','warden'][Math.floor(wave/5-1)%4]);announce('⚠ BOSS WAVE','Survive');
  }else{state='clear';showCenter('WAVE '+wave+' CLEAR','+'+40*wave+' bonus · Score '+score,'▶ NEXT WAVE');}
 }
}
function updateCamera(dt){
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);
 const dist=9.5,cp=Math.cos(camPitch),sp=Math.sin(camPitch);
 const tx=player.x-fx*dist*cp,tz=player.z-fz*dist*cp,ty=2.0+dist*sp+3.2;
 const k=clamp(dt*9,0,1);
 camera.position.x=lerp(camera.position.x,tx,k);
 camera.position.y=lerp(camera.position.y,ty,k);
 camera.position.z=lerp(camera.position.z,tz,k);
 if(camera.position.y<2.4)camera.position.y=2.4;
 camera.lookAt(player.x,2.2,player.z);
 sun.position.set(player.x+45,120,player.z+40);
 sun.target.position.set(player.x,0,player.z);
 sun.target.updateMatrixWorld();
}
