"use strict";
/* ============================================================
   NEON STRIKE 3D  —  block-style third person shooter
   Part 1/3 : boot, renderer, world, characters, maps
   ============================================================ */
const T=THREE;
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const IS_TOUCH=('ontouchstart' in window)||((navigator.maxTouchPoints||0)>0);
const LOW=IS_TOUCH;

/* ---------- renderer / scene ---------- */
const cv=document.getElementById('game');
const renderer=new T.WebGLRenderer({canvas:cv,antialias:!LOW,powerPreference:'high-performance'});
const MAXPR=LOW?1.5:2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,MAXPR));
renderer.shadowMap.enabled=!LOW;
renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(64,1,0.1,1000);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

const hemi=new T.HemisphereLight(0xffffff,0x5a6a7a,0.9);scene.add(hemi);
const sun=new T.DirectionalLight(0xffffff,1.15);
sun.castShadow=!LOW;sun.shadow.mapSize.set(LOW?1024:2048,LOW?1024:2048);
const SC=120;
sun.shadow.camera.left=-SC;sun.shadow.camera.right=SC;sun.shadow.camera.top=SC;sun.shadow.camera.bottom=-SC;
sun.shadow.camera.near=1;sun.shadow.camera.far=480;
scene.add(sun);scene.add(sun.target);
const ambient=new T.AmbientLight(0xffffff,0.18);scene.add(ambient);

/* ---------- tiny helpers ---------- */
function mat(c,extra){return new T.MeshLambertMaterial(Object.assign({color:new T.Color(c)},extra||{}));}
function box(w,h,d,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.castShadow=true;m.receiveShadow=true;return m;}
function sph(r,c,seg){const m=new T.Mesh(new T.SphereGeometry(r,seg||10,seg||10),new T.MeshBasicMaterial({color:new T.Color(c)}));return m;}
function P(g,w,h,d,c,x,y,z){const b=box(w,h,d,c);b.position.set(x,y,z);g.add(b);return b;}

