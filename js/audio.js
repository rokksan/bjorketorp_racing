/* Original multi-channel chiptune arrangements. All notes synthesized locally. */
(function(root) {
  'use strict';
  const THEMES= {
    farm: {
      bpm:92,key:60,chords:[0,5,9,7,0,5,2,7],lead:[12,null,16,19,16,null,14,12, 9,null,12,16,14,12,9,null, 12,16,19,null,21,19,16,14, 11,null,14,17,16,14,12,null]
    },
    market: {
      bpm:122,key:60,chords:[0,5,0,7,9,5,2,7],lead:[12,16,19,null,19,21,19,16, 17,null,16,14,12,14,16,null, 12,16,19,24,23,21,19,16, 14,17,19,17,16,14,12,null]
    },
    meadow: {
      bpm:104,key:55,chords:[0,9,5,7,0,5,2,7],lead:[19,null,16,14,12,null,14,16, 21,19,16,null,14,12,9,null, 17,19,21,null,19,17,16,12, 14,null,16,19,17,14,12,null]
    },
    orchard: {
      bpm:142,key:57,chords:[0,5,9,7,5,0,2,7],lead:[12,14,16,19,16,14,12,null, 17,16,14,null,12,9,12,14, 16,19,21,19,17,16,14,12, 11,14,17,19,17,14,12,null]
    },
    result: {
      bpm:100,key:60,chords:[0,5,7,0,9,5,7,0],lead:[12,null,16,null,19,null,24,null,21,19,17,16,14,null,12,null,12,16,19,24,21,null,19,null,17,16,14,11,12,null,null,null]
    }
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
      this.music.gain.setTargetAtTime(this.settings.music*.38,t,.04);
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
      this.theme=theme;
      this.step=0;
      this.lastLap=false;
      if(this.context) {
        this.stopVoices();
        this.next=this.context.currentTime+.04;
      }
    }
    start() {
      if(!this.context||this.timer||this.paused)return;
      this.next=this.context.currentTime+.04;
      this.timer=setInterval(()=>this.schedule(),25);
      this.schedule();
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
        clearInterval(this.timer);
        this.timer=null;
        this.stopVoices();
      }
      else this.start();
    }
    tone(note,start,duration=.15,type='square',volume=.1,pan=0,bus=this.music,slide=null) {
      if(!this.context||!bus)return;
      const c=this.context,o=c.createOscillator(),gain=c.createGain();
      o.type=type;
      o.frequency.setValueAtTime(midi(note),start);
      if(slide!==null)o.frequency.exponentialRampToValueAtTime(midi(slide),start+duration);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.006);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      o.connect(gain);
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
      const c=this.context,theme=THEMES[this.theme]||THEMES.farm,bpm=theme.bpm+(this.lastLap?10:0),eighth=60/bpm/2;
      // A delayed tab never schedules a backlog of missed music.
      if(this.next<c.currentTime-.1)this.next=c.currentTime+.02;
      while(this.next<c.currentTime+.12) {
        const s=this.step,t=this.next,bar=Math.floor(s/8)%8,beat=s%8,rootNote=theme.key+theme.chords[bar];
        const lead=theme.lead[s%theme.lead.length];
        if(lead!==null&&this.settings.music>0) {
          this.tone(theme.key+lead+(s%64>=32&&beat===7?12:0),t,eighth*.86,this.theme==='farm'?'triangle':'square',.11,-.18);
        }
        if(this.settings.music>0) {
          if(beat%2===0)this.tone(rootNote-24+(beat===4?7:0),t,eighth*1.6,'triangle',.3,0);
          const chord=[0,4,7,12];
          if(theme.chords[bar]===9||theme.chords[bar]===2)chord[1]=3;
          this.tone(rootNote+chord[beat%4],t+.008,eighth*.55,'triangle',.11,.3);
          if(beat===0||beat===4)this.tone(42,t,.11,'sine',.3,0,this.music,26);
          if(beat===2||beat===6) {
            this.hiss(t,.095,.35,1200);
            this.tone(48,t,.07,'triangle',.1);
          }
          if(this.theme!=='farm')this.hiss(t,.035,beat%2?.12:.07,5500);
          if(bar===7&&beat>=6&&this.theme!=='farm')this.hiss(t+eighth/2,.05,.15,1800);
        }
        if(this.settings.ambience>0&&s%16===7&&this.theme!=='result'&&this.theme!=='meadow') {
          this.tone(this.theme==='orchard'?105:94,t,.12,'sine',.12,-.7,this.ambient,this.theme==='orchard'?108:101);
          this.tone(99,t+.15,.13,'sine',.1,-.65,this.ambient,94);
        }
        if(this.settings.ambience>0&&this.theme==='meadow') {
          if(s%4===0)this.hiss(t,1.2,.16,2200,this.ambient);
          if(s%2===0)this.tone(31,t,.09,'triangle',.11,.65,this.ambient,28);
        }
        if(this.settings.ambience>0&&s%32===0)this.hiss(t,1.5,.15,450,this.ambient);
        this.next+=eighth;
        this.step++;
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
      this.context?.close();
    }
  }
  root.FarmAudio= {
    AudioEngine,THEMES
  };
})(window);
