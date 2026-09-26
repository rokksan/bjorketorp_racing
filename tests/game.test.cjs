const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../js/core.js');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
function runRace(options={},save=C.freshSave(),dt=1/120){
  const r=C.makeRace({track:'market',chicken:'greta',difficulty:'normal',mode:'race',...options},save);let steps=0;
  while(r.phase!=='finished'&&steps++<120/dt){const p=r.actors[0],aim=C.pointAt(r.track,p.along+15);C.tick(r,{x:aim.x-p.x,y:aim.y-p.y,sprint:p.stamina>.5,item:!!p.item},dt);}
  return r;
}
const completed=[];
test('Every course can be completed by movement alone, with ordered sectors and three lap splits',()=>{
  for(const t of C.TRACKS){const r=runRace({track:t.id});assert.equal(r.phase,'finished',t.id);assert.equal(r.actors[0].laps.length,3);assert.equal(r.actors[0].checkpoint,12);assert.ok(r.time>25&&r.time<85);assert.ok(r.corn>0);completed.push(r);}
});
test('All four chickens can finish, and character perks produce different times',()=>{
  const times=[];for(const chicken of Object.keys(C.CHARACTERS)){const r=runRace({chicken});assert.equal(r.phase,'finished');times.push(r.time);}assert.ok(Math.max(...times)-Math.min(...times)>1);
});
test('Time trial standardizes chicken, upgrades and difficulty and never pays farm currency',()=>{
  const save=C.freshSave();save.upgrades={feed:3,boots:3,nest:3};const r=runRace({mode:'trial',chicken:'ragna',difficulty:'hard'},save);
  assert.equal(r.actors.length,1);assert.equal(r.options.chicken,'greta');assert.equal(r.options.difficulty,'easy');assert.deepEqual(r.up,{feed:0,boots:0,nest:0});assert.equal(r.usedItems,0);C.settleRace(save,r);assert.equal(save.coins,0);assert.equal(save.races,0);assert.ok(save.records['market:trial:easy']);
});
test('Rewards and medals are awarded exactly once and records use separate courses/modes',()=>{
  const s=C.freshSave();for(const r of completed){assert.ok(C.settleRace(s,r));const coins=s.coins;assert.equal(C.settleRace(s,r),null);assert.equal(s.coins,coins);assert.ok(s.records[`${r.track.id}:race:normal`]);}assert.equal(s.races,3);assert.ok(s.coins>0);assert.equal(Object.keys(s.records).length,3);
});
test('Purchases debit exactly once per level and stop at caps or insufficient funds',()=>{
 const s=C.freshSave();assert.equal(C.buyUpgrade(s,'feed'),false);s.coins=2000;
 for(let i=0;i<3;i++){const before=s.coins;assert.equal(C.buyUpgrade(s,'feed'),true);assert.equal(s.coins,before-C.UPGRADES.feed.cost[i]);}
 const balance=s.coins;assert.equal(C.buyUpgrade(s,'feed'),false);assert.equal(s.coins,balance);assert.equal(C.buyUpgrade(s,'bogus'),false);
});
test('Repeatable contracts require a new full target after each payout',()=>{
 const s=C.freshSave();s.races=3;assert.equal(C.claimContract(s,'races'),45);assert.equal(C.claimContract(s,'races'),0);s.races=6;assert.equal(C.claimContract(s,'races'),45);assert.equal(s.coins,90);
});
test('Corrupt or outdated saves cannot unlock content or inject invalid economy values',()=>{
 for(const raw of [null,[],42,'text'])assert.equal(C.sanitizeSave(raw).coins,0);
 const s=C.sanitizeSave({coins:-4,xp:NaN,races:Infinity,upgrades:{feed:99,boots:-3},selected:{track:'orchard',chicken:'missing'},records:{'market:trial:easy':{time:-1}},settings:{music:9,sfx:-1}});
 assert.equal(s.coins,0);assert.equal(s.races,0);assert.equal(s.upgrades.feed,3);assert.equal(s.upgrades.boots,0);assert.equal(s.selected.track,'market');assert.equal(s.selected.chicken,'greta');assert.equal(s.settings.music,1);assert.equal(s.settings.sfx,0);assert.deepEqual(s.records,{});
});
test('No movement and backward driving cannot create laps',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race',difficulty:'easy'},C.freshSave());
 for(let i=0;i<1800;i++)C.tick(r,{x:0,y:0},1/120);assert.equal(r.actors[0].lap,0);
 for(let i=0;i<6000;i++){const p=r.actors[0],aim=C.pointAt(r.track,p.along-15);C.tick(r,{x:aim.x-p.x,y:aim.y-p.y},1/120);}assert.equal(r.actors[0].lap,0);
});
test('A paused race freezes all simulation and item use',()=>{
 const r=C.makeRace({track:'market',chicken:'agnes',mode:'race',difficulty:'easy'},C.freshSave());r.phase='paused';const before=JSON.stringify(r);C.tick(r,{x:1,sprint:true,item:true},1);assert.equal(JSON.stringify(r),before);assert.equal(C.useItem(r),false);
});
test('Simulation remains comparable at 60 and 120 updates per second',()=>{
 const a=runRace({mode:'trial'},C.freshSave(),1/60),b=runRace({mode:'trial'},C.freshSave(),1/120);assert.ok(Math.abs(a.time-b.time)<.6,`${a.time} vs ${b.time}`);
});
test('Spurt consumes stamina and resting restores it without exceeding the cap',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race',difficulty:'easy'},C.freshSave());r.countdown=0;r.phase='racing';const initial=r.maxStamina;
 for(let i=0;i<120;i++)C.tick(r,{x:-1,sprint:true},1/120);assert.ok(r.actors[0].stamina<initial-.8);
 for(let i=0;i<600;i++)C.tick(r,{},1/120);assert.equal(r.actors[0].stamina,initial);
});
const sandbox={window:{FarmRace:C}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/art.js'),'utf8'),sandbox);
test('All visual decoration bounds stay outside the driving corridor on every course',()=>{
 for(const def of C.TRACKS){const t=C.buildTrack(def),scene=sandbox.window.FarmArt.makeScene(t);assert.ok(scene.length>8);for(const o of scene)assert.ok(C.rectangleClear(t,o.x,o.y,o.w,o.h,4),`${def.id}: ${o.type} overlaps track`);}
});
test('Exported asset manifest references real files and valid animation frames',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/asset-manifest.json')));for(const s of Object.values(manifest.sprites)){assert.ok(fs.existsSync(path.join(__dirname,'..',s.source)));for(const anim of Object.values(s.animations))assert.ok(anim.frames.every(f=>f>=0&&f<4));}for(const file of [...manifest.environment,...manifest.pickups])assert.ok(fs.existsSync(path.join(__dirname,'..',file)));
});
test('Progression survives a JSON save/load round trip',()=>{
 const s=C.freshSave();s.coins=432;s.races=7;s.selected.track='orchard';s.upgrades.nest=2;s.skin='blue';s.medals['orchard:hard']=2;s.contracts.corn=1;assert.deepEqual(C.sanitizeSave(JSON.parse(JSON.stringify(s))),C.sanitizeSave(s));
});
test('Holding an exhausted sprint cannot refill it or produce flickering free boosts',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race',difficulty:'easy'},C.freshSave());r.countdown=0;r.phase='racing';r.actors[0].stamina=0;
 for(let i=0;i<120;i++)C.tick(r,{x:-1,sprint:true},1/120);
 assert.equal(r.actors[0].stamina,0);assert.equal(r.actors[0].sprinting,false);
 for(let i=0;i<120;i++)C.tick(r,{x:-1,sprint:false},1/120);assert.ok(r.actors[0].stamina>.4);
});
test('Parking on corn or an egg cannot generate repeated rewards within a lap',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race',difficulty:'easy'},C.freshSave());r.countdown=0;r.phase='racing';
 const p=r.actors[0],corn=r.cornPoints[0];p.x=corn.x;p.y=corn.y;C.tick(r,{},1/120);const earned=r.corn;
 for(let i=0;i<1500;i++)C.tick(r,{},1/120);assert.equal(r.corn,earned);
 const egg=r.pickups[0];p.x=egg.x;p.y=egg.y;p.item=null;C.tick(r,{},1/120);assert.ok(p.item);C.useItem(r);
 for(let i=0;i<1200;i++)C.tick(r,{},1/120);assert.equal(p.item,null);
});
test('A personal-best time trial records a persistent interpolated ghost without collisions',()=>{
 const s=C.freshSave(),r=runRace({mode:'trial'},s);C.settleRace(s,r);assert.ok(s.ghosts.market.length>100);
 const loaded=C.sanitizeSave(JSON.parse(JSON.stringify(s)));assert.equal(loaded.ghosts.market.length,s.ghosts.market.length);
 const next=C.makeRace({track:'market',chicken:'ragna',mode:'trial',difficulty:'hard'},loaded);assert.equal(next.actors.length,1);assert.ok(next.ghost);
 const position=C.ghostAt(next,5.15);assert.ok(position.x>=0&&position.x<=480&&position.y>=0&&position.y<=300);assert.equal(C.ghostAt(next,999),null);
 const invalid=C.sanitizeSave({ghosts:{market:[[0,100,100,0],[0,110,110,0]]}});assert.equal(invalid.ghosts.market,undefined);
});
test('Farmers stand clear of every track and throws are telegraphed, finite and paused',()=>{
 for(const def of C.TRACKS){const t=C.buildTrack(def),crowd=C.makeCrowd(t);assert.ok(crowd.length>=5);for(const p of crowd)assert.ok(C.rectangleClear(t,p.x-8,p.y-21,16,23,0));}
 const r=C.makeRace({track:'market',mode:'race',difficulty:'easy'},C.freshSave());r.countdown=0;r.phase='racing';
 for(let i=0;i<310;i++)C.tick(r,{},1/120);
 assert.equal(r.projectiles.length,1);assert.ok(r.projectiles[0].age<.2);assert.ok(r.crowdSpeech.includes('Kladdis'));
 const age=r.projectiles[0].age;r.phase='paused';C.tick(r,{},1);assert.equal(r.projectiles[0].age,age);
 r.phase='racing';for(let i=0;i<240;i++)C.tick(r,{},1/120);assert.equal(r.projectiles.length,0);
});
test('Crowd hits slow chickens, shields absorb hits, and trials have no projectiles',()=>{
 for(const shield of [0,8]){const r=C.makeRace({track:'market',mode:'race',chicken:'greta'},C.freshSave());r.countdown=0;r.phase='racing';r.crowdThrow=100;
 const p=r.actors[0];p.shield=shield;r.projectiles=[{x:p.x,y:p.y,sx:0,sy:0,age:1.29,duration:1.3,radius:10,kind:'bottle'}];C.tick(r,{},.02);
 assert.equal(r.bumps,shield?0:1);assert.equal(p.shield,0);assert.equal(p.slow>0,!shield);
 }
 const trial=runRace({mode:'trial'});assert.equal(trial.projectiles.length,0);assert.equal(trial.throwIndex,0);assert.ok(trial.crowdLine>0);
});
test('Each new course has a distinct theme, landmarks and safe paired crowd scuffles',()=>{
 const artContext={window:{FarmRace:C}};vm.createContext(artContext);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/art.js'),'utf8'),artContext);
 for(const def of C.TRACKS){const r=C.makeRace({track:def.id,mode:'race'},C.freshSave());
   assert.ok(r.crowd.some(p=>p.partner>p.id),def.id+' has a pair');
   for(const p of r.crowd)assert.ok(C.rectangleClear(r.track,p.x-14,p.y-33,32,43,0),def.id+' farmer clearance');
   const scene=artContext.window.FarmArt.makeScene(r.track),types=scene.map(p=>p.type);
   if(def.id==='meadow')for(const type of ['tractor','shed','ditch'])assert.ok(types.includes(type),type);
   if(def.id==='orchard')for(const type of ['barn','pumpkins','lantern'])assert.ok(types.includes(type),type);
   r.phase='racing';r.countdown=0;r.brawlTimer=.01;C.tick(r,{},.02);assert.ok(r.crowd.some(p=>p.mood==='argue'));assert.ok(r.crowdSpeech.includes('FLASKA'));
   for(let i=0;i<170;i++)C.tick(r,{},1/60);assert.ok(r.crowd.some(p=>p.mood==='brawl'));
   r.phase='paused';const remaining=r.crowd[0].moodTime;C.tick(r,{},2);assert.equal(r.crowd[0].moodTime,remaining);
   r.phase='racing';for(let i=0;i<240;i++)C.tick(r,{},1/60);assert.ok(r.crowd.every(p=>p.mood==='heckle'));
 }
 const night=C.buildTrack(C.TRACKS[2]);assert.equal(C.roadWidth(night,night.length*.58),12);assert.equal(C.roadWidth(night,0),19);
});
test('Course redesign migrates economy but retires incompatible old times and ghosts',()=>{
 const old=C.freshSave();delete old.courseRevision;old.coins=345;old.races=8;old.upgrades.feed=2;
 for(const id of ['market','meadow','orchard']){old.records[id+':race:easy']={time:42,lap:14};old.ghosts[id]=[[0,100,100,0],[1,110,110,0]];}
 const next=C.sanitizeSave(old);assert.equal(next.coins,345);assert.equal(next.races,8);assert.equal(next.upgrades.feed,2);assert.ok(next.records['market:race:easy']);assert.equal(next.records['meadow:race:easy'],undefined);assert.equal(next.ghosts.orchard,undefined);
});
console.log(`\n${passed} simulation, progression and art tests passed.`);
