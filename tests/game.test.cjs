const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../js/core.js');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
function runRace(options={},save=C.freshSave(),dt=1/120){
  const r=C.makeRace({track:'market',chicken:'greta',difficulty:'normal',mode:'race',...options},save);let steps=0;
  while(r.phase!=='finished'&&steps++<120/dt){const p=r.actors[0],aim=C.pointAt(r.track,p.along+15);C.tick(r,{x:aim.x-p.x,y:aim.y-p.y,sprint:p.stamina>.5,item:options.autoItems!==false&&!!p.item},dt);}
  return r;
}
const completed=[];
test('Every course can be completed by movement alone, with ordered sectors and three lap splits',()=>{
  for(const t of C.TRACKS){const r=runRace({track:t.id});assert.equal(r.phase,'finished',t.id);assert.equal(r.actors[0].laps.length,3);assert.equal(r.actors[0].checkpoint,12);assert.ok(r.time>25&&r.time<85);assert.ok(r.corn>0);completed.push(r);}
});
test('All four chickens can finish, and character perks produce different times',()=>{
  const times=[];for(const chicken of Object.keys(C.CHARACTERS)){const r=runRace({chicken,autoItems:false});assert.equal(r.phase,'finished');times.push(r.time);}assert.ok(Math.max(...times)-Math.min(...times)>1);
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
 const egg=r.pickups.find(e=>e.collectedLap<p.lap);p.x=egg.x;p.y=egg.y;p.item=null;C.tick(r,{},1/120);assert.ok(p.item);C.useItem(r);
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
 assert.equal(r.projectiles.length,1);assert.ok(r.projectiles[0].age<.2);assert.ok(r.crowdSpeech.length>0);
 const age=r.projectiles[0].age;r.phase='paused';C.tick(r,{},1);assert.equal(r.projectiles[0].age,age);
 r.phase='racing';for(let i=0;i<240;i++)C.tick(r,{},1/120);assert.equal(r.projectiles.length,0);
});
test('Crowd hits slow chickens, shields absorb hits, and trials have no projectiles',()=>{
 for(const shield of [0,8]){const r=C.makeRace({track:'market',mode:'race',chicken:'greta'},C.freshSave());r.countdown=0;r.phase='racing';r.crowdThrow=100;
 const p=r.actors[0];p.shield=shield;r.projectiles=[{x:p.x,y:p.y,sx:0,sy:0,age:1.29,duration:1.3,radius:10,kind:'bottle'}];C.tick(r,{},.02);
 assert.equal(r.bumps,shield?0:1);assert.equal(p.shield,0);assert.equal(p.slow>0,!shield);
 }
 const trial=runRace({mode:'trial'});assert.equal(trial.projectiles.length,0);assert.equal(trial.throwIndex,0);assert.equal(trial.puddles.length,0);
});
test('Each new course has a distinct theme, landmarks and safe paired crowd scuffles',()=>{
 const artContext={window:{FarmRace:C}};vm.createContext(artContext);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/art.js'),'utf8'),artContext);
 for(const def of C.TRACKS){const r=C.makeRace({track:def.id,mode:'race'},C.freshSave());
   assert.ok(r.crowd.some(p=>p.partner>p.id),def.id+' has a pair');
   for(const p of r.crowd)assert.ok(C.rectangleClear(r.track,p.x-14,p.y-33,32,43,0),def.id+' farmer clearance');
   const scene=artContext.window.FarmArt.makeScene(r.track),types=scene.map(p=>p.type);
   for(const type of ['bushnap','bottles'])assert.ok(types.includes(type),def.id+' '+type);
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
test('Crowd captions cannot move the playfield and scrap cars stay off every course',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.ok(!html.includes('id="crowd-caption"'));
 const sandbox={window:{FarmRace:C}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/art.js'),'utf8'),sandbox);
 const cars=C.TRACKS.flatMap(def=>sandbox.window.FarmArt.makeScene(C.buildTrack(def)).filter(p=>p.type.startsWith('volvo')));assert.ok(cars.length>=2);
});


test('Cup requires ordered podiums, ignores trials and grants its prize once',()=>{
 const s=C.freshSave();
 function finish(track,position=1,mode='race'){const r=C.makeRace({track,chicken:'greta',difficulty:'easy',mode},s);r.phase='finished';r.time=50;r.actors[0].finishTime=50;r.actors[0].laps=[16,17,17];r.result={position,time:50,bestLap:16,coins:20,medal:1};return r;}
 C.settleRace(s,finish('orchard'));assert.equal(s.cup.stage,0);
 C.settleRace(s,finish('market',4));assert.equal(s.cup.stage,0);
 C.settleRace(s,finish('market',1,'trial'));assert.equal(s.cup.stage,0);
 C.settleRace(s,finish('market'));assert.equal(s.cup.stage,1);
 C.settleRace(s,finish('meadow'));assert.equal(s.cup.stage,2);
 const final=finish('orchard'),before=s.coins;C.settleRace(s,final);assert.equal(s.coins-before,170);assert.equal(s.cup.titles,1);assert.equal(s.cup.stage,0);
 C.settleRace(s,final);assert.equal(s.coins-before,170);
 assert.deepEqual(C.sanitizeSave(JSON.parse(JSON.stringify(s))).cup,s.cup);
});
test('Trim choices survive saves, stay out of trials and all finish a race',()=>{
 for(const build of Object.keys(C.BUILDS)){const s=C.freshSave();s.races=10;s.build=build;assert.equal(C.sanitizeSave(s).build,build);const r=runRace({},s);assert.equal(r.phase,'finished',build);const trial=C.makeRace({mode:'trial',track:'market',chicken:'ragna'},s);assert.equal(trial.build,C.BUILDS.stock);}
 const bad=C.freshSave();bad.build='gas';assert.equal(C.sanitizeSave(bad).build,'stock');
});
test('Cross 49 travels, warns, burns, leaves finite mud and respects pause/trials',()=>{
 for(const mode of ['race','trial']) {
  const r=C.makeRace({track:'market',chicken:'greta',difficulty:'easy',mode},C.freshSave());r.countdown=0;r.phase='racing';
  const start=r.cross.along;C.tick(r,{},.1);assert.ok(r.cross.along>start);
  r.time=9;C.tick(r,{},.1);assert.equal(r.cross.state,'warning');assert.equal(r.puddles.length,0);
  r.time=11;C.tick(r,{},.1);assert.equal(r.cross.state,'burn');assert.equal(r.puddles.length>0,mode==='race');
  const frozen=JSON.stringify(r.cross);r.phase='paused';C.tick(r,{},1);assert.equal(JSON.stringify(r.cross),frozen);
  r.phase='racing';r.time=14;for(let i=0;i<400;i++)C.tick(r,{},1/120);assert.ok(!r.puddles.some(p=>p.kind==='mud'));
 }
});
test('Burnout is a shieldable obstacle while its warning is harmless',()=>{
 for(const [time,shield,hit] of [[9,0,false],[11,0,true],[11,5,false]]) {
  const r=C.makeRace({track:'market',chicken:'greta',mode:'race'},C.freshSave());r.phase='racing';r.countdown=0;r.time=time;r.obstacles=[];r.crowd=[];r.cross.along=r.track.length*.2;r.cross.lane=0;
  Object.assign(r.actors[0],C.pointAt(r.track,r.cross.along,0),{shield});C.tick(r,{},1/120);assert.equal(r.actors[0].slow>0,hit);if(shield)assert.equal(r.actors[0].shield,0);
 }
});
test('Crowd speaks soon after start and rotates short visible lines',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race'},C.freshSave());r.countdown=0;r.phase='racing';for(let i=0;i<60;i++)C.tick(r,{},1/120);assert.ok(r.crowdSpeechTime>0);assert.ok(r.crowdSpeech.length);assert.ok(r.crowd[r.crowdSpeaker]);
});
test('A controlled slide rewards straightening, but grass does not',()=>{
 for(const onRoad of [true,false]) {
  const r=C.makeRace({track:'market',chicken:'greta',difficulty:'easy',mode:'race'},C.freshSave());r.countdown=0;r.phase='racing';r.obstacles=[];r.cornPoints=[];r.pickups=[];r.crowd=[];
  const p=r.actors[0],pos=C.pointAt(r.track,r.track.length*.2,onRoad?0:28);Object.assign(p,pos,{along:r.track.length*.2,lastAlong:r.track.length*.2,vx:Math.cos(pos.angle)*70,vy:Math.sin(pos.angle)*70,speed:70,driftCharge:.3});
  C.tick(r,{x:Math.cos(pos.angle),y:Math.sin(pos.angle)},1/120);
  assert.equal(p.cornerBoost>0,onRoad);
 }
});

console.log(`\n${passed} simulation, progression and art tests passed.`);

test('Sparse harvest retains total value and broken bottles leave expiring glass',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race'},C.freshSave());assert.equal(r.cornPoints.length,6);r.corn=6;const value=C.finishResult(r).coins;r.corn=0;assert.equal(value-C.finishResult(r).coins,36);
 r.countdown=0;r.phase='racing';r.crowdThrow=100;r.projectiles=[{x:250,y:50,sx:0,sy:0,age:1.29,duration:1.3,radius:10,kind:'bottle'}];C.tick(r,{},.02);assert.equal(r.puddles[0].kind,'glass');for(let i=0;i<500;i++)C.tick(r,{},.01);assert.ok(!r.puddles.some(p=>p.kind==='glass'));
});
test('Cross excursions reach the infield and provoke nearby farmers',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race'},C.freshSave());r.time=4;C.updateCross(r,.1);assert.ok(Math.abs(r.cross.lane)>r.track.width);
 const farmer=r.crowd[0];farmer.x=r.cross.x;farmer.y=r.cross.y;r.cross.heckleCooldown=0;r.crowdSpeechTime=0;C.updateCross(r,0);assert.equal(farmer.mood,'argue');assert.ok(r.crowdSpeechTime>0);
});
test('Catalog purchases charge once, enforce merits and persist equipped cosmetics',()=>{
 const s=C.freshSave();s.coins=10000;
 assert.equal(C.buyCosmetic(s,'sign49'),false);assert.equal(s.coins,10000);
 assert.equal(C.buyCosmetic(s,'beard'),true);assert.equal(s.coins,9820);assert.equal(s.outfit,'beard');assert.equal(C.buyCosmetic(s,'beard'),false);assert.equal(s.coins,9820);
 assert.equal(C.equipCosmetic(s,'decor','beard'),false);assert.equal(C.equipCosmetic(s,'outfit','neon'),false);assert.equal(C.equipCosmetic(s,'outfit',null),true);
 s.cup.titles=3;assert.equal(C.buyCosmetic(s,'sign49'),true);assert.equal(s.decor,'sign49');
 const loaded=C.sanitizeSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded.owned,s.owned);assert.equal(loaded.decor,'sign49');assert.equal(loaded.outfit,null);
 s.coins=0;assert.equal(C.buyCosmetic(s,'vest'),false);assert.equal(C.buyCosmetic(s,'bogus'),false);
});
test('Sprint plays its ignition once per activation, not every simulation step',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race'},C.freshSave());r.countdown=0;r.phase='racing';
 C.tick(r,{x:1,sprint:true},1/120);assert.ok(r.events.includes('sprint'));
 C.tick(r,{x:1,sprint:true},1/120);assert.ok(!r.events.includes('sprint'));
 C.tick(r,{x:1,sprint:false},1/120);C.tick(r,{x:1,sprint:true},1/120);assert.ok(r.events.includes('sprint'));
});