/* ---------- block characters (Sandbox style) ---------- */
function buildHero(){
 const g=new T.Group();
 /* A bulky field operator: body armour, utility belt, helmet and rifle. */
 P(g,1.34,1.38,0.72,'#3b4652',0,1.32,0);
 P(g,1.05,0.52,0.68,'#202833',0,0.55,0);
 P(g,0.5,1.02,0.54,'#28343d',-0.34,0.03,0);
 P(g,0.5,1.02,0.54,'#28343d',0.34,0.03,0);
 P(g,0.42,1.08,0.46,'#65727b',-0.88,1.34,0);
 P(g,0.42,1.08,0.46,'#65727b',0.88,1.34,0);
 P(g,0.9,0.88,0.82,'#b87951',0,2.42,0);
 P(g,1.02,0.3,0.94,'#202833',0,2.85,0);
 P(g,1.16,0.16,0.98,'#303c47',0,3.02,0);
 P(g,0.18,0.18,0.08,'#d9e4e8',-0.22,2.48,-0.44);
 P(g,0.18,0.18,0.08,'#d9e4e8',0.22,2.48,-0.44);
 P(g,0.1,0.1,0.05,'#18222b',-0.22,2.48,-0.49);
 P(g,0.1,0.1,0.05,'#18222b',0.22,2.48,-0.49);
 P(g,0.26,0.34,0.18,'#171d24',-0.42,1.22,-0.4);
 P(g,0.26,0.34,0.18,'#171d24',0.42,1.22,-0.4);
 const gun=P(g,0.22,0.24,1.08,'#1a2229',0.58,1.36,-0.68);
 P(g,0.12,0.16,0.34,'#8b6a43',0.58,1.12,-1.12);
 g.userData.gun=gun;
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 return g;
}
function buildMonster(color,scale){
 const s=scale||1;const g=new T.Group();
 /* Human hostile: tactical vest, helmet, skin and compact rifle. */
 const uniform='#39444d',dark='#1e272e',skin='#a86f4e';
 P(g,1.28*s,1.3*s,0.72*s,uniform,0,1.25*s,0);
 P(g,1.02*s,0.46*s,0.66*s,dark,0,0.5*s,0);
 P(g,0.46*s,0.88*s,0.5*s,dark,-0.34*s,0.03*s,0);
 P(g,0.46*s,0.88*s,0.5*s,dark,0.34*s,0.03*s,0);
 P(g,0.38*s,1.0*s,0.44*s,uniform,-0.82*s,1.25*s,0);
 P(g,0.38*s,1.0*s,0.44*s,uniform,0.82*s,1.25*s,0);
 P(g,0.82*s,0.86*s,0.78*s,skin,0,2.35*s,0);
 P(g,0.98*s,0.28*s,0.9*s,dark,0,2.77*s,0);
 P(g,1.12*s,0.15*s,0.94*s,uniform,0,2.94*s,0);
 P(g,0.18*s,0.16*s,0.07*s,'#d8e1e4',-0.2*s,2.4*s,-0.42*s);
 P(g,0.18*s,0.16*s,0.07*s,'#d8e1e4',0.2*s,2.4*s,-0.42*s);
 P(g,0.08*s,0.08*s,0.05*s,'#111820',-0.2*s,2.4*s,-0.47*s);
 P(g,0.08*s,0.08*s,0.05*s,'#111820',0.2*s,2.4*s,-0.47*s);
 P(g,0.24*s,0.32*s,0.18*s,dark,-0.4*s,1.2*s,-0.4*s);
 P(g,0.24*s,0.32*s,0.18*s,dark,0.4*s,1.2*s,-0.4*s);
 P(g,0.2*s,0.22*s,0.9*s,'#151c22',0.55*s,1.28*s,-0.62*s);
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 return g;
}
function buildBoss(type,color){
 const g=buildMonster(color,1.9);
 /* crown / horns */
 const crown=P(g,1.1,0.28,1.05,'#ffd24a',0,4.25,0);
 const spike=P(g,0.18,0.5,0.18,'#ffd24a',0,4.6,0);
 P(g,0.18,0.4,0.18,'#ffd24a',-0.42,4.55,0);
 P(g,0.18,0.4,0.18,'#ffd24a',0.42,4.55,0);
 if(type==='titan'){P(g,1.5,0.5,1.2,'#8a90d8',-1.0,1.6,0);P(g,1.5,0.5,1.2,'#8a90d8',1.0,1.6,0);}
 if(type==='reaper'){P(g,0.12,1.6,0.12,'#e8e8ff',0.9,1.4,0.2).rotation.x=0.3;}
 if(type==='warden'){P(g,1.8,0.3,1.4,'#ffb02e',0,0.2,0);}
 g.userData.crown=crown;
 return g;
}

