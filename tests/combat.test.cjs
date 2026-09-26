const assert=require('node:assert/strict'),C=require('../js/core.js');
const make=()=>{const r=C.makeRace({mode:'combat',chicken:'greta',difficulty:'normal',track:'market'},C.freshSave());r.countdown=0;r.phase='racing';return r;};
{
 const r=make(),p=r.actors[0];assert.equal(r.track.worldWidth,960);assert.equal(r.track.width,39);
 p.gun.aim=0;assert.ok(C.fireShot(r,p));assert.equal(p.gun.ammo,1);assert.ok(p.hitPushX<0);assert.equal(C.fireShot(r,p),false);
 p.gun.cooldown=0;C.fireShot(r,p);assert.equal(p.gun.ammo,0);assert.ok(p.gun.reload>2);
 r.actors=r.actors.slice(0,1);for(let i=0;i<280;i++)C.updateCombat(r,{},1/120);assert.equal(p.gun.ammo,2);assert.equal(r.bullets.length,0);
}
{
 const r=make();r.cover=[];r.actors=r.actors.slice(0,2);const [p,b]=r.actors;Object.assign(p,{x:100,y:100});Object.assign(b,{x:140,y:100});p.gun.aim=0;C.fireShot(r,p);
 for(let i=0;i<20;i++)C.updateCombat(r,{},1/120);assert.ok(b.invulnerable>0);assert.ok(b.hitPushX>0);assert.ok(b.hitPushX<130,'One shotgun blast must not stack five knockbacks');
 const frozen=JSON.stringify(r.bullets);r.phase='paused';C.tick(r,{fire:true},1);assert.equal(JSON.stringify(r.bullets),frozen);
}
{
 const r=make();r.actors=r.actors.slice(0,2);const [p,b]=r.actors;Object.assign(p,{x:100,y:100});Object.assign(b,{x:170,y:100});r.cover=[{x:138,y:100,radius:12}];p.gun.aim=0;C.fireShot(r,p);for(let i=0;i<60;i++)C.updateCombat(r,{},1/120);assert.equal(b.invulnerable,0,'Cover blocks pellets');
}
{
 const r=make();let steps=0;
 while(r.phase!=='finished'&&steps++<240*120){const p=r.actors[0],target=C.pointAt(r.track,p.along+20,-23);C.tick(r,{x:target.x-p.x,y:target.y-p.y,sprint:p.stamina>.5,aimX:target.x,aimY:target.y,fire:true},1/120);}
 assert.equal(r.phase,'finished','Combat race must remain finishable');assert.equal(r.actors[0].laps.length,2);
 const save=C.freshSave(),before=JSON.stringify(save);C.settleRace(save,r);assert.equal(save.coins,r.result.coins);assert.ok(save.coins>=78);assert.equal(save.races,0);assert.equal(save.combatMastery.shotgun,1);assert.equal(C.settleRace(save,r),null,'Rewards only once');console.log('Combat finish time:',r.time.toFixed(1));
}
console.log('PASS combat: firing, recoil, reload, hit immunity, cover, pause, two-lap completion and economy isolation.');

