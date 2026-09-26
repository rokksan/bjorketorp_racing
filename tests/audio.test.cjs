const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const tones=[],levels=[],timers=new Set();let timerId=0;
const parameter=()=>({value:0,setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));},exponentialRampToValueAtTime(v,t){assert.ok(v>0&&Number.isFinite(t));},setTargetAtTime(v,t){levels.push(v);}});
function node(){return {connect(){},disconnect(){},gain:parameter(),frequency:parameter(),pan:parameter(),threshold:parameter(),ratio:parameter(),start(){},stop(){}};}
class Context{constructor(){this.currentTime=1;this.sampleRate=8000;this.destination=node();this.state='running';}createGain(){return node()}createDynamicsCompressor(){return node()}createOscillator(){const n=node();tones.push(n);return n;}createStereoPanner(){return node()}createBiquadFilter(){return node()}createBufferSource(){return node()}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)}}resume(){return Promise.resolve()}close(){}}
const sandbox={window:{AudioContext:Context},console,Math,setInterval:fn=>{timers.add(++timerId);return timerId;},clearInterval:id=>timers.delete(id)};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/audio.js'),'utf8'),sandbox);
(async()=>{const {AudioEngine,THEMES}=sandbox.window.FarmAudio,a=new AudioEngine({music:.45,sfx:.65,ambience:.35,mute:false});assert.equal(await a.unlock(),true);assert.equal(timers.size,1);await a.unlock();assert.equal(timers.size,1);
for(const theme of Object.keys(THEMES)){a.setTheme(theme);for(let i=0;i<8;i++){a.context.currentTime+=.5;a.schedule();}}
assert.ok(tones.some(o=>o.type==='triangle'));assert.ok(tones.some(o=>o.type==='square'));assert.ok(tones.some(o=>o.type==='sine'));
for(const effect of ['coin','pickup','boost','shield','mud','bump','count','go','lap','finish','buy','step','grass','tired','wrongway','crowd','throw','bottle','argument','scuffle'])a.play(effect);
a.pause(true);assert.equal(timers.size,0);assert.equal(a.nodes.size,0);a.pause(false);assert.equal(timers.size,1);a.configure({music:0,sfx:0,ambience:0,mute:true});assert.equal(levels.at(-1),0);assert.ok(levels.includes(0));a.destroy();assert.equal(timers.size,0);
console.log('PASS audio: five arrangements, instrument layers, every SFX, volume/mute, pause cleanup, one scheduler.');})();
