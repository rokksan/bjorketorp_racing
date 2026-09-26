/* Licensed music recordings with separate procedural effects and ambience. */
(function(root) {
  'use strict';
  // Recordings by Kevin MacLeod, CC BY 4.0; see assets/audio/ATTRIBUTION.md.
  const track=(title,file)=>({title,src:'assets/audio/'+file+'.mp3'});
  const THEMES={
    farm:track('Still Pickin','still-pickin'),
    market:track('Hillbilly Swing','hillbilly-swing'),
    meadow:track('River Valley Breakdown','river-valley-breakdown'),
    orchard:track('Corncob','corncob'),
    result:track('Still Pickin','still-pickin')
  };
  const midi=n=>440*Math.pow(2,(n-69)/12);
  class AudioEngine {
    constructor(settings) {
      this.settings= {
        ...settings
      };
      this.context=null;
      this.theme='farm';
      this.step=0;
      this.next=0;
      this.timer=null;
      this.paused=false;
      this.lastLap=false;
      this.nodes=new Set();
      this.noise=null;
      this.player=null;
      this.musicSource=null;
      this.musicRequest=0;
      this.lastSfx= {
      };
    }
    async unlock() {
      try {
        if(!this.context) {
          const Constructor=root.AudioContext||root.webkitAudioContext;
          if(!Constructor)return false;
          const c=this.context=new Constructor();
          this.master=c.createGain();
          this.compressor=c.createDynamicsCompressor();
          this.compressor.threshold.value=-15;
          this.compressor.ratio.value=4;
          this.master.connect(this.compressor);
          this.compressor.connect(c.destination);
          this.music=c.createGain();
          this.sfx=c.createGain();
          this.ambient=c.createGain();
          for(const bus of [this.music,this.sfx,this.ambient])bus.connect(this.master);
          this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);
          const data=this.noise.getChannelData(0);
          let prev=0;
          for(let i=0;i<data.length;i++) {
            prev=(prev+Math.random()*.16-.08)*.97;
            data[i]=prev;
          }
          this.player=new root.Audio();
          this.player.loop=true;
          this.player.preload='metadata';
          this.musicSource=c.createMediaElementSource(this.player);
          this.musicSource.connect(this.music);
          this.player.addEventListener('error',()=>console.warn('Musikfilen kunde inte laddas:',this.player.getAttribute('src')));
          this.apply();
        }
        if(this.context.state==='suspended')await this.context.resume();
        this.start();
        return true;
      }
      catch(error) {
        console.warn('Ljud kunde inte startas:',error.message);
        return false;
      }
    }
    apply() {
      if(!this.context)return;
      const t=this.context.currentTime;
      this.master.gain.setTargetAtTime(this.settings.mute?0:.75,t,.03);
      this.music.gain.setTargetAtTime(this.settings.music*.9,t,.04);
      this.sfx.gain.setTargetAtTime(this.settings.sfx*.55,t,.04);
      this.ambient.gain.setTargetAtTime(this.settings.ambience*.23,t,.04);
    }
    configure(settings) {
      this.settings= {
        ...settings
      };
      this.apply();
    }
    setTheme(theme) {
      if(this.theme===theme)return;
      this.theme=THEMES[theme]?theme:'farm';
      this.step=0;
      this.lastLap=false;
      if(this.context) {
        this.stopVoices();
        this.next=this.context.currentTime+.04;
        this.startMusic();
      }
    }
    start() {
      if(!this.context||this.paused)return;
      this.startMusic();
      if(this.timer)return;
      this.next=this.context.currentTime+.04;
      this.timer=setInterval(()=>this.schedule(),25);
      this.schedule();
    }
    startMusic() {
      if(!this.player||this.paused)return;
      const src=THEMES[this.theme].src;
      if(this.player.getAttribute('src')!==src) {
        this.player.pause();
        this.player.src=src;
      } else if(!this.player.paused)return;
      const request=++this.musicRequest;
      this.player.play().catch(error=>{
        // Source changes and pausing can cancel an earlier play request.
        if(request===this.musicRequest&&error.name!=='AbortError')console.warn('Musiken kunde inte startas:',error.message);
      });
    }
    stopVoices() {
      for(const node of this.nodes) {
        try {
          node.stop();
        }
        catch {
        }
      }
      this.nodes.clear();
    }
    pause(value) {
      this.paused=value;
      if(value) {
        this.musicRequest++;
        this.player?.pause();
        clearInterval(this.timer);
        this.timer=null;
        this.stopVoices();
      }
      else this.start();
    }
    tone(note,start,duration=.15,type='square',volume=.1,pan=0,bus=this.music,slide=null) {
      if(!this.context||!bus)return;
      const c=this.context,o=c.createOscillator(),gain=c.createGain();
      o.type=['reed','fiddle'].includes(type)?'sawtooth':type;
      o.frequency.setValueAtTime(midi(note),start);
      if(type==='fiddle')for(let offset=.025;offset<duration;offset+=.025) {
        const vibrato=Math.sin(offset*Math.PI*2*5.8)*.085*Math.min(1,offset/.09);
        o.frequency.setValueAtTime(midi(note+vibrato),start+offset);
      }
      if(slide!==null)o.frequency.exponentialRampToValueAtTime(midi(slide),start+duration);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+(type==='fiddle'?.018:type==='reed'?.035:.006));
      if(type==='reed'||type==='fiddle')gain.gain.setValueAtTime(Math.max(.0002,volume*.8),start+duration*.65);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      let filter;
      if(type==='reed'||type==='fiddle'){filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='fiddle'?3200:1900;o.connect(filter);filter.connect(gain);}else o.connect(gain);
      let panner;
      if(c.createStereoPanner) {
        panner=c.createStereoPanner();
        panner.pan.value=pan;
        gain.connect(panner);
        panner.connect(bus);
      }
      else gain.connect(bus);
      this.nodes.add(o);
      o.onended=()=> {
        this.nodes.delete(o);
        o.disconnect();
        if(filter)filter.disconnect();
        gain.disconnect();
        if(panner)panner.disconnect();
      };
      o.start(start);
      o.stop(start+duration+.02);
    }
    hiss(start,duration,volume,frequency=2000,bus=this.music) {
      const c=this.context;
      if(!c)return;
      const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
      source.buffer=this.noise;
      filter.type='highpass';
      filter.frequency.value=frequency;
      gain.gain.setValueAtTime(volume,start);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      this.nodes.add(source);
      source.onended=()=> {
        this.nodes.delete(source);
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      source.start(start);
      source.stop(start+duration);
    }
    schedule() {
      if(!this.context||this.paused)return;
      const c=this.context;
      if(this.next<c.currentTime-.1)this.next=c.currentTime+.02;
      while(this.next<c.currentTime+.12) {
        const s=this.step,t=this.next;
        if(this.settings.ambience>0) {
          if(this.theme==='meadow'&&s%4===0){this.hiss(t,1.1,.17,2200,this.ambient);this.tone(29,t,.18,'triangle',.12,.6,this.ambient,26);}
          else if(this.theme==='orchard'&&s%24===0)this.hiss(t,.25,.08,4500,this.ambient);
          if(s%32===0)this.hiss(t,1.5,.12,450,this.ambient);
        }
        this.next+=.25;this.step++;
      }
    }
    play(name) {
      const c=this.context;
      if(!c||this.paused||this.settings.mute)return;
      const now=c.currentTime;
      if(now-(this.lastSfx[name]||-100)<( {
        coin:.07,step:.1,grass:.1,bump:.3
      }
      [name]||.05))return;
      this.lastSfx[name]=now;
      const n=(note,offset=0,duration=.1,type='square',vol=.22,slide=null)=>this.tone(note,now+offset,duration,type,vol,0,this.sfx,slide);
      switch(name) {
        case'cross':this.tone(31,now,.6,'sawtooth',.055,.7,this.ambient,44);this.tone(44,now+.6,.8,'sawtooth',.045,.7,this.ambient,28);break;
        case'argument':[48,55,47,58].forEach((p,i)=>n(p,i*.14,.12,'sawtooth',.12));break;
        case'scuffle':for(let i=0;i<4;i++){this.hiss(now+i*.16,.12,.25,700,this.sfx);n(43+i, i*.16,.12,'triangle',.2,32);}break;
        case'crowd':[48,53,50].forEach((p,i)=>n(p,i*.09,.085,'sawtooth',.08));break;
        case'throw':this.hiss(now,.18,.2,1300,this.sfx);n(60,0,.18,'triangle',.12,73);break;
        case'bottle':this.hiss(now,.12,.25,4500,this.sfx);n(94,0,.07,'triangle',.19);n(101,.04,.05,'triangle',.12);break;
        case'step':this.hiss(now,.025,.11,1800,this.sfx);
        break;
        case'grass':this.hiss(now,.06,.18,700,this.sfx);
        break;
        case'tired':n(55,0,.15,'triangle',.18,48);
        break;
        case'wrongway':n(60,0,.08,'triangle',.15);n(55,.14,.12,'triangle',.15);
        break;
        case'coin':n(88,0,.07,'triangle',.3);
        n(95,.06,.13,'triangle',.23);
        break;
        case'pickup':[72,76,79,84].forEach((p,i)=>n(p,i*.045,.13,'square',.16));
        break;
        case'boost':n(48,0,.36,'sawtooth',.16,84);
        this.hiss(now,.2,.16,1600,this.sfx);
        break;
        case'shield':n(84,0,.3,'triangle',.3);
        n(91,.06,.4,'sine',.23);
        break;
        case'mud':n(48,0,.24,'triangle',.4,29);
        this.hiss(now,.2,.45,300,this.sfx);
        break;
        case'bump':this.hiss(now,.12,.6,600,this.sfx);
        n(41,0,.17,'square',.13,27);
        break;
        case'count':n(72,0,.1,'square',.2);
        break;
        case'go':n(84,0,.4,'square',.2);
        n(79,0,.3,'triangle',.2);
        break;
        case'lap':[79,84,88].forEach((p,i)=>n(p,i*.08,.18,'triangle',.3));
        break;
        case'finish':[72,76,79,84,79,84,88].forEach((p,i)=>n(p,i*.1,.3,'square',.14));
        break;
        case'buy':[60,67,72,76,79].forEach((p,i)=>n(p,i*.07,.22,'triangle',.3));
        break;
        case'click':n(76,0,.04,'triangle',.18);
        break;
        default:break;
      }
    }
    destroy() {
      this.pause(true);
      this.musicSource?.disconnect();
      if(this.player){this.player.removeAttribute('src');this.player.load();}
      this.context?.close();
    }
  }
  root.FarmAudio= {
    AudioEngine,THEMES
  };
})(window);