/* ---------- maps ---------- */
const HW=62, HD=46;   /* default half extents */
function wall(cx,cz,w,d,h,top){return {cx,cz,w,d,h:h||7,top:top};}
const MAPS=[
 {name:'NEON CITY',diff:'Easy',deco:'city',sky:'#1b2440',fog:'#26325c',ground:'#3a4560',ground2:'#333d55',
  wall:'#4a5a86',wallTop:'#7cf6ff',accent:'#7cf6ff',
  spawn:{x:0,z:34},
  blocks:[wall(-22,-10,14,14,9),wall(22,-10,14,14,9),wall(-22,12,14,14,9),wall(22,12,14,14,9),wall(0,0,10,18,12),wall(-36,20,10,10,7),wall(36,20,10,10,7),wall(-38,-22,10,10,7),wall(38,-22,10,10,7)]},
 {name:'JUNGLE RUINS',diff:'Medium',deco:'jungle',sky:'#5aa9e6',fog:'#a8d8b0',ground:'#3f7a35',ground2:'#4a8c3d',
  wall:'#6b6f5a',wallTop:'#9be86a',accent:'#9be86a',
  spawn:{x:0,z:30},
  blocks:[wall(-20,-8,12,12,8),wall(20,-8,12,12,8),wall(-20,14,12,12,8),wall(20,14,12,12,8),wall(0,0,16,6,5),wall(-40,26,8,8,6),wall(40,-26,8,8,6)]},
 {name:'DESERT FORT',diff:'Medium',deco:'desert',sky:'#ffd89b',fog:'#f2d9a8',ground:'#d9b46a',ground2:'#e0bd77',
  wall:'#a9814a',wallTop:'#ffcf7a',accent:'#ffcf7a',
  spawn:{x:0,z:30},
  blocks:[wall(-30,0,6,40,10),wall(30,0,6,40,10),wall(0,-30,40,6,10),wall(-14,12,10,10,6),wall(14,12,10,10,6),wall(0,20,6,18,6)]},
 {name:'ICE CAVERN',diff:'Medium',deco:'ice',sky:'#123246',fog:'#4f8fb0',ground:'#9fd8ea',ground2:'#abdff0',
  wall:'#4f86a6',wallTop:'#cdf3ff',accent:'#8ef0ff',
  spawn:{x:0,z:30},
  blocks:[wall(-22,-8,14,12,9),wall(22,-8,14,12,9),wall(-22,14,14,12,9),wall(22,14,14,12,9),wall(0,2,8,22,11),wall(-42,22,8,8,6),wall(42,22,8,8,6)]},
 {name:'SPACE STATION',diff:'Hard',deco:'space',sky:'#05050f',fog:'#141433',ground:'#2b2b4a',ground2:'#33335a',
  wall:'#4a4a80',wallTop:'#b0a0ff',accent:'#b0a0ff',
  spawn:{x:0,z:34},
  blocks:[wall(-18,-6,4,26,9),wall(18,-6,4,26,9),wall(-18,20,4,22,9),wall(18,20,4,22,9),wall(0,-20,20,4,9),wall(-38,-24,10,10,7),wall(38,24,10,10,7),wall(0,10,14,4,6)]},
 {name:'VOLCANO CORE',diff:'Hard',deco:'volcano',sky:'#3a1408',fog:'#6b2a12',ground:'#4a2418',ground2:'#55291b',
  wall:'#8a4020',wallTop:'#ff8a45',accent:'#ff9f43',
  spawn:{x:-44,z:30},
  blocks:[wall(0,-8,18,20,12),wall(-28,20,10,10,7),wall(28,20,10,10,7),wall(-28,-26,10,10,7),wall(28,-26,10,10,7),wall(0,26,16,5,6)]},
 {name:'TOXIC WASTE',diff:'Medium',deco:'toxic',sky:'#3f4a1c',fog:'#7a8a3a',ground:'#4a5a24',ground2:'#55662a',
  wall:'#6b7a2a',wallTop:'#c9ff4a',accent:'#b6ff5c',
  spawn:{x:0,z:-34},
  blocks:[wall(-24,-10,12,12,8),wall(0,-10,12,12,8),wall(24,-10,12,12,8),wall(-30,16,12,12,8),wall(0,16,20,6,6),wall(30,16,12,12,8)]},
 {name:'SKY TEMPLE',diff:'Hard',deco:'temple',sky:'#8fc9ff',fog:'#cfe6ff',ground:'#cfd8e0',ground2:'#dbe3ea',
  wall:'#b8c4d0',wallTop:'#8fd8ff',accent:'#a8e6ff',
  spawn:{x:0,z:32},
  blocks:[wall(-24,-6,10,10,11),wall(24,-6,10,10,11),wall(-24,18,10,10,11),wall(24,18,10,10,11),wall(0,-14,6,24,13),wall(-42,0,8,26,11),wall(42,0,8,26,11)]},
 {name:'ARCTIC BASE',diff:'Medium',deco:'arctic',sky:'#bcd8ea',fog:'#dceaf4',ground:'#e8f2f8',ground2:'#f2f8fc',
  wall:'#a8c4d8',wallTop:'#8fd0ff',accent:'#cdeeff',
  spawn:{x:-40,z:-30},
  blocks:[wall(-10,-2,26,4,8),wall(24,0,4,22,8),wall(-10,20,26,4,8),wall(24,-24,4,16,8),wall(-46,18,10,10,7),wall(6,-26,10,10,7)]},
 {name:'NIGHTMARE',diff:'Insane',deco:'nightmare',sky:'#140826',fog:'#2a1148',ground:'#2a1a44',ground2:'#331f52',
  wall:'#5a2a86',wallTop:'#c77dff',accent:'#e0aaff',
  spawn:{x:0,z:40},
  blocks:[wall(-30,-16,4,30,11),wall(30,-16,4,30,11),wall(-30,20,4,30,11),wall(30,20,4,30,11),wall(0,-30,18,4,10),wall(0,30,18,4,10),wall(0,0,16,4,7)]}
];

