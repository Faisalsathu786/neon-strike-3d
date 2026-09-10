const fs=require('fs');
const vm=require('vm');

/* generic auto-stub proxy: any property/method/call/construct works */
function mk(){
  const f=function(){return mk();};
  const t={};
  return new Proxy(f,{
    get(o,p){
      if(p===Symbol.toPrimitive)return ()=>0;
      if(p==='then')return undefined;
      if(p==='toString')return ()=>'';
      if(p==='valueOf')return ()=>0;
      if(!(p in t))t[p]=mk();
      return t[p];
    },
    set(o,p,v){t[p]=v;return true;},
    has(){return false;},
    apply(){return mk();},
    construct(){return mk();}
  });
}

function el(){return mk();}
const doc={
  getElementById:()=>el(),
  createElement:()=>el(),
  querySelector:()=>el(),
  addEventListener:()=>{},
  removeEventListener:()=>{},
  exitPointerLock:()=>{},
  pointerLockElement:null,
  body:el()
};
const store={};
const sandbox={
  console,
  document:doc,
  addEventListener:()=>{},
  removeEventListener:()=>{},
  requestAnimationFrame:()=>0,
  cancelAnimationFrame:()=>0,
  innerWidth:1280, innerHeight:720,
  devicePixelRatio:1,
  localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},
  performance:{now:()=>0},
  navigator:{userAgent:'node'},
  THREE:mk(),
  setTimeout:()=>0, clearTimeout:()=>{}, Math, JSON, Date, Array, Object, String, Number, Boolean, Error, isNaN, parseInt, parseFloat, Infinity, NaN
};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
sandbox.self=sandbox;

let src=fs.readFileSync(__dirname+'/game.bundle.js','utf8');
src+='\n;globalThis.__t={state:()=>state,wave:()=>wave,level:()=>level,mode:()=>mode,hp:()=>player.hp,'+
     'startGame,centerAction,update,setState:v=>{state=v;},clearField:()=>{spawnQueue.length=0;enemies.length=0;boss=null;bossSpawned=false;},'+
     'clearFieldPlus:()=>{spawnQueue.length=0;enemies.length=0;boss=null;}};\n';

try{
  vm.createContext(sandbox);
  vm.runInContext(src,sandbox,{timeout:20000});
}catch(e){console.log('RUNTIME ERROR:',e.message);process.exit(1);}

const t=sandbox.__t;
if(!t){console.log('NO HOOK - vars not in scope');process.exit(1);}

console.log('hook ok; initial state',t.state(),'wave',t.wave());

// start level
t.startGame();
console.log('after startGame -> state',t.state(),'wave',t.wave(),'level',t.level());

// simulate player killing everything in the wave
t.clearField();
t.update(0.016);
console.log('after field clear -> state',t.state());

if(t.state()!=='clear'){console.log('FAIL: expected state=clear after wiping wave');process.exit(2);}

// tap NEXT WAVE
t.centerAction();
console.log('after NEXT WAVE tap -> state',t.state(),'wave',t.wave());
if(t.state()!=='play'){console.log('FAIL: NEXT WAVE did not resume play');process.exit(3);}
if(t.wave()<2){console.log('FAIL: wave did not advance');process.exit(4);}

// wipe again and tap again -> should keep working
t.clearField();
t.update(0.016);
t.centerAction();
console.log('second cycle -> state',t.state(),'wave',t.wave());
if(t.state()!=='play'){console.log('FAIL: second NEXT WAVE stuck');process.exit(5);}

// simulate death + retry
t.setState('dead');
t.centerAction();
console.log('after retry -> state',t.state(),'wave',t.wave());
if(t.state()!=='play'){console.log('FAIL: retry from dead did not restart');process.exit(6);}

console.log('SMOKE TEST PASSED');
