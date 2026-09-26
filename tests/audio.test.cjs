const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const tones=[],levels=[],timers=new Set();let timerId=0;
const parameter=()=>({value:0,setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));},exponentialRampToValueAtTime(v,t){assert.ok(v>0&&Number.isFinite(t));},setTargetAtTime(v,t){levels.push(v);}});
function node(){return {connect(){},disconnect(){},gain:parameter(),frequency:parameter(),pan:parameter(),threshold:parameter(),ratio:parameter(),start(){},stop(){}};}
class Context{constructor(){this.currentTime=1;this.sampleRate=8000;this.destination=node();this.state='running';}createMediaElementSource(){return node()}createGain(){return node()}createDynamicsCompressor(){return node()}createOscillator(){const n=node();tones.push(n);return n;}createStereoPanner(){return node()}createBiquadFilter(){return node()}createBufferSource(){return node()}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)}}resume(){return Promise.resolve()}close(){}}
class Audio{constructor(){this.paused=true;this.currentTime=0;this.calls=0;}getAttribute(){return this.src}addEventListener(){}play(){this.calls++;this.paused=false;return Promise.resolve()}pause(){this.paused=true}removeAttribute(){this.src=''}load(){}}
const sandbox={window:{AudioContext:Context,Audio},console,Math,setInterval:fn=>{timers.add(++timerId);return timerId;},clearInterval:id=>timers.delete(id)};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/audio.js'),'utf8'),sandbox);
(async()=>{const {AudioEngine,THEMES}=sandbox.window.FarmAudio,a=new AudioEngine({music:.45,sfx:.65,ambience:.35,mute:false});assert.equal(await a.unlock(),true);assert.equal(timers.size,1);await a.unlock();assert.equal(timers.size,1);
assert.equal(a.player.loop,true);assert.equal(a.player.src,THEMES.farm.src);
a.player.currentTime=12;a.pause(true);assert.equal(a.player.paused,true);a.pause(false);assert.equal(a.player.currentTime,12,'Pause resumes the same recording');
const calls=a.player.calls;a.setTheme('result');assert.equal(a.player.calls,calls,'Shared menu/result recording keeps playing');
for(const theme of Object.keys(THEMES)){assert.ok(THEMES[theme].title);assert.ok(fs.statSync(path.join(__dirname,'..',THEMES[theme].src)).size>100000);a.setTheme(theme);assert.equal(a.player.src,THEMES[theme].src);}
a.pause(true);a.setTheme('market');assert.equal(a.player.paused,true,'Theme change must not start paused audio');a.pause(false);assert.equal(a.player.src,THEMES.market.src);
a.configure({music:.45,sfx:.65,ambience:0,mute:false});tones.length=0;
for(let i=0;i<48;i++){a.context.currentTime+=.5;a.schedule();}
assert.equal(tones.length,0,'Music must never generate synthetic instrument tones');
for(const effect of ['coin','pickup','boost','shield','mud','bump','count','go','lap','finish','buy','step','grass','tired','wrongway','crowd','throw','bottle','argument','scuffle'])a.play(effect);
a.pause(true);assert.equal(timers.size,0);assert.equal(a.nodes.size,0);a.pause(false);assert.equal(timers.size,1);a.configure({music:0,sfx:0,ambience:0,mute:true});assert.equal(levels.at(-1),0);assert.ok(levels.includes(0));a.destroy();assert.equal(timers.size,0);
console.log('PASS audio: bundled recordings, theme changes, pause/resume, no synth music, SFX, mute and cleanup.');})();
