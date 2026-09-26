// Exercise the real browser controller with a small DOM/event harness.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),C=require('../js/core.js');
const noop=()=>{},nodes=new Map(),documentEvents={},windowEvents={},frames=new Map(),storage=new Map();let frameId=0,now=0,activeRace;
function element(id=''){
 const listeners={},children=[];const n={id,children,textContent:'',innerHTML:'',value:'',style:{},dataset:{},open:false,disabled:false,width:480,height:300,
 classList:{classes:new Set(),add(...s){s.forEach(v=>this.classes.add(v));},remove(...s){s.forEach(v=>this.classes.delete(v));},toggle(v,force){const set=force===undefined?!this.classes.has(v):force;if(set)this.classes.add(v);else this.classes.delete(v);},contains(v){return this.classes.has(v);}},
 setAttribute(k,v){this[k]=v;},addEventListener(k,fn){(listeners[k]??=[]).push(fn);},dispatch(k,e={}){listeners[k]?.forEach(fn=>fn({preventDefault:noop,...e}));},append(...a){children.push(...a);},replaceChildren(...a){children.length=0;children.push(...a);},querySelector(sel){this.cache??={};return this.cache[sel]??=element(sel);},getContext(){return {imageSmoothingEnabled:false,drawImage:noop};},focus:noop,scrollIntoView:noop,setPointerCapture:noop,showModal(){this.open=true;},close(){if(this.open){this.open=false;this.dispatch('close');}}};return n;
}
function get(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);}
for(const id of [...fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]))get(id);
const art={makeBackground:()=>({canvas:{},scene:[]}),drawFarm:noop,drawPortrait:noop,drawUpgrade:noop,render:noop};
class Audio{constructor(){this.paused=false;}unlock(){return Promise.resolve(true)}pause(v){this.paused=v;}setTheme(){}play(){}configure(){}}
const window={FarmRace:{...C,makeRace:(o,s)=>(activeRace=C.makeRace(o,s))},FarmArt:art,addEventListener:(k,fn)=>windowEvents[k]=fn};
const document={hidden:false,getElementById:get,createElement:()=>element(),querySelectorAll:s=>s==='dialog[open]'?[...nodes.values()].filter(n=>n.open):[],querySelector:s=>s==='dialog[open]'?[...nodes.values()].find(n=>n.open):null,addEventListener:(k,fn)=>documentEvents[k]=fn};
const sandbox={console,window,document,FarmAudio:{AudioEngine:Audio},matchMedia:()=>({matches:true}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8'),sandbox);
function step(){assert.equal(frames.size,1,'Exactly one pending animation frame');const [id,fn]=frames.entries().next().value;frames.delete(id);now+=1000/60;fn(now);}
get('start-button').onclick();step();get('pause-button').onclick();assert.equal(activeRace.phase,'paused');
const pausedTime=activeRace.time;for(let i=0;i<10;i++)step();assert.equal(activeRace.time,pausedTime);
get('pause-restart-button').onclick();get('pause-button').onclick();get('pause-restart-button').onclick();step();assert.equal(frames.size,1);
const keyState=new Set();function input(key,on){if(on&&!keyState.has(key)){keyState.add(key);documentEvents.keydown({key,repeat:false,preventDefault:noop});}if(!on&&keyState.has(key)){keyState.delete(key);documentEvents.keyup({key});}}
let ticks=0;
while(activeRace.phase!=='finished'&&ticks++<9000){const p=activeRace.actors[0],target=C.pointAt(activeRace.track,p.along+15),dx=target.x-p.x,dy=target.y-p.y,m=Math.max(Math.abs(dx),Math.abs(dy));input('ArrowRight',dx>m*.35);input('ArrowLeft',dx<-m*.35);input('ArrowDown',dy>m*.35);input('ArrowUp',dy<-m*.35);input('Shift',p.stamina>.5);if(p.item){documentEvents.keydown({key:' ',repeat:false,preventDefault:noop});}step();}
assert.equal(activeRace.phase,'finished','Finish a full race using only real keyboard listeners and animation frames');
assert.equal(get('results').classList.contains('hidden'),false);assert.ok(get('result-title').textContent);assert.ok(get('result-rewards').innerHTML.includes('gårdsmynt'));
const stored=JSON.parse(storage.get('bjorketorp-farm-v2'));assert.equal(stored.races,1);assert.ok(stored.coins>0);assert.equal(get('result-laps').innerHTML.match(/<li>/g).length,3);
get('finish-menu-button').onclick();assert.equal(get('hub').classList.contains('hidden'),false);assert.equal(get('workshop-view').classList.contains('hidden'),false);
const beforePurchase=JSON.parse(storage.get('bjorketorp-farm-v2'));
get('upgrade-cards').children[0].querySelector('button').dispatch('click');
const afterPurchase=JSON.parse(storage.get('bjorketorp-farm-v2'));assert.equal(afterPurchase.upgrades.feed,1);assert.equal(afterPurchase.coins,beforePurchase.coins-C.UPGRADES.feed.cost[0]);
get('start-button').onclick();document.hidden=true;documentEvents.visibilitychange();assert.equal(activeRace.phase,'paused');assert.equal(frames.size,0);document.hidden=false;documentEvents.visibilitychange();assert.equal(frames.size,1);assert.equal(activeRace.phase,'paused');
console.log('PASS real controller: start, pause, repeated restart, keyboard-driven full race, result DOM, saved rewards, workshop return, background pause and single RAF.');

// Two independent pointers: steering continues while aim fires and releases.
get('mode').value='combat';get('mode').onchange();get('start-button').onclick();
for(let i=0;i<185;i++)step();assert.equal(activeRace.phase,'racing');
for(const id of ['move-stick','aim-stick'])get(id).getBoundingClientRect=()=>({left:0,top:0,width:120,height:120});
get('move-stick').dispatch('pointerdown',{pointerId:1,clientX:90,clientY:60});
get('aim-stick').dispatch('pointerdown',{pointerId:2,clientX:60,clientY:100});
const ammo=activeRace.actors[0].gun.ammo;step();step();assert.ok(activeRace.actors[0].gun.ammo<ammo,'Aim stick fires');
assert.ok(Math.abs(activeRace.actors[0].gun.aim-Math.PI/2)<.01,'Aim is independent of movement');
get('aim-stick').dispatch('pointercancel',{pointerId:2});
assert.ok(get('move-stick').classList.contains('engaged'),'Cancel aim leaves movement active');
get('pause-button').onclick();assert.equal(get('move-stick').classList.contains('engaged'),false,'Pause releases all pointers');
get('resume-button').onclick();assert.equal(get('aim-stick').classList.contains('engaged'),false);
get('move-stick').dispatch('pointerdown',{pointerId:3,clientX:100,clientY:60});windowEvents.resize();assert.equal(get('move-stick').classList.contains('engaged'),false,'Rotation/resize clears stale joystick coordinates');
console.log('PASS dual touch: independent movement/aim, shooting, pointer cancellation, pause and resize cleanup.');

// Storage denial must never prevent startup or racing.
frames.clear();
const blocked={...sandbox,localStorage:{getItem(){throw Error('denied')},setItem(){throw Error('denied')}}};
vm.createContext(blocked);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8'),blocked);
assert.ok(get('save-indicator').textContent.includes('Tillfällig'));
get('start-button').onclick();step();assert.equal(activeRace.phase,'countdown');
console.log('PASS real controller also starts and races when all persistent storage is denied.');