/* ---------- world build ---------- */
let world=new T.Group();scene.add(world);
function dispose(group){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.dispose)o.material.dispose();}});scene.remove(group);}
function mkRng(seed){let s=seed>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

let colliders=[],MAP=MAPS[0];

function buildWorld(m){
 if(world)dispose(world);
 world=new T.Group();scene.add(world);
 MAP=m;colliders=[];
 scene.background=new T.Color(m.sky);
 scene.fog=new T.Fog(new T.Color(m.fog),55,260);

 /* ground */
 const gm=new T.Mesh(new T.BoxGeometry(HW*2,2,HD*2),mat(m.ground));
 gm.position.set(0,-1,0);gm.receiveShadow=true;world.add(gm);
 /* checker tiles */
 const rng=mkRng(hash(m.name));
 const tile=6;
 for(let x=-HW;x<HW;x+=tile)for(let z=-HD;z<HD;z+=tile){
   if(rng()>0.55)continue;
   const t=new T.Mesh(new T.BoxGeometry(tile-0.4,0.12,tile-0.4),mat(m.ground2));
   t.position.set(x+tile/2,0.06,z+tile/2);t.receiveShadow=true;world.add(t);
 }
 /* perimeter walls */
 const per=[[0,-HD,HW*2,2],[0,HD,HW*2,2],[-HW,0,2,HD*2],[HW,0,2,HD*2]];
 per.forEach(p=>addBlock(p[0],p[1],p[2],p[3],9));
 function addBlock(cx,cz,w,d,h){
   const b=new T.Mesh(new T.BoxGeometry(w,h,d),mat(m.wall));
   b.position.set(cx,h/2,cz);b.castShadow=true;b.receiveShadow=true;world.add(b);
   const top=new T.Mesh(new T.BoxGeometry(w,0.5,d),mat(m.wallTop));
   top.position.set(cx,h+0.25,cz);top.castShadow=true;world.add(top);
   colliders.push({cx,cz,w,d});
 }
 m.blocks.forEach(b=>addBlock(b.cx,b.cz,b.w,b.d,b.h));

 /* decorations */
 const N=m.deco==='jungle'?150:(m.deco==='city'?90:110);
 for(let i=0;i<N;i++){
   const x=rnd(-HW+3,HW-3),z=rnd(-HD+3,HD-3);
   if(Math.hypot(x-m.spawn.x,z-m.spawn.z)<8)continue;
   if(colliders.some(c=>Math.abs(x-c.cx)<c.w/2+2&&Math.abs(z-c.cz)<c.d/2+2))continue;
   deco(m,x,z,rng);
 }
 sun.position.set(60,140,50);sun.target.position.set(0,0,0);
}
function deco(m,x,z,rng){
 const g=new T.Group();g.position.set(x,0,z);
 const k=rng();
 function add(mesh){world.add(mesh);}
 if(m.deco==='jungle'){
   if(k<0.62){const h=4+rng()*4;add(cyl(x,z,0.5,h,'#6b4a2a'));treeTop(x,z,h,rng);}
   else{add(cubeAt(x,z,2.4,2.2,2.4,'#2f7a2a'));}
 } else if(m.deco==='city'){
   if(k<0.5){const h=8+rng()*14,w=3+rng()*3;add(building(x,z,w,h,'#5a6a8a','#7cf6ff',rng));}
   else if(k<0.8){add(cubeAt(x,z,2.0,1.4,4.2,'#c0392b'));}
   else{add(cyl(x,z,0.18,5,'#39404d'));const l=sph(0.4,'#ffe08a');l.position.set(x,5.2,z);add(l);}
 } else if(m.deco==='desert'){
   if(k<0.5){add(cyl(x,z,0.45,4,'#3f7a35'));const a=cyl(x,z,0.3,2,'#3f7a35');a.position.set(x-1,2,z);add(a);const b=cyl(x,z,0.3,2.4,'#3f7a35');b.position.set(x+1,2.4,z);add(b);}
   else{add(cubeAt(x,z,2+rng()*2,1.2,2,'#c8a86a'));}
 } else if(m.deco==='ice'){
   if(k<0.6){const h=3+rng()*5;const c=new T.Mesh(new T.ConeGeometry(1.2,h,5),mat('#bfe9ff'));c.position.set(x,h/2,z);c.castShadow=true;add(c);}
   else{add(cubeAt(x,z,2.5,1.6,2.5,'#dff2ff'));}
 } else if(m.deco==='space'){
   if(k<0.5){add(building(x,z,3,7,'#3a3a66','#b0a0ff',rng));}
   else{add(cubeAt(x,z,2.4,2.4,2.4,'#55558a'));}
 } else if(m.deco==='volcano'){
   if(k<0.5){const c=new T.Mesh(new T.ConeGeometry(2+rng()*2,3+rng()*4,6),mat('#6b2a17'));c.position.set(x,2,z);c.castShadow=true;add(c);}
   else{const p=sph(1.2,'#ff7a30');p.position.set(x,0.4,z);p.scale.y=0.3;add(p);}
 } else if(m.deco==='toxic'){
   if(k<0.5){add(cyl(x,z,0.9,2.4,'#8a1f1f'));const t=sph(0.95,'#c0392b');t.position.set(x,2.4,z);add(t);}
   else{const p=sph(1.6,'#9be83f');p.position.set(x,0.3,z);p.scale.y=0.22;add(p);}
 } else if(m.deco==='temple'){
   if(k<0.55){const h=5+rng()*4;add(cyl(x,z,0.7,h,'#dfe6ee'));const c=cyl(x,z,1.0,0.6,'#8fd8ff');c.position.set(x,h+0.3,z);add(c);}
   else{add(cubeAt(x,z,2.2,2.2,2.2,'#c8d2dc'));}
 } else if(m.deco==='arctic'){
   if(k<0.5){add(cubeAt(x,z,2.6,2.8,2.6,'#b8d0e0'));}
   else{add(cyl(x,z,0.16,6,'#68707e'));const f=new T.Mesh(new T.PlaneGeometry(2,1.2),mat('#2ec4b6',{side:T.DoubleSide}));f.position.set(x+1,5.6,z);add(f);}
 } else { /* nightmare */
   if(k<0.5){const c=new T.Mesh(new T.ConeGeometry(1.6,5,4),mat('#8a4aff'));c.position.set(x,2.5,z);c.castShadow=true;add(c);}
   else{add(cubeAt(x,z,1.6,3,1.6,'#3a1f5a'));}
 }
}
function cubeAt(x,z,w,h,d,c){const b=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));b.position.set(x,h/2,z);b.castShadow=true;b.receiveShadow=true;return b;}
function cyl(x,z,r,h,c){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,8),mat(c));m.position.set(x,h/2,z);m.castShadow=true;m.receiveShadow=true;return m;}
function building(x,z,w,h,c,trim,rng){const g=new T.Group();const b=new T.Mesh(new T.BoxGeometry(w,h,w),mat(c));b.position.set(x,h/2,z);b.castShadow=true;b.receiveShadow=true;g.add(b);
 for(let i=1;i<h;i+=2){const win=new T.Mesh(new T.BoxGeometry(w*0.75,0.5,0.06),new T.MeshBasicMaterial({color:new T.Color(trim)}));
  win.position.set(x,i,z-w/2-0.04);g.add(win);const win2=win.clone();win2.position.z=z+w/2+0.04;g.add(win2);}
 world.add(g);return g;}