for(const weapon of Object.keys(C.WEAPONS)){
 const r=C.makeRace({mode:'combat',chicken:'greta',difficulty:'normal',track:'market',weapon},C.freshSave());const p=r.actors[0],w=C.WEAPONS[weapon];
 assert.equal(p.gun.ammo,w.ammo);C.fireShot(r,p);assert.equal(r.bullets.length,w.pellets);assert.ok(r.events.some(e=>e.name===weapon));
 p.gun.cooldown=0;C.updateCombat(r,{reload:true},1/120);assert.ok(r.events.some(e=>e.name==='reload-start'));assert.ok(Math.abs(p.gun.reload-w.reload)<.01);
}
{
 const r=make();r.cover=[];r.actors=r.actors.slice(0,2);const [p,b]=r.actors;Object.assign(p,{x:100,y:100});Object.assign(b,{x:140,y:100});p.gun.aim=0;C.fireShot(r,p);
 for(let i=0;i<20;i++)C.updateCombat(r,{},1/120);assert.equal(r.events.filter(e=>e.name==='cluck').length,1,'One hurt call per blast');
}
for(const track of C.COMBAT_TRACKS){
 const save=C.freshSave(),r=C.makeRace({mode:'combat',chicken:'greta',difficulty:'easy',combatTrack:track.id,weapon:'potato'},save);r.countdown=0;r.phase='racing';let steps=0;
 while(r.phase!=='finished'&&steps++<240*120){const p=r.actors[0],target=C.pointAt(r.track,p.along+22,-20);C.tick(r,{x:target.x-p.x,y:target.y-p.y,aimX:target.x,aimY:target.y,fire:true},1/120);}
 assert.equal(r.phase,'finished',track.id+' is finishable with potato cannon');C.settleRace(save,r);assert.equal(C.sanitizeSave(JSON.parse(JSON.stringify(save))).combatMastery.potato,1);
}
{
 const r=make();r.actors=r.actors.slice(0,2);r.cover=[];const [p,b]=r.actors;Object.assign(p,{x:100,y:100});Object.assign(b,{x:160,y:100});p.gun.weapon='potato';p.gun.ammo=1;p.gun.aim=0;C.fireShot(r,p);
 for(let i=0;i<60;i++)C.updateCombat(r,{},1/120);
 assert.ok(r.puddles.length>0);assert.equal(r.puddles[0].radius,19);assert.ok(b.slow>0);assert.ok(r.events.includes('potato-hit'));
}
console.log('PASS all combat courses, potato area impact and mastery persistence.');
// Potato impacts from any direction brake racers, including existing forward impulses.
for(const fraction of [.05,.3,.65,.9])for(const side of [-1,0,1]){
 const r=make();r.cover=[];r.actors=r.actors.slice(0,1);const a=r.actors[0],pos=C.pointAt(r.track,r.track.length*fraction);
 const fx=Math.cos(pos.angle),fy=Math.sin(pos.angle),nx=-fy,ny=fx;
 Object.assign(a,{x:pos.x,y:pos.y,vx:fx*80,vy:fy*80,hitPushX:fx*90,hitPushY:fy*90,boost:2,cornerBoost:.4,driftCharge:.5});
 r.bullets=[{x:a.x-fx*15+nx*side*15,y:a.y-fy*15+ny*side*15,vx:0,vy:0,life:0,weapon:'potato',owner:9}];
 C.updateCombat(r,{},1/120);
 assert.ok(a.hitPushX*fx+a.hitPushY*fy<0,'No forward potato impulse');
 assert.ok(a.vx*fx+a.vy*fy<30,'Immediate braking, not just a future slow');
 assert.equal(a.boost,0);assert.equal(a.cornerBoost,0);assert.ok(a.slow>=1.2);
}
console.log('PASS potato impacts brake and cannot propel racers forward around the course.');
{
 const save=C.freshSave();save.coins=1000;
 assert.equal(C.buyWeaponUpgrade(save,'potato','reload'),true);assert.equal(save.coins,880);
 assert.equal(C.buyWeaponUpgrade(save,'rifle','recoil'),true);assert.equal(save.coins,780);
 assert.equal(C.buyWeaponUpgrade(save,'unknown','recoil'),false);
 const restored=C.sanitizeSave(JSON.parse(JSON.stringify(save)));assert.equal(restored.weaponUpgrades.potato.reload,1);assert.equal(restored.weaponUpgrades.rifle.recoil,1);
 const r=C.makeRace({mode:'combat',weapon:'potato'},restored);C.fireShot(r,r.actors[0]);assert.ok(Math.abs(r.actors[0].gun.reload-3.3*.95)<1e-9);
 save.coins=0;assert.equal(C.buyWeaponUpgrade(save,'potato','reload'),false);assert.equal(save.weaponUpgrades.potato.reload,1);
 save.coins=10000;C.buyWeaponUpgrade(save,'potato','reload');C.buyWeaponUpgrade(save,'potato','reload');const coins=save.coins;assert.equal(C.buyWeaponUpgrade(save,'potato','reload'),false);assert.equal(save.coins,coins);
 const corrupt=C.sanitizeSave({weaponUpgrades:{potato:{reload:99,recoil:-1}},selected:{weapon:'bogus',combatTrack:'bogus'}});assert.equal(corrupt.weaponUpgrades.potato.reload,3);assert.equal(corrupt.weaponUpgrades.potato.recoil,0);assert.equal(corrupt.selected.weapon,'shotgun');
}
console.log('PASS weapon purchases, insufficient funds, caps, migration and reload effect.');
for(const def of C.COMBAT_TRACKS){
 const track=C.buildTrack(def),crowd=C.makeCrowd(track);
 assert.ok(crowd.length>=24,'Larger circuits need a full crowd');
 assert.ok(crowd.filter(p=>p.x>480).length>=8,'Populate the right half of the world');
 assert.ok(crowd.filter(p=>p.y>300).length>=8,'Populate the lower half of the world');
 for(const p of crowd){assert.ok(C.rectangleClear(track,p.x-14,p.y-33,32,43,0),'Farmers stay off the road');if(p.partner!==undefined)assert.equal(crowd[p.partner].partner,p.id);}
}
// Backward fire trades race speed for defense and cannot propel the shooter forward.
for(const weapon of Object.keys(C.WEAPONS)){
 const r=make(),a=r.actors[0];a.gun.weapon=weapon;a.gun.ammo=C.WEAPONS[weapon].ammo;
 Object.assign(a,{vx:80,vy:0,angle:0,hitPushX:0,hitPushY:0});a.gun.aim=Math.PI;
 C.fireShot(r,a);assert.equal(a.gun.rearFire,.8);assert.equal(a.vx,68);assert.ok(a.hitPushX<=.0001,'Rear recoil cannot boost forward');
 a.gun.cooldown=0;a.gun.reload=0;a.gun.ammo=1;C.fireShot(r,a);assert.equal(a.vx,68,'Repeated rear fire refreshes rather than compounds braking');
 r.actors=[a];for(let i=0;i<100;i++)C.updateCombat(r,{},1/120);assert.equal(a.gun.rearFire,0);
 a.gun.cooldown=0;a.gun.reload=0;a.gun.ammo=1;a.gun.aim=0;C.fireShot(r,a);assert.equal(a.gun.rearFire,0,'Forward fire has no rear-fire penalty');
}
{
 const r=make();r.cover=[];r.actors=r.actors.slice(0,1);const a=r.actors[0];
 const hit=()=>{r.bullets=[{x:a.x,y:a.y,vx:0,vy:0,life:1,weapon:'pistol',owner:9}];C.updateCombat(r,{},1/120);};
 hit();assert.equal(a.invulnerable,1.5);a.slow=0;a.stamina=2;
 for(let i=0;i<120;i++)C.updateCombat(r,{},1/120);
 hit();assert.equal(a.slow,0);assert.equal(a.stamina,2,'Protected hits do not drain stamina or refresh slow');
 for(let i=0;i<65;i++)C.updateCombat(r,{},1/120);
 hit();assert.ok(a.slow>0,'Hits work again after protection expires');
}
console.log('PASS rear-fire speed tradeoff, no forward recoil exploit, and 1.5-second hit protection.');
for(const id of ['fair','scrapyard','peat','airstrip','park']){
 const r=C.makeRace({mode:'combat',combatTrack:id,chicken:'greta'},C.freshSave()),h=r.courseHazards[0],a=r.actors[0];
 r.time=5.5;C.updateCourseHazards(r,0);assert.equal(h.state,'warning');Object.assign(a,{x:h.x,y:h.y,slow:0});C.updateCourseHazards(r,.01);assert.equal(a.slow,0,'Warning is harmless');
 r.time=7.5;C.updateCourseHazards(r,0);h.cooldowns={};Object.assign(a,{x:h.x,y:h.y,vx:80,vy:0,slow:0,boost:2});C.updateCourseHazards(r,.01);assert.ok(a.slow>0);assert.equal(a.boost,0);
 const rival=r.actors[1];Object.assign(rival,{x:h.x,y:h.y,slow:0});C.updateCourseHazards(r,.01);assert.ok(rival.slow>0,'Same hazard affects rivals');
 r.phase='paused';const before=JSON.stringify(r.courseHazards);C.tick(r,{},1);assert.equal(JSON.stringify(r.courseHazards),before,'Hazards freeze on pause');
 if(id==='scrapyard'){const outside=C.pointAt(r.track,r.track.length*h.fraction,24);assert.ok(Math.hypot(outside.x-h.x,outside.y-h.y)>h.radius+5,'Safe outside lane remains open');}
}
console.log('PASS themed hazards: warning, fair impacts, pause and press bypass.');

