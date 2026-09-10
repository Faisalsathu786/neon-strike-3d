"use strict";
(function(){
const T=window.THREE;
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;

/* ---------- renderer / scene ---------- */
const cv=document.getElementById('game');
const renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(62,1,0.1,900);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

const hemi=new T.HemisphereLight(0xffffff,0x5a6a7a,0.9);scene.add(hemi);
const sun=new T.DirectionalLight(0xffffff,1.15);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
const SC=120;
sun.shadow.camera.left=-SC;sun.shadow.camera.right=SC;sun.shadow.camera.top=SC;sun.shadow.camera.bottom=-SC;
sun.shadow.camera.near=1;sun.shadow.camera.far=460;
scene.add(sun);scene.add(sun.target);

/* ---------- helpers ---------- */
function mat(c,extra){return new T.MeshLambertMaterial(Object.assign({color:new T.Color(c)},extra||{}));}
function box(w,h,d,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.castShadow=true;m.receiveShadow=true;return m;}
function glow(c,r){const m=new T.Mesh(new T.SphereGeometry(r,10,10),new T.MeshBasicMaterial({color:new T.Color(c)}));return m;}
const MESHES={};
function part(g,w,h,d,c,x,y,z){const b=box(w,h,d,c);b.position.set(x,y,z);g.add(b);return b;}
function mk(k,obj){MESHES[k]=MESHES[k]||[];MESHES[k].push(obj);}
function clearWorld(){for(const k in MESHES){MESHES[k].forEach(o=>scene.remove(o));}MESHES={};}

/* ---------- block characters ---------- */
function buildChar(c,s){
 s=s||1;const g=new T.Group();
 part(g,1.1,1.35,0.62,c.shirt,0,1.28,0);
 part(g,1.04,0.5,0.6,c.pants,0,0.55,0);
 part(g,0.44,0.98,0.5,c.pants,-0.3,0.02,0);
 part(g,0.44,0.98,0.5,c.pants,0.3,0.02,0);
 part(g,0.34,1.06,0.4,c.shirt,-0.78,1.32,0);
 part(g,0.34,1.06,0.4,c.shirt,0.78,1.32,0);
 part(g,0.86,0.86,0.8,c.skin,0,2.4,0);
 part(g,0.94,0.34,0.88,c.hair,0,2.78,0);
 part(g,0.17,0.17,0.07,'#ffffff',-0.2,2.46,-0.42);
 part(g,0.17,0.17,0.07,'#ffffff',0.2,2.46,-0.42);
 part(g,0.08,0.08,0.05,'#22304a',-0.2,2.46,-0.47);
 part(g,0.08,0.08,0.05,'#22304a',0.2,2.46,-0.47);
 const gun=part(g,0.2,0.2,0.95,c.gun,0.55,1.34,-0.62);
 g.userData.gun=gun;
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});
 return g;
}
function buildMonster(color,s){
 s=s||1;const g=new T.Group();const dark='#242433';
 part(g,1.0,1.1,0.7,dark,0,1.15,0);
 part(g,0.44,0.8,0.44,dark,-0.38,0.4,0);
 part(g,0.44,0.8,0.44,dark,0.38,0.4,0);
 part(g,0.34,0.95,0.36,'#3a3a52',-0.72,1.2,0);
 part(g,0.34,0.95,0.36,'#3a3a52',0.72,1.2,0);
 part(g,0.92,0.9,0.86,color,0,2.15,0);
 part(g,0.2,0.2,0.09,'#ffffff',-0.22,2.22,-0.45);
 part(g,0.2,0.2,0.09,'#ffffff',0.22,2.22,-0.45);
 part(g,0.09,0.13,0.06,'#111',-0.22,2.2,-0.5);
 part(g,0.09,0.13,0.06,'#111',0.22,2.