function treeTop(x,z,h,rng){const c=new T.Mesh(new T.BoxGeometry(3.4,2.6,3.4),mat('#2f6b26'));c.position.set(x,h,z);c.castShadow=true;world.add(c);
 const c2=new T.Mesh(new T.BoxGeometry(2.4,2.0,2.4),mat('#3f8a33'));c2.position.set(x,h+1.8,z);c2.castShadow=true;world.add(c2);
 const c3=new T.Mesh(new T.BoxGeometry(1.4,1.4,1.4),mat('#4fa63d'));c3.position.set(x,h+3.2,z);c3.castShadow=true;world.add(c3);}

/* collision helpers (XZ) */
function circleRect(cx,cz,r,R){const nx=clamp(cx,R.cx-R.w/2,R.cx+R.w/2),nz=clamp(cz,R.cz-R.d/2,R.cz+R.d/2);return (cx-nx)**2+(cz-nz)**2<r*r;}
function hitWalls(x,z,r){for(let i=0;i<colliders.length;i++){if(circleRect(x,z,r,colliders[i]))return true;}return false;}
function los(x1,z1,x2,z2){const n=Math.ceil(Math.hypot(x2-x1,z2-z1)/2.5);for(let i=1;i<n;i++){const t=i/n;if(hitWalls(x1+(x2-x1)*t,z1+(z2-z1)*t,0.6))return false;}return true;}
/* swept collisions: a fast bullet must not tunnel past a target between frames */
function segHit(px,py,pz,qx,qy,qz,cx,cy,cz,r){
 const dx=qx-px,dy=qy-py,dz=qz-pz;const L2=dx*dx+dy*dy+dz*dz;
 let t=L2>0?((cx-px)*dx+(cy-py)*dy+(cz-pz)*dz)/L2:0;t=t<0?0:(t>1?1:t);
 const ex=px+dx*t-cx,ey=py+dy*t-cy,ez=pz+dz*t-cz;
 return (ex*ex+ey*ey+ez*ez)<(r*r);
}
function segHitsWalls(x1,z1,x2,z2){
 const d=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.ceil(d/0.4));
 for(let i=1;i<=n;i++){const t=i/n;if(hitWalls(x1+(x2-x1)*t,z1+(z2-z1)*t,0.18))return true;}
 return false;
}