{
 const r=C.makeRace({mode:'combat',combatTrack:'scrapyard'},C.freshSave());
 const dog=r.courseHazards.find(h=>h.kind==='dog'),a=r.actors[0];
 assert.ok(dog,'Scrapyard has a guard dog');
 r.time=13.5;C.updateCourseHazards(r,0);assert.equal(dog.state,'warning');
 Object.assign(a,{x:dog.x,y:dog.y,slow:0});C.updateCourseHazards(r,.01);assert.equal(a.slow,0);
 r.time=15;C.updateCourseHazards(r,0);const start={x:dog.x,y:dog.y};
 r.time=16;C.updateCourseHazards(r,0);assert.equal(dog.state,'active');assert.ok(Math.hypot(dog.x-start.x,dog.y-start.y)>30,'Dog crosses the road');
 dog.cooldowns={};Object.assign(a,{x:dog.x,y:dog.y,vx:80,vy:0,boost:2,slow:0});C.updateCourseHazards(r,.01);
 assert.equal(a.boost,0);assert.equal(a.vx,24);assert.ok(a.slow>0);
 r.phase='paused';const before=JSON.stringify(dog);C.tick(r,{},1);assert.equal(JSON.stringify(dog),before);
}
console.log('PASS guard dog warning, crossing, braking and pause.');
// Combat ledger settles once, repeats currency jobs, and grants unique cosmetics.
{
 const s=C.freshSave();
 const finish=(track,weapon,shots=1)=>{const r=C.makeRace({mode:'combat',combatTrack:track,weapon},s);r.phase='finished';r.result={position:2,coins:90,time:100,bestLap:50};r.combatShots=shots;r.combatPotatoHits=5;C.settleRace(s,r);const snapshot=JSON.stringify(s);assert.equal(C.settleRace(s,r),null);assert.equal(JSON.stringify(s),snapshot);};
 finish('fair','shotgun',0);finish('scrapyard','pistol');finish('peat','rifle');
 assert.equal(s.combatPeace,1);assert.equal(s.combatPodiums,3);assert.equal(s.combatPotatoHits,15);
 assert.equal(C.claimContract(s,'combatPotatoHits'),150);assert.equal(C.claimContract(s,'combatPotatoHits'),0);
 assert.equal(C.claimContract(s,'combatPodiums'),180);assert.equal(C.claimContract(s,'combatPeace'),100);
 assert.equal(C.claimContract(s,'combatTour'),0);assert.equal(C.buyCosmetic(s,'outlaw'),false);
 finish('airstrip','potato');finish('park','shotgun');
 assert.equal(s.combatArsenal,4);assert.equal(s.combatTour,5);
 assert.equal(C.claimContract(s,'combatTour'),250);assert.equal(C.claimContract(s,'combatTour'),0);
 assert.equal(C.claimContract(s,'combatArsenal'),200);assert.ok(s.owned.includes('outlaw'));assert.ok(s.owned.includes('arsenal'));
 assert.equal(C.equipCosmetic(s,'outfit','arsenal'),true);
 const restored=C.sanitizeSave(JSON.parse(JSON.stringify(s)));assert.equal(restored.outfit,'arsenal');assert.equal(restored.combatTour,5);assert.equal(C.claimContract(restored,'combatArsenal'),0);
 finish('fair','potato');assert.equal(C.claimContract(s,'combatPotatoHits'),150);assert.equal(s.combatTour,5);
 const old=C.sanitizeSave({combatFinishes:30});assert.equal(old.combatTour,0);assert.equal(old.combatPeace,0);
 const bad=C.sanitizeSave({combatTracksDone:['fair','fair','bogus'],combatWeaponsDone:['potato','potato'],combatPotatoHits:-3});assert.equal(bad.combatTour,1);assert.equal(bad.combatArsenal,1);assert.equal(bad.combatPotatoHits,0);
}
console.log('PASS combat ledger rewards, one-time styling, repeat jobs, duplicate settlement and migration.');
// Alternative builds are real tradeoffs and stay out of ordinary racing.
{
 const s=C.freshSave();s.combatRig='magazine';
 const r=C.makeRace({mode:'combat',weapon:'shotgun'},s),a=r.actors[0];
 assert.equal(a.gun.ammo,4);assert.equal(C.gunCapacity(a.gun),4);
 for(let i=0;i<4;i++){a.gun.cooldown=0;C.fireShot(r,a);}assert.ok(Math.abs(a.gun.reload-2.3*1.35)<1e-8);
 assert.equal(C.makeRace({mode:'race'},s).actors[0].gun.rig,'stock');
 assert.equal(C.sanitizeSave({combatRig:'bogus'}).combatRig,'stock');
}
// Cup stages pay once, persist standings, and ordinary combat does not advance them.
{
 let s=C.freshSave();s.combatCup.active=true;
 const finish=(championship)=>{const r=C.makeRace({mode:'combat',championship,combatTrack:'fair'},s);r.phase='finished';r.result={coins:80,position:1,time:80,bestLap:40};r.actors[0].finishTime=80;C.settleRace(s,r);return r;};
 finish(false);assert.equal(s.combatCup.stage,0);
 for(let i=0;i<5;i++){assert.equal(s.combatCup.stage,i);const r=finish(true);assert.equal(r.track.id,C.COMBAT_TRACKS[i].id);assert.equal(C.settleRace(s,r),null);s=C.sanitizeSave(JSON.parse(JSON.stringify(s)));}
 assert.equal(s.combatCup.active,false);assert.equal(s.combatCup.titles,1);assert.equal(s.combatCup.scores[0],50);assert.equal(s.coins,980);
}
for(const t of C.COMBAT_TRACKS){
 const r=C.makeRace({mode:'combat',combatTrack:t.id},C.freshSave()),e=r.routeEvent,a=r.actors[0];
 assert.ok(C.shortcutWidth(r.track,r.track.length*.205)>40);assert.equal(C.shortcutWidth(r.track,r.track.length*.5),0);
 r.time=7;C.updateRouteEvent(r,0);assert.equal(e.state,'warning');Object.assign(a,{x:e.x,y:e.y,slow:0});C.updateRouteEvent(r,.01);assert.equal(a.slow,0);
 r.time=9;Object.assign(a,{vx:80,boost:2});C.updateRouteEvent(r,.01);assert.equal(e.state,'active');assert.equal(a.boost,0);assert.equal(a.vx,20);
 const x=e.x,y=e.y;a.lap=1;C.updateRouteEvent(r,.01);assert.ok(Math.hypot(e.x-x,e.y-y)>20);
 r.phase='paused';const before=JSON.stringify(e);C.tick(r,{},1);assert.equal(JSON.stringify(e),before);
}
console.log('PASS build tradeoffs, cup persistence and rewards, and per-lap bypass events.');
for(const def of C.COMBAT_TRACKS){
 const r=C.makeRace({mode:'combat',combatTrack:def.id,difficulty:'easy'},C.freshSave());r.countdown=0;r.phase='racing';let steps=0,used=false;
 while(r.phase!=='finished'&&steps++<240*120){const p=r.actors[0],d=p.along+20,extra=C.shortcutWidth(r.track,d),target=C.pointAt(r.track,d,extra>0?r.track.width+extra-20:18);C.tick(r,{x:target.x-p.x,y:target.y-p.y},1/120);const projection=C.project(r.track,p.x,p.y);if(projection.distance>r.track.width+8)used=true;}
 assert.equal(r.phase,'finished',def.id+' inner route must preserve lap progression');assert.ok(used,def.id+' bypass can actually be reached');
}
console.log('PASS all five bypasses are traversable and retain ordered lap progression.');
