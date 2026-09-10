const fs=require('fs');
const vm=require('vm');
const {makeSandbox}=require('./harness.cjs');

const sandbox=makeSandbox();
let src=fs.readFileSync(__dirname+'/game.bundle.js','utf8');
src+='\n;globalThis.__t={startGame,update,shoot,spawnEnemy,state:()=>state,enemies:()=>enemies,player,WEAPONS,setYaw:v=>{camYaw=v;},setPitch:v=>{camPitch=v;},resetFire:()=>{player.fireCd=0;},bullets:()=>bullets,hitWalls,los,colliders:()=>colliders,HW,HD,segHit,segHitsWalls};\n';
try{vm.createContext(sandbox);vm.runInContext(src,sandbox,{timeout:20000});}catch(e){console.log('RUNTIME ERROR:',e.message);process.exit(1);}
const t=sandbox.__t;
t.startGame();

/* pick an open spot + a target with clear line */
const pts=[];
for(let z=-40;z<=40;z+=2)for(let x=-56;x<=56;x+=2)if(!t.hitWalls(x,z,0.9))pts.push({x,z});
let A=null,B=null;
for(const a of pts){for(const b of pts){const d=Math.hypot(b.x-a.x,b.z-a.z);if(d<6||d>13)continue;if(t.los(a.x,a.z,b.x,b.z)){A=a;B=b;break;}}if(A)break;}
console.log('arena ok | player',JSON.stringify(A),'target',JSON.stringify(B));

function scenario(label,wi,fps){
  const dt=1/fps;
  t.enemies().length=0;t.bullets().length=0;
  t.player.x=A.x;t.player.z=A.z;t.player.hp=100;
  t.setYaw(Math.atan2(-(B.x-A.x),-(B.z-A.z)));t.setPitch(0.34);
  t.spawnEnemy('grunt');
  const e=t.enemies()[0];e.x=B.x;e.z=B.z;e.speed=0;e.fire=9999;e.range=0;
  t.player.wi=wi;t.player.mags=[30,45,8,6,4];t.player.reloading=false;
  let shots=0,frames=0;
  while(!e.dead&&frames<12*60){frames++;t.player.fireCd=0;t.shoot();shots++;t.update(dt);}
  console.log(label.padEnd(24),'shots',String(shots).padStart(3),'frames',String(frames).padStart(4),'->',e.dead?'KILLED ✅':'ALIVE ❌ hp '+e.hp);
  return e.dead;
}

const w=['PISTOL','SMG','SHOTGUN','SNIPER','ROCKET'];
let ok=true;
ok=scenario('PISTOL @60fps',0,60)&&ok;
ok=scenario('PISTOL @20fps',0,20)&&ok;
ok=scenario('SMG @20fps',1,20)&&ok;
ok=scenario('SHOTGUN @20fps',2,20)&&ok;
ok=scenario('SNIPER @20fps',3,20)&&ok;
ok=scenario('ROCKET @20fps',4,20)&&ok;

/* enemy bullets must be able to hit the player at low fps too */
t.enemies().length=0;t.bullets().length=0;
t.player.x=A.x;t.player.z=A.z;t.player.hp=100;
t.spawnEnemy('grunt');
const g=t.enemies()[0];g.x=B.x;g.z=B.z;g.speed=0;
let dmg=0,hpStart=100,frames=0;
while(t.player.hp>=hpStart&&frames<20*60){frames++;t.update(1/20);}
console.log('enemy->player @20fps: player hp',t.player.hp,'after',frames,'frames',t.player.hp<hpStart?'✅ hit lands':'❌ never hit');

console.log(ok?'ALL BULLET TESTS PASSED':'SOME TESTS FAILED');
