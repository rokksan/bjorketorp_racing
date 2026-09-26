/* Pure simulation and saved progression. No DOM or audio dependency. */
(function (root) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const CHARACTERS = {
    greta: {
      name:'Gårds-Greta',short:'Greta',tag:'En trygg allroundhöna',speed:72,grip:8,stamina:2.2,color:'cream',perk:'Balanserad fart och kontroll'
    },
    ragna: {
      name:'Raket-Ragnhild',short:'Ragnhild',tag:'Snabb, men lite yvig',speed:76,grip:5.5,stamina:1.7,color:'rust',perk:'Högst toppfart, längre svängar'
    },
    par: {
      name:'Pansar-Pär',short:'Pär',tag:'Stadig genom leran',speed:69,grip:10,stamina:2.5,color:'sage',perk:'Halverad tid för hinderpåverkan'
    },
    agnes: {
      name:'Ägg-Agnes',short:'Agnes',tag:'Ett ess under vingen',speed:71,grip:8,stamina:2.2,color:'lilac',perk:'Startar varje lopp med ett fartägg'
    }
  };
  const TRACKS = [
  {
    id:'market',name:'Björketorp marknad',short:'Marknadsrundan',subtitle:'Där varje höna börjar',description:'En generös första bana runt gården. Breda kurvor och gott om plats för omkörning.',unlock:0,theme:'spring',width:22,par:53,points:[[108,232],[55,188],[54,91],[112,53],[280,50],[410,79],[430,177],[371,238],[230,247]],obstacles:[.22,.65],music:'market'
  },
  {
    id:'meadow',name:'Kladdis leriga långrunda',short:'Leriga långrundan',subtitle:'Regn, traktorer och en rejäl hårnål',description:'Långa åkerrakor och en dubbel återvändare. Spurta på torr mark, välj insidan runt leran.',unlock:2,theme:'rain',width:17,par:65,points:[[100,260],[50,210],[50,60],[110,35],[390,35],[435,70],[395,105],[180,105],[135,145],[185,205],[395,205],[435,245],[390,275],[230,275]],obstacles:[.15,.35,.55,.73,.88],music:'meadow'
  },
  {
    id:'orchard',name:'Callheims nattliga skördefest',short:'Nattliga skördefesten',subtitle:'Lyktor, träbro och fest i logen',description:'En slingrig nattbana med S-kurvor, smal träbro och bred omkörning genom festlogen.',unlock:5,theme:'night',width:19,par:62,points:[[98,247],[48,198],[56,116],[106,58],[177,54],[214,109],[272,109],[309,52],[391,60],[428,116],[397,167],[329,180],[316,234],[241,254],[178,215]],obstacles:[.18,.42,.83],music:'orchard',bridge:[.55,.62],hall:.88
  }
  ];
  const CROWD_DIALOGUE = [
  { speaker: 0, target: 1, text: "Såg du Kladdis gamla rekord? 0:42!" },
  { speaker: 1, target: 0, text: "Emil är en gud. Ingen annan når hans nivå!" },
  { speaker: 2, target: 3, text: "Jag hörde att han åt Nutella med högaffel." },
  { speaker: 3, target: 2, text: "Med högaffel? Då förstår man rekordet!" },
  { speaker: 4, target: 0, text: "Ingen springer som Kladdis. Ingen!" },
  { speaker: 0, target: 4, text: "Och ingen äter lika mycket Nutella heller." },
  { speaker: 2, target: 1, text: "Hönorna tävlar om andraplatsen, va?" },
  { speaker: 1, target: 2, text: "Exakt. Kladdis har redan vunnit för evigt." },
  { speaker: 3, target: 4, text: "Emil hade problem med luftmotståndet en gång." },
  { speaker: 4, target: 3, text: "Han löste det genom att springa snabbare än vinden." },
  { speaker: 0, target: 2, text: "Bumpstoppet på en höna blev bortplockat." },
  { speaker: 2, target: 0, text: "Kladdis sa att det bara gjorde loppet mer spännande." },
  { speaker: 3, target: 1, text: "LubriKent lurade honom på 23018 kronor!" },
  { speaker: 1, target: 3, text: "Då gick ekonomin åt skogen, men rekordet stod kvar." },
  { speaker: 4, target: 2, text: "En gud kan tydligen ha dåliga kvitton också." },
  { speaker: 0, target: 1, text: "Emils luftmotstånd sitter visst i höfterna." },
  { speaker: 1, target: 0, text: "Han har tappat bort Inga Tåjärn någonstans." },
  { speaker: 2, target: 3, text: "Emil krockade sin Delicato 999RR!" },
  { speaker: 3, target: 2, text: "Han har så många barn på byn att publiken räcker runt banan." },
  { speaker: 4, target: 0, text: "Han fastnade med foten i en portergryta en gång." },
  { speaker: 0, target: 4, text: "Emil älskar Jägermeister nästan lika mycket som Nutella." }
  ];
  const UPGRADES = {
    feed: {
      name:'Kraftfoder',description:'+3 % toppfart per nivå',cost:[90,220,450],max:3
    },
    boots: {
      name:'Springdojor',description:'Kvickare svängar, bättre grepp på gräs',cost:[75,180,360],max:3
    },
    nest: {
      name:'Vilobo',description:'+0,4 s spurt och snabbare återhämtning',cost:[85,200,400],max:3
    }
  };
  const CONTRACTS = [
  {
    id:'races',name:'Bli varm i fjädrarna',description:'Kör klart 3 lopp',target:3,reward:45
  },
  {
    id:'corn',name:'Ladans lilla samlare',description:'Samla 24 majskorn',target:24,reward:55
  },
  {
    id:'items',name:'Ett ägg i rockärmen',description:'Använd 6 föremål',target:6,reward:50
  },
  {
    id:'wins',name:'Gårdens stolthet',description:'Vinn 2 lopp',target:2,reward:75
  }
  ];
  function freshSave() {
    return {
      version:2,courseRevision:2,coins:0,xp:0,races:0,wins:0,corn:0,items:0,upgrades: {
        feed:0,boots:0,nest:0
      },medals: {
      },records: {
      },ghosts: {
      },contracts: {
      },settings: {
        music:.45,sfx:.65,ambience:.35,mute:false
      },selected: {
        track:'market',chicken:'greta',difficulty:'easy',mode:'race'
      },skin:'classic'
    };
  }
  function sanitizeSave(raw) {
    const s = freshSave();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;
    const integer = (n, max=999999) => Number.isFinite(n) ? clamp(Math.floor(n),0,max) : 0;
    for (const key of ['coins','xp','races','wins','corn','items']) s[key]=integer(raw[key]);
    for (const key of Object.keys(UPGRADES)) s.upgrades[key]=integer(raw.upgrades?.[key],3);
    for (const t of TRACKS) for(const d of ['easy','normal','hard']) s.medals[`${t.id}:${d}`]=integer(raw.medals?.[`${t.id}:${d}`],3);
    for(const t of TRACKS) for(const mode of ['race','trial']) for(const d of ['easy','normal','hard']) {
      if(t.id!=='market'&&raw.courseRevision!==2)continue;
      const key=`${t.id}:${mode}:${d}`,v=raw.records?.[key];
      if(v && Number.isFinite(v.time) && v.time>0 && v.time<36000) s.records[key]= {
        time:v.time,lap:Number.isFinite(v.lap)&&v.lap>0?v.lap:v.time/3
      };
    }
    for(const c of CONTRACTS) s.contracts[c.id]=integer(raw.contracts?.[c.id],10000);
    for(const track of TRACKS) {
      if(track.id!=='market'&&raw.courseRevision!==2)continue;
      const ghost=raw.ghosts?.[track.id];
      if(!Array.isArray(ghost)||ghost.length<2||ghost.length>2400)continue;
      let previous=-1;
      const valid=ghost.every(sample=> {
        if(!Array.isArray(sample)||sample.length!==4||!sample.every(Number.isFinite))return false;
        const [time,x,y,angle]=sample;
        if(time<=previous||time<0||time>600||x<0||x>480||y<0||y>300||Math.abs(angle)>Math.PI+.01)return false;
        previous=time;
        return true;
      });
      if(valid)s.ghosts[track.id]=ghost.map(sample=>sample.slice());
    }
    for(const k of ['music','sfx','ambience']) if(Number.isFinite(raw.settings?.[k])) s.settings[k]=clamp(raw.settings[k],0,1);
    s.settings.mute=raw.settings?.mute===true;
    if(TRACKS.some(t=>t.id===raw.selected?.track && t.unlock<=s.races)) s.selected.track=raw.selected.track;
    if(CHARACTERS[raw.selected?.chicken]) s.selected.chicken=raw.selected.chicken;
    if(['easy','normal','hard'].includes(raw.selected?.difficulty)) s.selected.difficulty=raw.selected.difficulty;
    if(['race','trial'].includes(raw.selected?.mode)) s.selected.mode=raw.selected.mode;
    if(s.selected.mode==='trial')s.selected.difficulty='easy';
    if(['classic','blue','gold'].includes(raw.skin) && (raw.skin==='classic'||raw.skin==='blue'&&s.races>=3||raw.skin==='gold'&&TRACKS.every(t=>(s.medals[`${t.id}:normal`]||0)===3))) s.skin=raw.skin;
    return s;
  }
  function buyUpgrade(save,key) {
    const u=UPGRADES[key];
    if(!u) return false;
    const level=save.upgrades[key],cost=u.cost[level];
    if(level>=u.max||save.coins<cost) return false;
    save.coins-=cost;
    save.upgrades[key]++;
    return true;
  }
  function claimContract(save,key) {
    const c=CONTRACTS.find(c=>c.id===key);
    if(!c) return 0;
    const claimed=save.contracts[key]||0;
    if(save[key]<(claimed+1)*c.target) return 0;
    save.contracts[key]=claimed+1;
    save.coins+=c.reward;
    return c.reward;
  }
  function buildTrack(def) {
    // Closed Catmull-Rom spline: the same centerline drives art, collisions and progress.
    const points=[],src=def.points;
    for(let i=0;i<src.length;i++) for(let j=0;j<16;j++) {
      const t=j/16,t2=t*t,t3=t2*t,p0=src[(i-1+src.length)%src.length],p1=src[i],p2=src[(i+1)%src.length],p3=src[(i+2)%src.length];
      const axis=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
      points.push( {
        x:axis(0),y:axis(1)
      });
    }
    let length=0;
    const segments=points.map((a,i)=> {
      const b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),s= {
        a,b,dx,dy,len,start:length
      };
      length+=len;
      return s;
    });
    return {
      ...def,segments,length
    };
  }
  function pointAt(track,distance,offset=0) {
    const d=((distance%track.length)+track.length)%track.length;
    const seg=track.segments.find(s=>s.start+s.len>=d)||track.segments.at(-1);
    const t=(d-seg.start)/seg.len,nx=-seg.dy/seg.len,ny=seg.dx/seg.len;
    return {
      x:seg.a.x+seg.dx*t+nx*offset,y:seg.a.y+seg.dy*t+ny*offset,angle:Math.atan2(seg.dy,seg.dx),nx,ny
    };
  }
  function project(track,x,y) {
    let best= {
      distance:Infinity
    };
    for(const s of track.segments) {
      const t=clamp(((x-s.a.x)*s.dx+(y-s.a.y)*s.dy)/(s.len*s.len),0,1),px=s.a.x+s.dx*t,py=s.a.y+s.dy*t,dist=Math.hypot(x-px,y-py);
      if(dist<best.distance) best= {
        x:px,y:py,distance:dist,along:s.start+t*s.len,angle:Math.atan2(s.dy,s.dx),side:Math.sign(s.dx*(y-py)-s.dy*(x-px))
      };
    }
    return best;
  }
  function rectangleClear(track,x,y,w,h,padding=5) {
    // Whole visual footprint, not only the trunk/anchor; conservative margin between samples.
    for(let py=y-padding;py<=y+h+padding;py+=3) for(let px=x-padding;px<=x+w+padding;px+=3) if(project(track,px,py).distance<track.width+5) return false;
    return true;
  }
  function roadWidth(track,along) {
    const f=along/track.length;
    return track.bridge&&f>track.bridge[0]&&f<track.bridge[1]?12:track.width;
  }
  const FARMER_NAMES=['Raggar-Rune','Bulten','Sur-Sören','Dunk-Doris','Lad-Lasse','Stövel-Stina','Burk-Bosse','Gurra'];
  function makeCrowd(track) {
    const people=[];
    for(let y=95;y<265&&people.length===0;y+=10)for(let x=110;x<370&&people.length===0;x+=10) {
      if(!rectangleClear(track,x-14,y-33,54,43,0))continue;
      for(let i=0;i<2;i++)people.push({x:x+i*22,y,id:i,name:FARMER_NAMES[i],mood:'heckle',moodTime:0,partner:1-i,color:i?'#486b59':'#a84b3e',windup:0});
    }
    for(let i=0;i<30&&people.length<6;i++) {
      for(const side of [1,-1]) {
        const p=pointAt(track,track.length*(.025+i*.032),side*(track.width+23));
        if(p.x<12||p.x>468||p.y<32||p.y>290||!rectangleClear(track,p.x-14,p.y-33,32,43,0)||people.some(o=>Math.hypot(o.x-p.x,o.y-p.y)<35))continue;
        people.push({...p,id:people.length,name:FARMER_NAMES[people.length%FARMER_NAMES.length],mood:'heckle',moodTime:0,color:['#a84b3e','#486b59','#b38b43','#73506e'][i%4],windup:0});
        break;
      }
    }
    for(let y=38;y<280&&people.length<6;y+=24)for(let x=22;x<460&&people.length<6;x+=24) {
      if(project(track,x,y).distance>90||!rectangleClear(track,x-14,y-33,32,43,0)||people.some(p=>Math.hypot(p.x-x,p.y-y)<35))continue;
      people.push({x,y,id:people.length,name:FARMER_NAMES[people.length%FARMER_NAMES.length],mood:'heckle',moodTime:0,color:['#a84b3e','#486b59','#b38b43'][people.length%3],windup:0});
    }
    // Paired hecklers get a dedicated clearing for their arguments and scuffles.
    let pairs=people.some(p=>p.partner!==undefined)?1:0;
    for(const host of people.slice()) {
      if(pairs>=2)break;
      if(host.partner!==undefined)continue;
      const x=host.x+22,y=host.y;
      if(x<465&&rectangleClear(track,host.x-14,y-33,54,43,0)&&!people.some(p=>Math.hypot(p.x-x,p.y-y)<19)) {
        const mate={...host,x,id:people.length,name:FARMER_NAMES[people.length%FARMER_NAMES.length],color:'#846b99',partner:host.id};
        host.partner=mate.id;people.push(mate);pairs++;
      }
    }
    return people;
  }
  function updateCrowd(r,dt) {
    r.crowdSpeechTime=Math.max(0,r.crowdSpeechTime-dt);
    r.crowdTalk-=dt;
    for(const farmer of r.crowd) {
      farmer.windup=Math.max(0,farmer.windup-dt);
      farmer.moodTime=Math.max(0,farmer.moodTime-dt);
      if(farmer.moodTime===0)farmer.mood='heckle';
    }
    r.brawlTimer-=dt;
    if(r.brawlTimer<=0) {
      const pairs=r.crowd.filter(p=>p.partner>p.id),host=pairs[r.brawlIndex%Math.max(1,pairs.length)];
      if(host) {
        const mate=r.crowd[host.partner];
        host.mood=mate.mood='argue';host.moodTime=mate.moodTime=6;
        r.crowdSpeaker=host.id;
        r.crowdSpeech=['VEM TOG MIN FLASKA?! Kladdis såg allt!','Rör inte min stövel, din ladugårdstomte!','Emil kör bättre än du går, Bulten!'][r.brawlIndex%3];
        r.crowdSpeechTime=5.5;r.crowdTalk=6;r.events.push('argument');r.brawlIndex++;
      }
      r.brawlTimer=13;
    }
    for(const farmer of r.crowd)if(farmer.mood==='argue'&&farmer.moodTime<3.5) {
      farmer.mood='brawl';if(farmer.partner>farmer.id)r.events.push('scuffle');
    }
    if(r.crowdTalk<=0&&r.crowd.length) {
      const line=CROWD_DIALOGUE[r.crowdLine%CROWD_DIALOGUE.length];
      r.crowdSpeaker=line.speaker%r.crowd.length;
      r.crowdSpeech=line.text;r.crowdSpeechTime=6.5;r.crowdTalk=7;r.crowdLine++;
      r.events.push('crowd');
    }
    if(r.options.mode==='trial')return;
    r.crowdThrow-=dt;
    if(r.crowdThrow<=0&&r.crowd.length) {
      const target=r.actors[r.throwIndex%r.actors.length];
      const farmer=r.crowd.filter(p=>p.mood!=='brawl').sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y))[0]||r.crowd[0];
      const landing=pointAt(r.track,target.along+target.speed*.85,((r.throwIndex%3)-1)*9);
      r.projectiles.push({sx:farmer.x,sy:farmer.y-15,x:landing.x,y:landing.y,age:0,duration:1.3,radius:10,kind:r.track.theme==='rain'?'boot':r.track.theme==='night'?(r.throwIndex%2?'apple':'bottle'):['bottle','apple','boot'][r.throwIndex%3]});
      farmer.windup=1.3;r.throwIndex++;
      r.crowdThrow={easy:4.8,normal:3.8,hard:2.8}[r.options.difficulty]||4.8;
      r.events.push('throw');
    }
    for(const shot of r.projectiles) {
      const before=shot.age;shot.age+=dt;
      if(before<shot.duration&&shot.age>=shot.duration) {
        r.events.push(shot.kind==='bottle'?'bottle':'bump');
        for(const actor of r.actors) {
          if(actor.finishTime!==null||actor.cooldown>0||Math.hypot(actor.x-shot.x,actor.y-shot.y)>shot.radius+4)continue;
          if(actor.shield>0) {actor.shield=0;if(actor.id===0)notify(r,'shield','Skölden stoppade bondens kast!');}
          else {actor.slow=r.options.chicken==='par'&&actor.id===0?.55:1.1;if(actor.id===0){r.bumps++;notify(r,'bump','Publiken träffade! Se upp för de röda ringarna.');}}
          actor.cooldown=1.5;
        }
      }
    }
    r.projectiles=r.projectiles.filter(p=>p.age<p.duration+.45);
  }
  function makeRace(options,save) {
    options= {
      ...options
    };
    if(options.mode==='trial') {
      options.chicken='greta';
      options.difficulty='easy';
    }
    const def=TRACKS.find(t=>t.id===options.track)||TRACKS[0],track=buildTrack(def);
    const c=CHARACTERS[options.chicken]||CHARACTERS.greta,trial=options.mode==='trial',up=trial? {
      feed:0,boots:0,nest:0
    }
    : {
      ...save.upgrades
    };
    const count=trial?1:5;
    const actors=Array.from( {
      length:count
    },(_,i)=> {
      const pos=pointAt(track,-18-Math.floor(i/2)*14,(i%2?1:-1)*7);
      return {
        ...pos,id:i,name:i?['','Agda','Berta','Cilla','Doris'][i]:c.short,color:i?['','rust','sage','lilac','brown'][i]:c.color,vx:0,vy:0,speed:0,along:track.length-18-Math.floor(i/2)*14,lastAlong:track.length-18-Math.floor(i/2)*14,travel:0,startDistance:18+Math.floor(i/2)*14,progress:0,checkpoint:0,lap:0,lapStart:0,laps:[],finishTime:null,slow:0,boost:0,shield:0,item:!i&&options.chicken==='agnes'&&!trial?'boost':null,cooldown:0,stamina:c.stamina+up.nest*.4,aiLane:(i%2?1:-1)*(5+i),aiSpeed:( {
          easy:62,normal:77,hard:87
        }
        [options.difficulty]||56)*(1-i*.009)
      };
    });
    return {
      track,options: {
        ...options
      },character:c,up,actors,time:0,countdown:3,phase:'countdown',countBeat:4,events:[],corn:0,usedItems:0,bumps:0,particles:[],feedback:'Följ pilarna. Tre varv till mål!',feedbackTime:3,lastLap:false,settled:false,result:null,
      ghost:trial?(save.ghosts?.[track.id]||null):null,
      trace:trial?[[0,actors[0].x,actors[0].y,actors[0].angle]]:[],traceNext:.2,
      pickups:Array.from( {
        length:4
      },(_,i)=>( {
        ...pointAt(track,track.length*(i+.35)/4, i%2?7:-7),kind:['boost','shield','mud','boost'][i],collectedLap:-1
      })),
      cornPoints:Array.from( {
        length:18
      },(_,i)=>( {
        ...pointAt(track,track.length*(i+.5)/18,(i%3-1)*7),collectedLap:-1
      })),
      obstacles:def.obstacles.map((f,i)=>( {
        ...pointAt(track,track.length*f,(i%2?1:-1)*(def.width-7)),kind:def.theme==='rain'?'mud':i%2?'mud':'hay',radius:def.theme==='rain'?9:6
      })),
      crowd:makeCrowd(track),crowdLine:(save.races*7+TRACKS.indexOf(def)*4)%CROWD_DIALOGUE.length,crowdTalk:.1,brawlTimer:9,brawlIndex:0,crowdSpeech:'',crowdSpeechTime:0,crowdSpeaker:0,crowdThrow:2.5,throwIndex:0,projectiles:[],
      puddles:[],maxStamina:c.stamina+up.nest*.4,footTimer:0
    };
  }
  function notify(r,type,text) {
    r.events.push(type);
    if(text) {
      r.feedback=text;
      r.feedbackTime=2.3;
    }
  }
  function useItem(r) {
    const p=r.actors[0];
    if(!p.item||r.phase!=='racing')return false;
    const type=p.item;
    p.item=null;
    r.usedItems++;
    if(type==='boost') {
      p.boost=2;
      notify(r,'boost','Fartägg! Full fart framåt.');
    }
    if(type==='shield') {
      p.shield=8;
      notify(r,'shield','Äggsköld! Skydd i åtta sekunder.');
    }
    if(type==='mud') {
      const target=r.actors.slice(1).filter(a=>a.finishTime===null&&Math.hypot(a.x-p.x,a.y-p.y)<90).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
      if(target)target.slow=2;
      else r.puddles.push( {
        ...pointAt(r.track,p.along-14),life:8,radius:9,kind:'mud'
      });
      notify(r,'mud',target?`${target.name} fick lera i fjädrarna!`:'Lerbomb lagd bakom dig.');
    }
    return true;
  }
  function updateProgress(r,a,projection,dt) {
    let delta=projection.along-a.lastAlong;
    if(delta>r.track.length/2)delta-=r.track.length;
    if(delta<-r.track.length/2)delta+=r.track.length;
    if(a.id===0) {
      a.wrongWay=delta<-.02?(a.wrongWay||0)+dt:Math.max(0,(a.wrongWay||0)-dt*2);
      a.directionWarning=Math.max(0,(a.directionWarning||0)-dt);
      if(a.wrongWay>1&&a.directionWarning===0) {
        notify(r,'wrongway','Fel håll! Vänd och följ de vita pilarna.');
        a.directionWarning=4;
      }
    }
    // Crossing the start line alone never grants a lap. Four ordered sectors are required.
    if(Math.abs(delta)<Math.max(12,150*dt))a.travel+=delta;
    a.lastAlong=projection.along;
    a.along=projection.along;
    a.progress=Math.max(0,a.travel-a.startDistance);
    if(a.progress>=(a.checkpoint+1)*r.track.length/4) a.checkpoint++;
    if(a.checkpoint>=(a.lap+1)*4&&a.progress>=(a.lap+1)*r.track.length) {
      a.lap++;
      a.laps.push(r.time-a.lapStart);
      a.lapStart=r.time;
      if(a.id===0) {
        notify(r,'lap',a.lap===2?'Sista varvet! Ge allt du har.':`Varv ${a.lap}: ${formatTime(a.laps.at(-1))}`);
      }
      if(a.lap>=3) {
        a.finishTime=r.time;
        if(a.id===0) {
          r.phase='finished';
          r.result=finishResult(r);
          notify(r,'finish','I mål!');
        }
      }
    }
  }
  function tick(r,input,dt) {
    if(!['countdown','racing'].includes(r.phase))return;
    r.events=[];
    if(r.countdown>0) {
      const beat=Math.ceil(r.countdown);
      if(beat!==r.countBeat) {
        r.countBeat=beat;
        notify(r,'count');
      }
      r.countdown=Math.max(0,r.countdown-dt);
      if(r.countdown===0) {
        r.phase='racing';
        notify(r,'go','KÖR!');
      }
      return;
    }
    r.time+=dt;
    r.feedbackTime=Math.max(0,r.feedbackTime-dt);
    if(input.item)useItem(r);
    r.puddles.forEach(p=>p.life-=dt);
    r.puddles=r.puddles.filter(p=>p.life>0);
    for(const a of r.actors) {
      if(a.finishTime!==null)continue;
      const isPlayer=a.id===0,road=project(r.track,a.x,a.y);
      a.slow=Math.max(0,a.slow-dt);
      a.boost=Math.max(0,a.boost-dt);
      a.shield=Math.max(0,a.shield-dt);
      a.cooldown=Math.max(0,a.cooldown-dt);
      let dx=0,dy=0,base=isPlayer?r.character.speed*(1+r.up.feed*.03):a.aiSpeed;
      if(isPlayer) {
        dx=input.x||0;
        dy=input.y||0;
      }
      else {
        const target=pointAt(r.track,a.along+18,a.aiLane*Math.sin(a.along/110+a.id));
        dx=target.x-a.x;
        dy=target.y-a.y;
        // Telegraph an occasional AI dash; no teleporting or rubber-band speed boosts.
        if(Math.floor(r.time*10+a.id*31)%173===0&&a.boost===0&&r.options.difficulty!=='easy')a.boost=.65;
      }
      const len=Math.hypot(dx,dy);
      if(len>0) {
        dx/=len;
        dy/=len;
      }
      const sprint=isPlayer&&input.sprint&&a.stamina>0&&len>0&&a.boost===0&&a.slow===0;
      a.sprinting=sprint;
      if(isPlayer) {
        const recovering=!input.sprint||len===0||a.boost>0||a.slow>0;
        a.stamina=clamp(a.stamina+dt*(sprint?-1:recovering?.5+r.up.nest*.07:0),0,r.maxStamina);
        if(a.stamina===0&&!a.exhausted)notify(r,'tired','Spurten är slut. Släpp spurtknappen för att vila.');
        a.exhausted=a.stamina===0;
      }
      const offroad=road.distance>roadWidth(r.track,road.along)-2;
      const factor=a.slow>0?.48:a.boost>0?1.5:sprint?1.32:1;
      const desired=base*factor*(offroad?(isPlayer?.53+r.up.boots*.065:.6):1)*(len>0?1:0);
      const grip=isPlayer?r.character.grip+r.up.boots*1.8:8,blend=1-Math.exp(-grip*dt);
      a.vx+=(dx*desired-a.vx)*blend;
      a.vy+=(dy*desired-a.vy)*blend;
      a.x=clamp(a.x+a.vx*dt,10,470);
      a.y=clamp(a.y+a.vy*dt,12,288);
      a.speed=Math.hypot(a.vx,a.vy);
      if(a.speed>3)a.angle=Math.atan2(a.vy,a.vx);
      // Soft shoulder, then a firm boundary. No shortcuts through the infield.
      const after=project(r.track,a.x,a.y);
      const localWidth=roadWidth(r.track,after.along),shoulder=localWidth+(localWidth<r.track.width?1:8);
      if(after.distance>shoulder) {
        const k=shoulder/after.distance;
        a.x=after.x+(a.x-after.x)*k;
        a.y=after.y+(a.y-after.y)*k;
      }
      for(const o of [...r.obstacles,...r.puddles]) if(Math.hypot(a.x-o.x,a.y-o.y)<o.radius+4&&a.cooldown===0) {
        if(a.shield>0) {
          a.shield=0;
          if(isPlayer)notify(r,'shield','Skölden tog smällen!');
        }
        else {
          a.slow=(isPlayer&&r.options.chicken==='par')?.45:.9;
          if(isPlayer) {
            r.bumps++;
            notify(r,'bump',o.kind==='hay'?'Höbal! Ta en lite vidare kurva.':'Lera! Håll dig på den ljusa stigen.');
          }
        }
        a.cooldown=1.4;
      }
      if(isPlayer) {
        // One harvest per lap: parking on a pickup cannot farm infinite rewards.
        for(const c of r.cornPoints)if(c.collectedLap<a.lap&&Math.hypot(a.x-c.x,a.y-c.y)<8) {
          c.collectedLap=a.lap;
          r.corn++;
          r.events.push('coin');
        }
        if(r.options.mode!=='trial')for(const p of r.pickups)if(!a.item&&p.collectedLap<a.lap&&Math.hypot(a.x-p.x,a.y-p.y)<10) {
          a.item=p.kind;
          p.collectedLap=a.lap;
          notify(r,'pickup','Föremål redo! Tryck Space.');
        }
        r.footTimer-=dt;
        if(a.speed>15&&r.footTimer<=0) {
          r.footTimer=sprint?.12:.19;
          r.events.push(offroad?'grass':'step');
        }
        if(a.speed>20&&Math.random()<dt*15)r.particles.push( {
          x:a.x,y:a.y+3,vx:-a.vx*.05,vy:6,life:.35,max:.35,color:offroad?'#8fae62':'#edce8d'
        });
      }
      updateProgress(r,a,project(r.track,a.x,a.y),dt);
    }
    if(r.phase==='racing')updateCrowd(r,dt);
    if(r.options.mode==='trial'&&r.trace.length<2399&&(r.time>=r.traceNext||r.phase==='finished')) {
      const p=r.actors[0];
      r.trace.push([Math.round(r.time*1000)/1000,Math.round(p.x*10)/10,Math.round(p.y*10)/10,Math.round(p.angle*1000)/1000]);
      r.traceNext=r.time+.2;
    }
    r.particles.forEach(p=> {
      p.x+=p.vx*dt;
      p.y+=p.vy*dt;
      p.life-=dt;
    });
    r.particles=r.particles.filter(p=>p.life>0).slice(-60);
  }
  function ranking(r) {
    return r.actors.slice().sort((a,b)=>a.finishTime!==null&&b.finishTime!==null?a.finishTime-b.finishTime:a.finishTime!==null?-1:b.finishTime!==null?1:b.progress-a.progress);
  }
  function finishResult(r) {
    const p=r.actors[0],position=ranking(r).findIndex(a=>a.id===0)+1;
    return {
      position,time:r.time,bestLap:Math.min(...p.laps),corn:r.corn,items:r.usedItems,clean:r.bumps===0,coins:r.options.mode==='trial'?0:([0,45,34,27,21,18][position]+r.corn*2+(r.bumps===0?10:0)+( {
        easy:0,normal:8,hard:16
      }
      [r.options.difficulty]||0)),medal:position<=3?4-position:0
    };
  }
  function settleRace(save,r) {
    if(r.settled||r.phase!=='finished')return null;
    r.settled=true;
    const result=r.result,trial=r.options.mode==='trial',key=`${r.track.id}:${r.options.mode}:${r.options.difficulty}`;
    result.newRecord=!save.records[key]||result.time<save.records[key].time;
    if(result.newRecord)save.records[key]= {
      time:result.time,lap:result.bestLap
    };
    if(trial&&result.newRecord) {
      // Long or truncated recordings are omitted instead of showing a misleading ghost.
      if(r.trace.length>1&&Math.abs(r.trace.at(-1)[0]-r.time)<.01)save.ghosts[r.track.id]=r.trace.map(sample=>sample.slice());
      else delete save.ghosts[r.track.id];
    }
    if(!trial) {
      save.coins+=result.coins;
      save.xp+=25+(result.position===1?20:0)+r.corn;
      save.races++;
      save.wins+=result.position===1?1:0;
      save.corn+=r.corn;
      save.items+=r.usedItems;
      const medalKey=`${r.track.id}:${r.options.difficulty}`;
      save.medals[medalKey]=Math.max(save.medals[medalKey]||0,result.medal);
    }
    return result;
  }
  function formatTime(n) {
    if(!Number.isFinite(n))return '—';
    return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}.${Math.floor(n%1*10)}`;
  }
  function ghostAt(r,time) {
    if(!r.ghost||time<0||time>r.ghost.at(-1)[0])return null;
    const next=r.ghost.findIndex(sample=>sample[0]>=time);
    const a=r.ghost[Math.max(0,next-1)],b=r.ghost[Math.max(0,next)],span=b[0]-a[0];
    const f=span>0?clamp((time-a[0])/span,0,1):0;
    return {x:a[1]+(b[1]-a[1])*f,y:a[2]+(b[2]-a[2])*f,angle:b[3]};
  }
  const api= {
    roadWidth,CROWD_DIALOGUE,makeCrowd,CHARACTERS,TRACKS,UPGRADES,CONTRACTS,clamp,freshSave,sanitizeSave,buyUpgrade,claimContract,buildTrack,pointAt,project,rectangleClear,makeRace,tick,ranking,useItem,settleRace,finishResult,formatTime,ghostAt
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FarmRace=api;
})(typeof window!=='undefined'?window:globalThis);