/* ============================================================
   Part 2 : state, input, weapons, combat helpers
   ============================================================ */
const SHAD=52;
sun.shadow.camera.left=-SHAD;sun.shadow.camera.right=SHAD;sun.shadow.camera.top=SHAD;sun.shadow.camera.bottom=-SHAD;
sun.shadow.camera.updateProjectionMatrix();

const WEAPONS=[
 {name:'PISTOL', mag:30,reload:1.0,fire:0.12,dmg:18,spread:0.012,pellets:1,speed:95, color:'#ffe08a',sfx:'pistol'},
 {name:'SMG',    mag:45,reload:1.25,fire:0.06,dmg:11,spread:0.038,pellets:1,speed:105,color:'#7cf6ff',sfx:'smg'},
 {name:'SHOTGUN',mag:8, reload:1.6, fire:0.78,dmg:13,spread:0.09, pellets:9,speed:80, color:'#ffb02e',sfx:'shotgun'},
 {name:'SNIPER', mag:6, reload:1.9, fire:1.0, dmg:90,spread:0.002,pellets:1,speed:230,color:'#5cffb0',pierce:3,sfx:'sniper'},
 {name:'ROCKET', mag:4, reload:2.2, fire:1.3, dmg:55,spread:0.006,pellets:1,speed:62, color:'#ff5c7a',rocket:true,sfx:'rocket'}
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
 if(player.mesh)player.mesh.userData.gun.material.color.set(WEAPONS[i].color);updateHud();}
function tryDash(){if(player.dashCd>0||state!=='play')return;player.dashCd=1.2;player.dashT=0.16;sfx('dash');
 player.dx=Math.sin(player.ang);player.dz=Math.cos(player.ang);}
function playerHit(d){if(state!=='play')return;player.hp-=d;player.hitFlash=1;shake=Math.min(shake+0.5,1);sfx('hurt');
 burst(player.x,1.6,player.z,'#ff5c7a',8,5);updateHud();
 if(player.hp<=0){player.hp=0;updateHud();state='dead';sfx('dead');showCenter('MISSION FAILED','Score '+score+' · wave '+wave,'↻ RETRY');}}
