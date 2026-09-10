/* Minimal but REAL THREE.Vector3 so bullet math is exercised properly. */
function mk(){
  const f=function(){return mk();};
  const t={};
  return new Proxy(f,{get(o,p){if(p===Symbol.toPrimitive)return ()=>0;if(p==='then')return undefined;if(p==='toString')return ()=>'';if(p==='valueOf')return ()=>0;if(!(p in t))t[p]=mk();return t[p];},set(o,p,v){t[p]=v;return true;},has(){return false;},apply(){return mk();},construct(){return mk();}});
}
class V3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  setScalar(s){this.x=this.y=this.z=s;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  clone(){return new V3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  length(){return Math.hypot(this.x,this.y,this.z);}
  lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;}
  normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  applyQuaternion(){return this;}
  lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this;}
}
function el(){return mk();}
function makeSandbox(extra){
  const doc={getElementById:()=>el(),createElement:()=>el(),querySelector:()=>el(),addEventListener:()=>{},removeEventListener:()=>{},exitPointerLock:()=>{},pointerLockElement:null,body:el()};
  const store={};
  const THREE=new Proxy({},{get(o,p){ if(p==='Vector3')return V3; if(p==='Math')return Math; return mk(); }});
  const sb={
    console, document:doc,
    addEventListener:()=>{}, removeEventListener:()=>{},
    requestAnimationFrame:()=>0, cancelAnimationFrame:()=>0,
    innerWidth:1280, innerHeight:720, devicePixelRatio:1,
    localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},
    performance:{now:()=>0}, navigator:{userAgent:'node'}, THREE,
    setTimeout:()=>0, clearTimeout:()=>{},
    Math, JSON, Date, Array, Object, String, Number, Boolean, Error, isNaN, parseInt, parseFloat, Infinity, NaN
  };
  sb.window=sb; sb.globalThis=sb; sb.self=sb;
  Object.assign(sb, extra||{});
  return sb;
}
module.exports={makeSandbox,mk,V3};
