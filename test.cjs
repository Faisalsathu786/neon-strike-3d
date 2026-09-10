const fs=require('fs');
const vm=require('vm');
const {makeSandbox}=require('./harness.cjs');

const sandbox=makeSandbox();
let src=fs.readFileSync(__dirname+'/game.bundle.js','utf8');
src+='\n;globalThis.__t={state:()=>state,wave:()=>wave,level:()=>level,mode:()=>mode,hp:()=>player.hp,'+
     'startGame,centerAction,update,shoot,setState:v=>{state=v;},'+
     'clearField:()=>{spawnQueue.length=0;enemies.length=0;boss=null;bossSpawned=false;},'+
     'camPitch:()=>camPitch,bullets:()=>bullets,player,hitWalls,pad:{get f(){return BTN.f;},get fire(){return BTN.fire;}},setPad:(k,v)=>{BTN[k]=v;},auto:()=>AUTO,setAuto:v=>{AUTO=v;}};\n';
try{ vm.createContext(sandbox); vm.runInContext(src,sandbox,{timeout:20000}); }
catch(e){ console.log('RUNTIME ERROR:',e.message); process.exit(1); }
const t=sandbox.__t;
console.log('hook ok; initial',t.state(),'wave',t.wave());

t.startGame();
if(t.state()!=='play'){console.log('FAIL startGame');process.exit(1);}
console.log('after startGame -> state',t.state(),'wave',t.wave());

/* aim: bullets fly ~horizontally, not into the ground */
t.clearField();const before=t.bullets().length;t.shoot();
const b=t.bullets()[t.bullets().length-1];
console.log('bullet dir dy=',b.dy.toFixed(3),'| |dy|<=0.35 ?',Math.abs(b.dy)<=0.35);
if(Math.abs(b.dy)>0.35){console.log('FAIL aim dives down');process.exit(8);}

/* on-screen pad drives movement + fire */
t.clearField();t.bullets().length=0;
/* move the player to an open tile (spawn areas are open; 0,0 can be a building) */
let open=null;
for(let z=34;z>=-40&&!open;z-=2)for(let x=0;x<=56;x+=2){if(!t.hitWalls(x,z,1.0)&&!t.hitWalls(x,z,0.3)){open={x,z};break;}}
t.player.x=open.x;t.player.z=open.z;t.player.fireCd=0;t.player.reloading=false;
console.log('moved player to open tile',JSON.stringify(open));
let fwd=false;
for(let i=0;i<12&&!fwd;i++){const px=t.player.x,pz=t.player.z;t.setPad('f',true);t.update(0.05);fwd=Math.hypot(t.player.x-px,t.player.z-pz)>0.05;}
console.log('pad forward moved player:',fwd);
t.setState('play');t.setPad('fire',true);t.player.fireCd=0;t.player.reloading=false;
const mag0=t.player.mags[t.player.wi];
for(let i=0;i<6&&t.player.mags[t.player.wi]===mag0;i++){t.setState('play');t.player.fireCd=0;t.update(0.02);}
const shot=t.player.mags[t.player.wi]<mag0;
console.log('pad fire consumed ammo:',shot,'| bullets alive:',t.bullets().length);
if(!fwd){console.log('FAIL pad forward did not move player');process.exit(9);}
if(!shot){console.log('FAIL pad fire did not shoot');process.exit(10);}
t.setPad('f',false);t.setPad('fire',false);

/* auto-fire flag */
t.setAuto(true);const n1=t.bullets().length;t.update(0.05);
console.log('auto-fire active:',t.bullets().length>=n1);
t.setAuto(false);

/* wave flow */
t.clearField();t.update(0.016);
console.log('after clear -> state',t.state());
if(t.state()!=='clear'){console.log('FAIL expected clear');process.exit(2);}
t.centerAction();
console.log('after NEXT WAVE -> state',t.state(),'wave',t.wave());
if(t.state()!=='play'){console.log('FAIL next wave');process.exit(3);}
t.clearField();t.update(0.016);t.centerAction();
if(t.state()!=='play'){console.log('FAIL second cycle');process.exit(5);}
t.setState('dead');t.centerAction();
if(t.state()!=='play'){console.log('FAIL retry');process.exit(6);}
console.log('after retry -> state',t.state(),'wave',t.wave());
console.log('SMOKE TEST PASSED');