test('Space boost emits a dedicated sound and an unshielded obstacle cancels it',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race'},C.freshSave());r.phase='racing';r.countdown=0;r.crowd=[];const p=r.actors[0];p.item='boost';C.tick(r,{x:1,item:true},1/120);assert.ok(r.events.includes('eggboost'));assert.ok(p.boost>2.5);
 r.obstacles=[{x:p.x,y:p.y,radius:8,kind:'hay'}];p.cooldown=0;C.tick(r,{x:1},1/120);assert.equal(p.boost,0);assert.ok(p.slow>0);
});

test('Tractor tows a spreader, warns before spreading, pauses and stays out of trials',()=>{
 const r=C.makeRace({track:'market',chicken:'greta',mode:'race'},C.freshSave());r.phase='racing';r.countdown=0;
 r.tractor.along=r.track.length*.16;C.updateTractor(r,0);assert.equal(r.tractor.state,'warning');assert.equal(r.puddles.length,0);assert.ok(r.tractor.trailer);
 r.tractor.along=r.track.length*.2;C.updateTractor(r,.1);assert.equal(r.puddles[0].kind,'manure');assert.equal(r.puddles[0].life,6);
 const before=JSON.stringify(r.tractor);r.phase='paused';C.tick(r,{},1);assert.equal(JSON.stringify(r.tractor),before);
 const trial=C.makeRace({track:'market',mode:'trial'},C.freshSave());const along=trial.tractor.along;C.updateTractor(trial,20);assert.equal(trial.tractor.along,along);assert.equal(trial.puddles.length,0);
});

test('Trailer keeps a rigid drawbar and articulates through bends independently of road sampling',()=>{
 const r=C.makeRace({track:'meadow',mode:'race'},C.freshSave());let bent=false;
 for(let i=0;i<6000;i++) {C.updateTractor(r,1/120);const t=r.tractor,tr=t.trailer;
 assert.ok(Math.abs(Math.hypot(t.hitch.x-tr.x,t.hitch.y-tr.y)-22)<1e-8);
 if(Math.abs(Math.sin(t.angle-tr.angle))>.3)bent=true;
 }
 assert.ok(bent,'Trailer must lag behind tractor heading in bends');
 const a=C.makeRace({track:'market',mode:'race'},C.freshSave()),b=C.makeRace({track:'market',mode:'race'},C.freshSave());
 for(let i=0;i<600;i++)C.updateTractor(a,1/60);for(let i=0;i<1200;i++)C.updateTractor(b,1/120);
 assert.ok(Math.hypot(a.tractor.trailer.x-b.tractor.trailer.x,a.tractor.trailer.y-b.tractor.trailer.y)<.001);
});