function moveXZ(o,dx,dz){if(!hitWalls(o.x+dx,o.z,o.r))o.x+=dx;if(!hitWalls(o.x,o.z+dz,o.r))o.z+=dz;}

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
  const px=b.x,py=b.y,pz=b.z;
  b.x+=b.dx*step;b.y+=b.dy*step;b.z+=b.dz*step;
  b.m.position.set(b.x,b.y,b.z);
  let dead=b.life<=0;
  if(!dead&&(b.x<-HW+0.5||b.x>HW-0.5||b.z<-HD+0.5||b.z>HD-0.5||b.y<0.1))dead=true;
  if(!dead&&b.owner==='p'){
   if(segHitsWalls(px,pz,b.x,b.z)){if(b.rocket)explode(b.x,b.y,b.z,7,45,b.color);dead=true;}
   if(!dead)for(const e of enemies){if(e.dead)continue;if(b.hit&&b.hit.indexOf(e)>=0)continue;
    if(segHit(px,py,pz,b.x,b.y,b.z,e.x,e.cy,e.z,e.r+0.45)){
      if(b.rocket){explode(b.x,b.y,b.z,7.5,45,b.color);dead=true;break;}
      e.hp-=b.dmg;e.flash=0.35;spark(b.x,b.y,b.z,b.color);sfx('hit');
      if(e.hp<=0)killEnemy(e);
      if(b.pierce>0){b.pierce--;b.hit=b.hit||[];b.hit.push(e);}else{dead=true;break;}}}
   if(!dead&&boss&&!boss.dead&&segHit(px,py,pz,b.x,b.y,b.z,boss.x,boss.cy,boss.z,boss.r+0.5)){
     if(b.rocket){explode(b.x,b.y,b.z,8,45,b.color);dead=true;}
     else{boss.hp-=b.dmg;boss.flash=0.3;spark(b.x,b.y,b.z,b.color);sfx('hit');
      if(boss.hp<=0)killBoss();if(b.pierce>0)b.pierce--;else dead=true;}}
  }
  if(!dead&&b.owner==='e'){
   if(segHitsWalls(px,pz,b.x,b.z))dead=true;
   else if(segHit(px,py,pz,b.x,b.y,b.z,player.x,1.7,player.z,0.95)){playerHit(b.dmg);dead=true;}
  }
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
    burst(pk.x,1.2,pk.z,pk.type==='hp'?'#5cffb0':'#ffe08a',14,6);sfx('pickup');
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
 if(BTN.f){mx+=fx;mz+=fz;}
 if(BTN.b){mx-=fx;mz-=fz;}
 if(BTN.r){mx+=rx;mz+=rz;}
 if(BTN.l){mx-=rx;mz-=rz;}
 if(TOUCH.move.id!==null){mx+=fx*(-TOUCH.move.dy)+rx*TOUCH.move.dx;mz+=fz*(-TOUCH.move.dy)+rz*TOUCH.move.dx;}
 const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
 player.dashCd=Math.max(0,player.dashCd-dt);
 if(player.dashT>0){player.dashT-=dt;moveXZ(player,player.dx*player.speed*3*dt,player.dz*player.speed*3*dt);burst(player.x,1.0,player.z,'#7cf6ff',1,2);}
 else moveXZ(player,mx*player.speed*dt,mz*player.speed*dt);
 player.x=clamp(player.x,-HW+1.2,HW-1.2);player.z=clamp(player.z,-HD+1.2,HD-1.2);
 const av=worldDir();const al=Math.hypot(av.x,av.z)||1;player.ang=Math.atan2(av.x,av.z);
 player.mesh.rotation.y=Math.atan2(-(av.x/al),-(av.z/al));
 player.walk+=dt*(ml>0.05?11:0);
 if(ml>0.05 && Math.sin(player.walk)>0.96 && (player._stepT||0)<=0){sfxFootstep();player._stepT=0.18;}
 player._stepT=Math.max(0,(player._stepT||0)-dt);
 player.mesh.position.set(player.x,ml>0.05?Math.abs(Math.sin(player.walk))*0.13:0,player.z);

 /* shooting */
 player.fireCd-=dt;
 if((mouseDown||TOUCH.fire||BTN.fire||AUTO)&&player.fireCd<=0&&!player.reloading)shoot();
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
 player.mesh=buildHero();player.mesh.userData.gun.material.color.set(WEAPONS[0].color);
 scene.add(player.mesh);
 player.x=MAP.spawn.x;player.z=MAP.spawn.z;player.hp=player.maxHp;player.ang=0;
 player.wi=0;player.mags=WEAPONS.map(w=>w.mag);player.reloading=false;player.reload=0;player.fireCd=0;
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
const centerBtn=document.getElementById('cBtn');
centerBtn.onclick=e=>{e.preventDefault();e.stopPropagation();centerAction();};
centerBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();centerAction();},{passive:false});
buildLevels();buildMaps();setMode('campaign');
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
function sfxFootstep(){
 const c=ac();if(!c||!SFXM)return;
 sfxNoise(0.055,0.055,520,0.7);
 sfxTone(75,0.055,'sine',0.045,45);
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
  case 'armor': sfxNoise(0.09,0.13,1700,1);sfxTone(180,0.08,'square',0.06,90);break;
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
