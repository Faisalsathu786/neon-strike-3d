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
 {name:'RIVERSIDE COMPOUND',diff:'Easy',deco:'rural',sky:'#86c7ef',fog:'#b4d7c7',ground:'#3f7f35',ground2:'#518f3d',
  wall:'#8b7358',wallTop:'#c7a477',accent:'#78c66a',
  spawn:{x:0,z:38},
  /* connected rooms and courtyards: thin walls leave doors and sight lines */
  blocks:[wall(-24,-16,22,2,6),wall(-13,-8,2,16,6),wall(-35,-8,2,16,6),
   wall(24,-16,22,2,6),wall(13,-8,2,16,6),wall(35,-8,2,16,6),
   wall(-24,16,22,2,6),wall(-13,24,2,16,6),wall(-35,24,2,16,6),
   wall(24,16,22,2,6),wall(13,24,2,16,6),wall(35,24,2,16,6),
   wall(0,-2,12,2,4),wall(0,19,10,2,4)]},
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

let colliders=[],MAP=MAPS[0],vehicle=null;

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
 /* drivable jeep parked near the spawn */
 const cg=new T.Group();
 const body=new T.Mesh(new T.BoxGeometry(3.2,0.8,5.0),mat('#26343b'));body.position.y=0.8;body.castShadow=true;cg.add(body);
 const cabin=new T.Mesh(new T.BoxGeometry(2.5,1.0,2.2),mat('#57727a'));cabin.position.set(0,1.55,0.25);cabin.castShadow=true;cg.add(cabin);
 for(const x of [-1.35,1.35])for(const z of [-1.55,1.55]){const wh=new T.Mesh(new T.CylinderGeometry(0.42,0.42,0.3,12),mat('#15191c'));wh.rotation.z=Math.PI/2;wh.position.set(x,0.48,z);cg.add(wh);}
 cg.position.set(MAP.spawn.x+6,0,MAP.spawn.z-5);world.add(cg);vehicle={mesh:cg,x:cg.position.x,z:cg.position.z,ang:0,near:false};
 sun.position.set(60,140,50);sun.target.position.set(0,0,0);
}
function deco(m,x,z,rng){
 const g=new T.Group();g.position.set(x,0,z);
 const k=rng();
 function add(mesh){world.add(mesh);}
 if(m.deco==='rural'){
   if(k<0.52){const h=3.5+rng()*2;add(cyl(x,z,0.42,h,'#66452d'));treeTop(x,z,h,rng);}
   else if(k<0.76){add(cubeAt(x,z,2.4,0.35,2.4,'#688d3f'));}
   else{add(cubeAt(x,z,1.2,0.7,1.2,'#8a6c49'));}
 } else if(m.deco==='jungle'){
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
function treeTop(x,z,h,rng){
 const c=new T.Mesh(new T.ConeGeometry(2.4,3.2,8),mat('#2f7a2c'));c.position.set(x,h+1.5,z);c.castShadow=true;world.add(c);
 const c2=new T.Mesh(new T.ConeGeometry(1.8,2.8,8),mat('#3f9638'));c2.position.set(x,h+3.4,z);c2.castShadow=true;world.add(c2);
 const c3=new T.Mesh(new T.ConeGeometry(1.1,2.2,8),mat('#5cad42'));c3.position.set(x,h+5.0,z);c3.castShadow=true;world.add(c3);
}

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
