/* Pure simulation and saved progression. No DOM or audio dependency. */
(function (root) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const CHARACTERS = {
    greta: {
      name:'Svets-Greta, Byvägens sista hopp',short:'Svets-Greta',tag:'Fiber i ladan. Koppartråd i brillorna.',speed:72,grip:8,stamina:2.2,color:'cream',perk:'Balanserad fart och kontroll'
    },
    ragna: {
      name:'Raketragge – gasol på avbetalning',short:'Raketragge',tag:'Dubbla gasoltuber. Ingen besiktning.',speed:76,grip:5.5,stamina:1.7,color:'rust',perk:'Högst toppfart, längre svängar'
    },
    par: {
      name:'Plåt-Pär, kommunens sista 240',short:'Plåt-Pär',tag:'Volvodörr på bröstet. Känslor på insidan.',speed:69,grip:10,stamina:2.5,color:'sage',perk:'Halverad tid för hinderpåverkan'
    },
    agnes: {
      name:'Agnes Ägg.exe från kopparskjulet',short:'Ägg.exe',tag:'Hackar äggautomaten bakom bygdegården.',speed:71,grip:8,stamina:2.2,color:'lilac',perk:'Startar med Motorsprit i äggkopp'
    }
  };
  const TRACKS = [
  {
    id:'market',name:'Björketorps konkursmarknad',short:'Konkursmarknaden',subtitle:'Där varje höna börjar',description:'En generös första bana runt gården. Breda kurvor och gott om plats för omkörning.',unlock:0,theme:'spring',width:22,par:53,points:[[108,232],[55,188],[54,91],[112,53],[280,50],[410,79],[430,177],[371,238],[230,247]],obstacles:[.22,.65],music:'market'
  },
  {
    id:'meadow',name:'Kladdis kommunala lerhelvete',short:'Kommunala lerhelvetet',subtitle:'Regn, traktorer och en rejäl hårnål',description:'Långa åkerrakor och en dubbel återvändare. Spurta på torr mark, välj insidan runt leran.',unlock:2,theme:'rain',width:17,par:65,points:[[100,260],[50,210],[50,60],[110,35],[390,35],[435,70],[395,105],[180,105],[135,145],[185,205],[395,205],[435,245],[390,275],[230,275]],obstacles:[.15,.35,.55,.73,.88],music:'meadow'
  },
  {
    id:'orchard',name:'Callheims sista dans före utmätning',short:'Dans före utmätning',subtitle:'Lyktor, träbro och fest i logen',description:'En slingrig nattbana med S-kurvor, smal träbro och bred omkörning genom festlogen.',unlock:5,theme:'night',width:19,par:62,points:[[98,247],[48,198],[56,116],[106,58],[177,54],[214,109],[272,109],[309,52],[391,60],[428,116],[397,167],[329,180],[316,234],[241,254],[178,215]],obstacles:[.18,.42,.83],music:'orchard',bridge:[.55,.62],hall:.88
  }
  ];
  const COMBAT_TRACK={id:'scrapyard',name:'Svågerns skrotkrig',short:'Skrotkriget',subtitle:'Stridsprototyp · mus & tangentbord',unlock:0,theme:'spring',music:'market',worldWidth:960,worldHeight:600,width:39,par:100,combat:true,
    points:[[190,485],[92,410],[92,220],[150,100],[390,100],[620,105],[850,150],[866,300],[795,470],[610,492],[465,430],[345,490]],obstacles:[]};
  const COMBAT_TRACKS=[COMBAT_TRACK,
    {...COMBAT_TRACK,id:'peat',name:'Kommunens sista torvtäkt',short:'Torvträsket',theme:'rain',music:'meadow',width:34,
      points:[[180,490],[85,400],[100,140],[260,85],[400,175],[570,85],[835,125],[875,340],[710,490],[540,405],[350,490]],obstacles:[]},
    {...COMBAT_TRACK,id:'airstrip',name:'Flygrakan utan bygglov',short:'Flygrakan',theme:'night',music:'orchard',width:44,
      points:[[160,490],[80,390],[80,150],[180,95],[770,95],[880,190],[880,405],[760,490],[470,490]],obstacles:[]}
  ];
  const RIVALS=[
    {name:'Besiktnings-Börje',speed:.98,lane:.5,quip:'Den där är fan inte original.'},
    {name:'Pant-Pirjo',speed:1.01,lane:1.2,quip:'Flytta på dig. Panten stänger fem.'},
    {name:'Bygdekungen Ronny',speed:1.035,lane:.8,quip:'Jag äger den här grusvägen!'},
    {name:'Släpvagns-Siv',speed:.99,lane:1.4,quip:'Bromsar säljs separat, för helvete.'}
  ];
  const BUILDS={
    stock:{name:'Besiktigad av morsan',description:'Standardbygge. Inga extra nackdelar.',speed:1,grip:1,stamina:0,recovery:1,armor:1,unlock:0},
    chip:{name:'Svågerns fulchip',description:'+8 % fart, −25 % styrgrepp. Inga kvitton.',speed:1.08,grip:.75,stamina:0,recovery:1,armor:1,unlock:0},
    armor:{name:'Hemsvetsat kommunalpansar',description:'Halverad hinderpåverkan, −6 % fart.',speed:.94,grip:1,stamina:0,recovery:1,armor:.5,unlock:2},
    gas:{name:'Gasol från dödsbo',description:'+1,5 s spurt, 35 % långsammare återhämtning.',speed:1,grip:1,stamina:1.5,recovery:.65,armor:1,unlock:5}
  };
  const CROWD_DIALOGUE = [
  {speaker:0,target:1,text:'Kommunen drog in bussen. Vi kör hönor nu.'},
  {speaker:1,target:0,text:'Min pension sitter i en gasoltub på den där fågeln.'},
  {speaker:2,target:3,text:'Det är inte fylla. Det är flytande krisberedskap.'},
  {speaker:3,target:2,text:'Bygdegården har konkurs. Baren tar fortfarande pant.'},
  {speaker:4,target:0,text:'EU-bidrag till rakethöns! Äntligen landsbygdspolitik.'},
  {speaker:0,target:4,text:'Vem kopplade hembrännaren till kommunens laddstolpe?!'},
  {speaker:1,target:2,text:'Kladdis lovade bredband. Vi fick en bred dunk.'},
  {speaker:2,target:1,text:'Här finns framtidstro. Den står bakom pannan.'},
  {speaker:0,target:1,text:'Fiber till ladan. Fortfarande ingen täckning på dass.'},
  {speaker:1,target:0,text:'Kladdis kör på Nutella. Raketen går på ren envishet.'},
  {speaker:2,target:3,text:'Neon under traktorn! Nu är vi fan en storstad.'},
  {speaker:3,target:2,text:'Storstad? Bussen går ju fortfarande på torsdag.'},
  {speaker:4,target:0,text:'Den där hönan är chippad av min svåger. Inga kvitton.'},
  {speaker:0,target:4,text:'Björketorp 2077. Samma potthål, dyrare reservdelar.'},
  {speaker:1,target:2,text:'Rör inte min laddkabel! Den håller uppe lagårn!'},
  {speaker:2,target:1,text:'Kladdis hackade mjölkroboten. Nu gör den Irish coffee.'},
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
  const KLADDIS_STORIES=[
    ['Kladdis åt Nutella med högaffel.','Skeden höll väl inte besiktningen.'],
    ['Minns du Emils rekord? 0:42!','Resten tävlar om andraplatsen.'],
    ['Kladdis kraschade sin Delicato 999RR!','Nu kör han 49. Färre siffror att laga.'],
    ['Emil fastnade i en portergryta.','Med foten! Han skulle bara provsmaka.'],
    ['Kladdis lovade oss bredband.','Vi fick en bred dunk. Igen.'],
    ['Emil tappade bort Inga Tåjärn.','Kolla bakom Nutellaburkarna!'],
    ['Kladdis tog bort hönans bumpstopp.','Mer spänning. Mindre garanti.'],
    ['Emil kör snabbare än vinden!','Ändå hinner fogden alltid fram.'],
    ['Kladdis hackade mjölkroboten.','Nu serverar fanskapet Irish coffee.'],
    ['Jäger eller Nutella till Emil?','Ställ fram båda. Göm högaffeln.']
  ];
  const CATALOG={
    beard:{name:'Lösskägg från kommunförrådet',slot:'outfit',cost:180,description:'Ett rejält grått skägg. Gäller hela stallet.'},
    vest:{name:'Varselväst för svartjobb',slot:'outfit',cost:450,description:'Självlysande gul med reflexband.'},
    flame:{name:'Svetsmask med eld i lacken',slot:'outfit',cost:900,description:'Svart mask, orange flammor. Kräver 5 segrar över Börje.',rival:5},
    neon:{name:'Neon från kommunens rave',slot:'outfit',cost:1800,description:'Rosa och turkost underglow. Kräver en cuptitel.',titles:1},
    caravan:{name:'Husvagn utan framtid',slot:'decor',cost:350,description:'En extra husvagn på gårdens vänstra tomt.'},
    volvo:{name:'Avställd 740 på livstid',slot:'decor',cost:750,description:'En skrotbil på tomten. Ingen skatt, inget hopp.'},
    shed:{name:'Svågerns dunkpalats',slot:'decor',cost:1400,description:'Ett eget brädskjul på tomten.'},
    statue:{name:'Björketorps fulaste staty',slot:'decor',cost:3000,description:'En förgylld jättehöna. Kräver två cuptitlar.',titles:2},
    sign49:{name:'49 – bygdens elräkning',slot:'decor',cost:5000,description:'En stor neonskylt på tomten. Kräver tre cuptitlar.',titles:3}
  };
  function catalogUnlocked(save,key) {
    const item=CATALOG[key];return !!item&&(save.cup.titles>=(item.titles||0))&&(save.rivalWins[0]>=(item.rival||0));
  }
  function buyCosmetic(save,key) {
    const item=CATALOG[key];
    if(!item||save.owned.includes(key)||!catalogUnlocked(save,key)||save.coins<item.cost)return false;
    save.coins-=item.cost;save.owned.push(key);save[item.slot]=key;return true;
  }
  function equipCosmetic(save,slot,key) {
    if(!['outfit','decor'].includes(slot)||key!==null&&(!save.owned.includes(key)||CATALOG[key]?.slot!==slot))return false;
    save[slot]=key;return true;
  }
  const UPGRADES = {
    feed: {
      name:'Dieselmüsli 98',description:'Frukost ur reservdunken. +3 % toppfart per nivå',tiers:['Lantmännens restlager','Reservdunk Special','Röddiesel à la svåger'],cost:[90,220,450],max:3
    },
    boots: {
      name:'Kronofogdens flyktstövlar',description:'Fogden får ta bussen. Kvickare svängar och bättre grepp på gräs',tiers:['Tejpade gummistövlar','Servon från skrot-Volvon','Utmätningsturbo 3000'],cost:[75,180,360],max:3
    },
    nest: {
      name:'Bakfyllebo med starthjälp',description:'Sov bakom pannan. +0,4 s spurt per nivå och snabbare återhämtning',tiers:['Madrass från grovsopen','Värmefilt på tjuvström','Kommunal återställarstation'],cost:[85,200,400],max:3
    }
  };
  const CONTRACTS = [
  {
    id:'races',name:'Arbetslinjen runt lagårn',description:'Kör klart 3 lopp',target:3,reward:45
  },
  {
    id:'corn',name:'Pantjakten före löning',description:'Samla 24 majskorn',target:24,reward:55
  },
  {
    id:'items',name:'Svågerns tveksamma sidoinkomst',description:'Använd 6 föremål',target:6,reward:50
  },
  {
    id:'wins',name:'Bygdens minst misslyckade',description:'Vinn 2 lopp',target:2,reward:75
  }
  ];
  function freshSave() {
    return {
      weaponUpgrades:{},combatMastery:{},combatFinishes:0,owned:[],outfit:null,decor:null,build:'stock',cup:{stage:0,titles:0},rivalWins:[0,0,0,0],version:2,courseRevision:2,coins:0,xp:0,races:0,wins:0,corn:0,items:0,upgrades: {
        feed:0,boots:0,nest:0
      },medals: {
      },records: {
      },ghosts: {
      },contracts: {
      },settings: {
        music:.45,sfx:.65,ambience:.35,mute:false
      },selected: {
        weapon:'shotgun',combatTrack:'scrapyard',track:'market',chicken:'greta',difficulty:'easy',mode:'race'
      },skin:'classic'
    };
  }
  function sanitizeSave(raw) {
    const s = freshSave();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;
    const integer = (n, max=999999) => Number.isFinite(n) ? clamp(Math.floor(n),0,max) : 0;
    for (const key of ['coins','xp','races','wins','corn','items']) s[key]=integer(raw[key]);
    s.combatFinishes=integer(raw.combatFinishes);
    for(const weapon of Object.keys(WEAPONS))s.weaponUpgrades[weapon]={reload:integer(raw.weaponUpgrades?.[weapon]?.reload,3),recoil:integer(raw.weaponUpgrades?.[weapon]?.recoil,3)};
    if(WEAPONS[raw.selected?.weapon])s.selected.weapon=raw.selected.weapon;
    if(COMBAT_TRACKS.some(t=>t.id===raw.selected?.combatTrack))s.selected.combatTrack=raw.selected.combatTrack;
    for(const weapon of ['shotgun','pistol','rifle','potato'])s.combatMastery[weapon]=integer(raw.combatMastery?.[weapon],9999);
    s.cup={stage:integer(raw.cup?.stage,2),titles:integer(raw.cup?.titles,9999)};
    s.rivalWins=RIVALS.map((_,i)=>integer(raw.rivalWins?.[i]));
    if(BUILDS[raw.build]&&BUILDS[raw.build].unlock<=s.races)s.build=raw.build;
    s.owned=Object.keys(CATALOG).filter(key=>Array.isArray(raw.owned)&&raw.owned.includes(key));
    for(const slot of ['outfit','decor'])if(s.owned.includes(raw[slot])&&CATALOG[raw[slot]].slot===slot)s[slot]=raw[slot];
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
    if(['race','trial','combat'].includes(raw.selected?.mode)) s.selected.mode=raw.selected.mode;
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
    if(r.crowdTalk<=0&&r.crowdSpeechTime<=0&&r.crowd.length) {
      const turn=r.crowdLine%5;
      if(turn<4) {
        const story=KLADDIS_STORIES[r.storyIndex%KLADDIS_STORIES.length];
        if(turn%2===0)r.storySpeaker=(r.storyIndex*2)%r.crowd.length;
        const host=r.crowd[r.storySpeaker];
        r.crowdSpeaker=turn%2===0?r.storySpeaker:(r.crowd[host.partner]?host.partner:(r.storySpeaker+1)%r.crowd.length);
        r.crowdSpeech=story[turn%2];
        if(turn%2===1)r.storyIndex++;
      } else {
        r.crowdSpeaker=r.crowdLine%r.crowd.length;
        r.crowdSpeech=['VEM FAN HAR MIN DUNK?','DIN VOLVO LÄCKER IGEN!','HÅLL KÄFT OCH HÅLL MIN ÖL!'][Math.floor(r.crowdLine/5)%3];
      }
      r.crowdLine++;r.crowdSpeechTime=6;r.crowdTalk=6.25;
    }
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
        if(r.crowdSpeechTime<=0) {
        r.crowdSpeaker=host.id;
        r.crowdSpeech=['VEM FAN TOG MIN FLASKA?!','GE FAN I MIN VOLVO!','DIN JÄVLA PANTTJUV!'][r.brawlIndex%3];
        r.crowdSpeechTime=5.5;r.crowdTalk=7;
        }
        r.events.push('argument');r.brawlIndex++;
      }
      r.brawlTimer=8;
    }
    for(const farmer of r.crowd)if(farmer.mood==='argue'&&farmer.moodTime<3.5) {
      farmer.mood='brawl';if(farmer.partner>farmer.id)r.events.push('scuffle');
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
        if(shot.kind==='bottle')r.puddles.push({x:shot.x,y:shot.y,kind:'glass',radius:7,life:4});
        for(const actor of r.actors) {
          if(actor.finishTime!==null||actor.cooldown>0||Math.hypot(actor.x-shot.x,actor.y-shot.y)>shot.radius+4)continue;
          if(actor.shield>0) {actor.shield=0;if(actor.id===0)notify(r,'shield','Skölden stoppade bondens kast!');}
          else {actor.slow=actor.id===0?(r.options.chicken==='par'?.55:1.1)*r.build.armor:1.1;if(actor.id===0){r.bumps++;notify(r,'bump','Publiken träffade! Se upp för de röda ringarna.');}}
          actor.cooldown=1.5;
        }
      }
    }
    r.projectiles=r.projectiles.filter(p=>p.age<p.duration+.45);
  }
  function updateCross(r,dt) {
    const bike=r.cross,phase=r.time%18;
    const next=phase<9?'ride':phase<11?'warning':phase<14?'burn':'ride';
    if(next!==bike.state&&next==='warning')r.events.push('cross');
    bike.state=next;
    if(next==='ride')bike.along+=dt*112;
    const excursion=Math.sin(Math.PI*clamp((phase-1)/7,0,1));
    const lane=next==='ride'?Math.sin(bike.along/105)*(8+excursion*48):bike.lane;
    bike.lane=lane;
    Object.assign(bike,pointAt(r.track,bike.along,lane));
    bike.x=clamp(bike.x,18,(r.track.worldWidth||480)-18);bike.y=clamp(bike.y,28,(r.track.worldHeight||300)-18);
    bike.heckleCooldown=Math.max(0,(bike.heckleCooldown||0)-dt);
    const angry=r.crowd.find(p=>Math.hypot(p.x-bike.x,p.y-bike.y)<48);
    if(angry&&bike.heckleCooldown===0) {
      angry.mood='argue';angry.moodTime=3;angry.windup=1;
      if(r.crowdSpeechTime<=0){r.crowdSpeaker=angry.id;r.crowdSpeech=['49! GE FAN I MIN TOMT!','MINA POTATISAR, DIN JÄVEL!','KÖR PÅ VÄGEN FÖR FAN!'][bike.splashes%3];r.crowdSpeechTime=5.5;r.crowdTalk=7;}
      bike.heckleCooldown=6;r.events.push('argument');
    }
    bike.spray-=dt;
    if(next==='burn'&&bike.spray<=0) {
      bike.spray=.24;
      if(r.options.mode!=='trial') {
        const splash=pointAt(r.track,bike.along-10-(bike.splashes%3)*4,bike.lane);
        r.puddles.push({...splash,kind:'mud',radius:5,life:2.2});
      }
      bike.splashes++;
    }
  }
  function updateTractor(r,dt) {
    const t=r.tractor;if(r.options.mode==='trial')return;
    // A rigid drawbar pulls a persistent trailer axle; it has no path/lane of its own.
    if(!t.trailer)t.trailer={x:t.x-Math.cos(t.angle)*32,y:t.y-Math.sin(t.angle)*32,angle:t.angle,radius:7,kind:'tractor'};
    const lane=along=>Math.max(3,roadWidth(r.track,along)-9);
    const steps=Math.max(1,Math.ceil(dt*120));
    for(let step=0;step<steps;step++) {
      t.along+=dt/steps*23;
      Object.assign(t,pointAt(r.track,t.along,lane(t.along)));
      t.hitch={x:t.x-Math.cos(t.angle)*10,y:t.y-Math.sin(t.angle)*10};
      const tr=t.trailer,dx=t.hitch.x-tr.x,dy=t.hitch.y-tr.y;
      if(Math.hypot(dx,dy)>.001)tr.angle=Math.atan2(dy,dx);
      tr.x=t.hitch.x-Math.cos(tr.angle)*22;
      tr.y=t.hitch.y-Math.sin(tr.angle)*22;
    }
    const f=((t.along%r.track.length)+r.track.length)%r.track.length/r.track.length;
    const zone=[.18,.72].find(start=>f>=start-.04&&f<start+.065);
    t.state=zone===undefined?'drive':f<zone?'warning':'spread';
    t.cooldown=Math.max(0,t.cooldown-dt);
    if(t.state==='spread'&&t.cooldown===0&&roadWidth(r.track,t.along-38)>=17) {
      const tr=t.trailer,spot={x:tr.x-Math.cos(tr.angle)*15,y:tr.y-Math.sin(tr.angle)*15};
      r.puddles.push({...spot,kind:'manure',radius:7,life:6});t.cooldown=.8;
    }
  }
  const WEAPONS={
    shotgun:{name:'Hagelbrakaren',ammo:2,reload:2.3,cooldown:.7,pellets:5,spread:.075,speed:270,life:.48,recoil:48,push:.30,slow:.65,mass:.97},
    pistol:{name:'Pantpistolen',ammo:6,reload:1.65,cooldown:.28,pellets:1,spread:0,speed:340,life:.55,recoil:17,push:.08,slow:.12,mass:1.03},
    rifle:{name:'Älgstudsaren på krita',ammo:3,reload:2.8,cooldown:1.15,pellets:1,spread:0,speed:430,life:.7,recoil:65,push:.24,slow:.9,mass:.94}
,
    potato:{name:'Potatiskanon deluxe',ammo:1,reload:3.3,cooldown:1.4,pellets:1,spread:0,speed:155,life:1.35,recoil:80,push:.3,slow:1.2,mass:.90}
  };
  const WEAPON_UPGRADES={
    reload:{name:'Hemkört i slutstycket',description:'5 % kortare omladdning per nivå.',cost:[120,300,650]},
    recoil:{name:'Svågerns axelprotes',description:'12 % mindre egen rekyl per nivå.',cost:[100,260,580]}
  };
  function buyWeaponUpgrade(save,weapon,type){
    if(!WEAPONS[weapon]||!WEAPON_UPGRADES[type])return false;
    const level=save.weaponUpgrades?.[weapon]?.[type]||0,cost=WEAPON_UPGRADES[type].cost[level];
    if(level>=3||!Number.isFinite(save.coins)||save.coins<cost)return false;
    save.weaponUpgrades=save.weaponUpgrades||{};
    save.weaponUpgrades[weapon]=save.weaponUpgrades[weapon]||{reload:0,recoil:0};
    save.coins-=cost;save.weaponUpgrades[weapon][type]=level+1;return true;
  }
  function startReload(r,a) {
    a.gun.reload=WEAPONS[a.gun.weapon].reload*(1-(a.gun.mastery||0)*.06-(a.gun.tuning?.reload||0)*.05);
    if(a.id===0)r.events.push({name:'reload-start',weapon:a.gun.weapon});
  }
  function fireShot(r,a) {
    const gun=a.gun,w=WEAPONS[gun.weapon];
    if(gun.cooldown>0||gun.reload>0||gun.ammo<=0||a.finishTime!==null)return false;
    gun.ammo--;gun.cooldown=w.cooldown;gun.flash=.12;
    if(!gun.ammo)startReload(r,a);
    const dx=Math.cos(gun.aim),dy=Math.sin(gun.aim);
    const recoil=w.recoil*(1-(gun.tuning?.recoil||0)*.12);a.hitPushX-=dx*recoil;a.hitPushY-=dy*recoil;
    for(let i=0;i<w.pellets;i++){
      const angle=gun.aim+(i-(w.pellets-1)/2)*w.spread;
      r.bullets.push({x:a.x+dx*12,y:a.y+dy*12,vx:Math.cos(angle)*w.speed,vy:Math.sin(angle)*w.speed,life:w.life,push:w.push,weapon:gun.weapon,owner:a.id});
    }
    const player=r.actors[0],distance=Math.hypot(a.x-player.x,a.y-player.y);
    if(distance<240)r.events.push({name:gun.weapon,volume:a.id===0?1:Math.max(.1,.55*(1-distance/240)),pan:clamp((a.x-player.x)/180,-1,1)});
    return true;
  }
  function updateCombat(r,input,dt) {
    for(const a of r.actors) {
      const gun=a.gun;a.invulnerable=Math.max(0,a.invulnerable-dt);a.bumpCooldown=Math.max(0,a.bumpCooldown-dt);
      gun.cooldown=Math.max(0,gun.cooldown-dt);gun.flash=Math.max(0,gun.flash-dt);
      if(gun.reload>0){gun.reload=Math.max(0,gun.reload-dt);if(gun.reload===0){gun.ammo=WEAPONS[gun.weapon].ammo;if(a.id===0)r.events.push('reload');}}
      if(a.id===0){
        if(Number.isFinite(input.aimX)&&Number.isFinite(input.aimY))gun.aim=Math.atan2(input.aimY-a.y,input.aimX-a.x);
        if(input.reload&&gun.ammo<WEAPONS[gun.weapon].ammo&&gun.reload===0)startReload(r,a);
        if(input.fire)fireShot(r,a);
      } else {
        const target=r.actors.filter(b=>b.id!==a.id&&b.finishTime===null).sort((b,c)=>Math.hypot(b.x-a.x,b.y-a.y)-Math.hypot(c.x-a.x,c.y-a.y))[0];
        if(target){const goal=Math.atan2(target.y-a.y,target.x-a.x),delta=Math.atan2(Math.sin(goal-gun.aim),Math.cos(goal-gun.aim));gun.aim+=clamp(delta,-dt*2.5,dt*2.5);
          if(r.time>3+ a.id*.4&&Math.hypot(target.x-a.x,target.y-a.y)<115&&Math.abs(delta)<.15)fireShot(r,a);
        }
      }
      const behind=r.actors.some(b=>b!==a&&b.finishTime===null&&Math.hypot(b.x-a.x,b.y-a.y)<65&&Math.hypot(b.x-a.x,b.y-a.y)>18&&((b.x-a.x)*Math.cos(a.angle)+(b.y-a.y)*Math.sin(a.angle))>20&&Math.abs((b.x-a.x)*Math.sin(a.angle)-(b.y-a.y)*Math.cos(a.angle))<12);
      a.draft=behind?Math.min(1,a.draft+dt):Math.max(0,a.draft-dt*2);
      for(const cover of r.cover) {
        const dx=a.x-cover.x,dy=a.y-cover.y,d=Math.hypot(dx,dy),min=cover.radius+6;
        if(d<min){const angle=d>.01?Math.atan2(dy,dx):a.angle+Math.PI/2;a.x=cover.x+Math.cos(angle)*min;a.y=cover.y+Math.sin(angle)*min;a.vx*=.7;a.vy*=.7;}
      }
    }
    for(let i=0;i<r.actors.length;i++)for(let j=i+1;j<r.actors.length;j++){
      const a=r.actors[i],b=r.actors[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
      if(d<14&&a.bumpCooldown===0&&b.bumpCooldown===0){const nx=d>.01?dx/d:1,ny=d>.01?dy/d:0;a.hitPushX-=nx*24;a.hitPushY-=ny*24;b.hitPushX+=nx*24;b.hitPushY+=ny*24;a.bumpCooldown=b.bumpCooldown=.6;}
    }
    for(const bullet of r.bullets){
      bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.life-=dt;
      if(bullet.weapon==='potato'){
        const contact=r.cover.some(c=>Math.hypot(c.x-bullet.x,c.y-bullet.y)<c.radius)||r.actors.some(a=>a.id!==bullet.owner&&a.finishTime===null&&Math.hypot(a.x-bullet.x,a.y-bullet.y)<11);
        if(contact||bullet.life<=0){
          bullet.life=0;r.puddles.push({x:bullet.x,y:bullet.y,kind:'potato',radius:19,life:4});
          const player=r.actors[0];if(Math.hypot(player.x-bullet.x,player.y-bullet.y)<260)r.events.push('potato-hit');
          for(let i=0;i<16;i++){const angle=i*Math.PI/8;r.particles.push({x:bullet.x,y:bullet.y,vx:Math.cos(angle)*65,vy:Math.sin(angle)*65,life:.6,max:.6,color:'#d6bd78'});}
          for(const a of r.actors){const dx=a.x-bullet.x,dy=a.y-bullet.y,d=Math.hypot(dx,dy);if(d>38||a.invulnerable>0||a.finishTime!==null)continue;
            a.invulnerable=.85;if(a.shield>0){a.shield=0;continue;}
            // Scatter across the road, never give a hit racer a forward boost.
            const heading=pointAt(r.track,project(r.track,a.x,a.y).along).angle;
            const fx=Math.cos(heading),fy=Math.sin(heading),nx=-fy,ny=fx;
            const sideways=clamp(a.hitPushX*nx+a.hitPushY*ny+(dx*nx+dy*ny)/Math.max(1,d)*55,-55,55);
            const backwards=Math.min(0,a.hitPushX*fx+a.hitPushY*fy)-25;
            a.hitPushX=nx*sideways+fx*backwards;a.hitPushY=ny*sideways+fy*backwards;
            a.vx*=.35;a.vy*=.35;a.speed=Math.hypot(a.vx,a.vy);
            a.slow=Math.max(a.slow,1.2);a.boost=0;a.cornerBoost=0;a.driftCharge=0;
            if(a.id===0)r.bumps++;if(Math.hypot(a.x-player.x,a.y-player.y)<240)r.events.push({name:'cluck',volume:a.id===0?1:.5});
          }
        }
        continue;
      }
      if(r.cover.some(c=>Math.hypot(c.x-bullet.x,c.y-bullet.y)<c.radius)){bullet.life=0;continue;}
      for(const a of r.actors){if(a.id===bullet.owner||a.finishTime!==null||Math.hypot(a.x-bullet.x,a.y-bullet.y)>8)continue;
        bullet.life=0;if(a.invulnerable>0)break;
        a.invulnerable=.85;
        if(a.shield>0)a.shield=0;
        else {const distance=Math.hypot(a.x-r.actors[0].x,a.y-r.actors[0].y);if(distance<240)r.events.push({name:'cluck',volume:a.id===0?1:.65*(1-distance/240),pan:clamp((a.x-r.actors[0].x)/180,-1,1)});a.hitPushX+=bullet.vx*(bullet.push??.22);a.hitPushY+=bullet.vy*(bullet.push??.22);a.slow=WEAPONS[bullet.weapon||'shotgun'].slow;if(bullet.weapon==='pistol')a.stamina=Math.max(0,a.stamina-.6);else a.boost=0;if(a.id===0){r.bumps++;r.events.push('bump');}}
        for(let i=0;i<5;i++)r.particles.push({x:a.x,y:a.y-8,vx:(i-2)*20,vy:-25+i*8,life:.45,max:.45,color:'#fff0cd'});
        break;
      }
    }
    r.bullets=r.bullets.filter(b=>b.life>0).slice(-80);
  }
  function makeRace(options,save) {
    options= {
      ...options
    };
    if(options.mode==='trial') {
      options.chicken='greta';
      options.difficulty='easy';
    }
    const def=options.mode==='combat'?(COMBAT_TRACKS.find(t=>t.id===options.combatTrack)||COMBAT_TRACK):TRACKS.find(t=>t.id===options.track)||TRACKS[0],track=buildTrack(def);
    const c=CHARACTERS[options.chicken]||CHARACTERS.greta,trial=options.mode==='trial',up=trial? {
      feed:0,boots:0,nest:0
    }
    : {
      ...save.upgrades
    };
    const build=BUILDS[!trial&&BUILDS[save.build]?.unlock<=save.races?save.build:'stock'];
    const count=trial?1:5;
    const actors=Array.from( {
      length:count
    },(_,i)=> {
      const pos=pointAt(track,-18-Math.floor(i/2)*14,(i%2?1:-1)*7);
      const weapon=i?['shotgun','pistol','rifle','potato'][i-1]:(WEAPONS[options.weapon]?options.weapon:'shotgun');
      return {
        ...pos,gun:{weapon,tuning:i?{}:{...save.weaponUpgrades?.[weapon]},mastery:i?0:Math.min(3,Math.floor((save.combatMastery?.[weapon]||0)/3)),ammo:WEAPONS[weapon].ammo,reload:0,cooldown:0,aim:pos.angle,flash:0},invulnerable:0,hitPushX:0,hitPushY:0,draft:0,bumpCooldown:0,id:i,name:i?RIVALS[i-1].name:c.short,color:i?['','rust','sage','lilac','brown'][i]:c.color,vx:0,vy:0,speed:0,along:track.length-18-Math.floor(i/2)*14,lastAlong:track.length-18-Math.floor(i/2)*14,travel:0,startDistance:18+Math.floor(i/2)*14,progress:0,checkpoint:0,lap:0,lapStart:0,laps:[],finishTime:null,slow:0,boost:0,shield:0,item:!i&&options.chicken==='agnes'&&!trial?'boost':null,cooldown:0,stamina:c.stamina+up.nest*.4+build.stamina,aiLane:(i%2?1:-1)*(5+i),aiSpeed:( {
          easy:62,normal:77,hard:87
        }
        [options.difficulty]||56)*(i?RIVALS[i-1].speed:1)
      };
    });
    return {
      track,options: {
        ...options
      },combat:!!def.combat,bullets:[],shotSerial:0,cover:def.combat?[.15,.38,.66].map(f=>({...pointAt(track,track.length*f),radius:12})):[],character:c,build,up,actors,time:0,countdown:3,phase:'countdown',countBeat:4,events:[],corn:0,usedItems:0,bumps:0,particles:[],feedback:trial?'Följ pilarna. Tre varv till mål!':`${RIVALS[save.races%4].name}: ${save.rivalWins?.[save.races%4]>0?'Nu jävlar blir det revansch!':RIVALS[save.races%4].quip}`,feedbackTime:3,lastLap:false,settled:false,result:null,
      ghost:trial?(save.ghosts?.[track.id]||null):null,
      trace:trial?[[0,actors[0].x,actors[0].y,actors[0].angle]]:[],traceNext:.2,
      pickups:Array.from( {
        length:4
      },(_,i)=>( {
        ...pointAt(track,track.length*(i+.35)/4, i%2?7:-7),kind:['boost','shield','mud','boost'][i],collectedLap:-1
      })),
      cornPoints:Array.from( {
        length:6
      },(_,i)=>( {
        ...pointAt(track,track.length*(i+.5)/6,(i%3-1)*7),collectedLap:-1
      })),
      obstacles:def.obstacles.map((f,i)=>( {
        ...pointAt(track,track.length*f,(i%2?1:-1)*(def.width-7)),kind:def.theme==='rain'?'mud':i%2?'mud':'hay',radius:def.theme==='rain'?9:6
      })),
      crowd:makeCrowd(track),crowdLine:0,storyIndex:(save.races*3+Math.max(0,TRACKS.indexOf(def))*2)%KLADDIS_STORIES.length,storySpeaker:0,crowdTalk:.1,brawlTimer:4,brawlIndex:0,crowdSpeech:'',crowdSpeechTime:0,crowdSpeaker:0,crowdThrow:2.5,throwIndex:0,projectiles:[],
      tractor:{...pointAt(track,track.length*.12,8),along:track.length*.12,radius:7,kind:'tractor',state:'drive',cooldown:0,trailer:null},
      cross:{...pointAt(track,track.length*.38,8),along:track.length*.38,lane:8,state:'ride',spray:0,splashes:0},
      puddles:[],maxStamina:c.stamina+up.nest*.4+build.stamina,footTimer:0
    };
  }
  function notify(r,type,text) {
    r.events.push(type);
    if(text) {
      if(r.feedbackTime>0&&!['go','lap','finish','wrongway','eggboost'].includes(type)){if(text!==r.feedback)r.pendingFeedback=text;return;}
      r.feedback=text;
      r.pendingFeedback=null;
      r.feedbackTime=5;
    }
  }
  function useItem(r) {
    const p=r.actors[0];
    if(!p.item||r.phase!=='racing')return false;
    const type=p.item;
    p.item=null;
    r.usedItems++;
    if(type==='boost') {
      p.boost=2.6;
      const launch=Math.max(p.speed,r.character.speed)*1.35;
      p.vx=Math.cos(p.angle)*launch;p.vy=Math.sin(p.angle)*launch;
      notify(r,'eggboost','MOTORSPRIT! Dubbel fart, dåligt grepp. Sikta på rakan!');
    }
    if(type==='shield') {
      p.shield=8;
      notify(r,'shield','Volvodörr från skroten! Skydd i åtta sekunder.');
    }
    if(type==='mud') {
      const target=r.actors.slice(1).filter(a=>a.finishTime===null&&Math.hypot(a.x-p.x,a.y-p.y)<90).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
      if(target)target.slow=2;
      else r.puddles.push( {
        ...pointAt(r.track,p.along-14),life:8,radius:9,kind:'mud'
      });
      notify(r,'mud',target?`${target.name} fick lera i fjädrarna!`:'Kommunalt slamskott lagd bakom dig.');
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
        notify(r,'lap',a.lap===(r.combat?1:2)?'Sista varvet! Ge allt du har.':`Varv ${a.lap}: ${formatTime(a.laps.at(-1))}`);
      }
      if(a.lap>=(r.combat?2:3)) {
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
    updateCross(r,dt);
    updateTractor(r,dt);
    r.feedbackTime=Math.max(0,r.feedbackTime-dt);
    if(r.feedbackTime===0&&r.pendingFeedback){r.feedback=r.pendingFeedback;r.pendingFeedback=null;r.feedbackTime=5;}
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
      a.hitPushX*=Math.exp(-5*dt);a.hitPushY*=Math.exp(-5*dt);
      let dx=0,dy=0,base=(isPlayer?r.character.speed*(1+r.up.feed*.03)*r.build.speed:a.aiSpeed)*(r.combat?WEAPONS[a.gun.weapon].mass:1);
      if(isPlayer) {
        dx=input.x||0;
        dy=input.y||0;
      }
      else {
        const target=pointAt(r.track,a.along+18,(r.combat?(a.id%2?22:-22):a.aiLane*RIVALS[a.id-1].lane*Math.sin(a.along/110+a.id)));
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
      if(sprint&&!a.sprinting)r.events.push('sprint');
      a.sprinting=sprint;
      if(isPlayer) {
        const recovering=!input.sprint||len===0||a.boost>0||a.slow>0;
        a.stamina=clamp(a.stamina+dt*(sprint?-1:recovering?(.5+r.up.nest*.07)*r.build.recovery:0),0,r.maxStamina);
        if(a.stamina===0&&!a.exhausted)notify(r,'tired','Spurten är slut. Släpp spurtknappen för att vila.');
        a.exhausted=a.stamina===0;
      }
      const offroad=road.distance>roadWidth(r.track,road.along)-2;
      a.cornerBoost=Math.max(0,(a.cornerBoost||0)-dt);
      if(isPlayer) {
        const alignment=a.speed>1?(a.vx*dx+a.vy*dy)/a.speed:1;
        const sliding=!offroad&&len>0&&a.speed>base*.65&&alignment>.15&&alignment<.88&&a.slow===0;
        a.drifting=sliding;
        a.driftCharge=sliding?Math.min(.8,(a.driftCharge||0)+dt):a.driftCharge||0;
        if(!sliding){if(a.driftCharge>.18&&alignment>.94&&!offroad&&len>0&&a.slow===0){a.cornerBoost=.45;notify(r,'boost','Snygg sväng! Gratis skjuts från svågern.');a.driftCharge=0;}else if(offroad||!len||a.slow>0)a.driftCharge=0;else a.driftCharge=Math.max(0,a.driftCharge-dt*.3);}
      }
      const factor=a.slow>0?.48:a.boost>0?(isPlayer?2.05:1.5):sprint?1.32:a.cornerBoost>0?1.12:a.draft>.5?1.09:1;
      const desired=base*factor*(offroad?(isPlayer?.53+r.up.boots*.065:.6):1)*(len>0?1:0);
      const grip=isPlayer?(r.character.grip+r.up.boots*1.8)*r.build.grip*(a.boost>0?.42:1):8,blend=1-Math.exp(-grip*dt);
      a.vx+=(dx*desired-a.vx)*blend;
      a.vy+=(dy*desired-a.vy)*blend;
      a.x=clamp(a.x+(a.vx+a.hitPushX)*dt,10,(r.track.worldWidth||480)-10);
      a.y=clamp(a.y+(a.vy+a.hitPushY)*dt,12,(r.track.worldHeight||300)-12);
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
      for(const o of [...r.obstacles,...r.puddles,...(r.options.mode!=='trial'?[r.tractor,...(r.tractor.trailer?[r.tractor.trailer]:[])]:[]),...(r.options.mode!=='trial'&&r.cross.state==='burn'?[{...r.cross,kind:'mud',radius:7}]:[])]) if(Math.hypot(a.x-o.x,a.y-o.y)<o.radius+4&&a.cooldown===0) {
        if(a.shield>0) {
          a.shield=0;
          if(isPlayer)notify(r,'shield','Skölden tog smällen!');
        }
        else {
          a.boost=0;
          a.slow=((isPlayer&&r.options.chicken==='par')?.45:.9)*(isPlayer?r.build.armor:1);
          if(isPlayer) {
            r.bumps++;
            notify(r,'bump',o.kind==='tractor'?'Traktorn har inte bråttom. Kör om på insidan!':o.kind==='potato'?'Potatismos! Kör runt innan du fastnar.':o.kind==='manure'?'Nygödslat! Runda den bruna fläcken.':o.kind==='hay'?'Höbal! Ta en lite vidare kurva.':o.kind==='glass'?'Glassplitter! Runda den gröna fläcken.':'Lera! Håll dig på den ljusa stigen.');
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
    if(r.phase==='racing'){updateCrowd(r,dt);if(r.combat)updateCombat(r,input,dt);}
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
      position,time:r.time,bestLap:Math.min(...p.laps),corn:r.corn,items:r.usedItems,clean:r.bumps===0,coins:r.options.mode==='trial'||r.combat?0:([0,45,34,27,21,18][position]+r.corn*6+(r.bumps===0?10:0)+( {
        easy:0,normal:8,hard:16
      }
      [r.options.difficulty]||0)),medal:position<=3?4-position:0
    };
  }
  function settleRace(save,r) {
    if(r.settled||r.phase!=='finished')return null;
    r.settled=true;
    const result=r.result,trial=r.options.mode==='trial',key=`${r.track.id}:${r.options.mode}:${r.options.difficulty}`;
    result.newRecord=!r.combat&&(!save.records[key]||result.time<save.records[key].time);
    if(result.newRecord)save.records[key]= {
      time:result.time,lap:result.bestLap
    };
    if(trial&&result.newRecord) {
      // Long or truncated recordings are omitted instead of showing a misleading ghost.
      if(r.trace.length>1&&Math.abs(r.trace.at(-1)[0]-r.time)<.01)save.ghosts[r.track.id]=r.trace.map(sample=>sample.slice());
      else delete save.ghosts[r.track.id];
    }
    if(r.combat){
      const weapon=r.actors[0].gun.weapon;
      save.combatMastery=save.combatMastery||{};
      save.combatMastery[weapon]=Math.min(9999,(save.combatMastery[weapon]||0)+1);
      save.combatFinishes=(save.combatFinishes||0)+1;
      result.mastery=save.combatMastery[weapon];
    }
    if(!trial&&!r.combat) {
      const order=ranking(r);
      for(let i=0;i<4;i++)if(order.findIndex(a=>a.id===0)<order.findIndex(a=>a.id===i+1))save.rivalWins[i]++;
      if(r.track.id===TRACKS[save.cup.stage].id&&result.position<=3) {
        save.cup.stage++;
        result.cupMessage='Pallplats säkrad! Nästa cupetapp: '+(TRACKS[save.cup.stage]?.short||'mästerskapet avgjort');
        if(save.cup.stage===3){save.cup.stage=0;save.cup.titles++;result.coins+=150;result.cupMessage='Kommunmästare! +150 mynt och en svetsad pokal på gården. Ny cup väntar.';}
      }
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
    WEAPON_UPGRADES,buyWeaponUpgrade,WEAPONS,COMBAT_TRACKS,COMBAT_TRACK,fireShot,updateCombat,CATALOG,catalogUnlocked,buyCosmetic,equipCosmetic,updateTractor,updateCross,BUILDS,RIVALS,roadWidth,CROWD_DIALOGUE,makeCrowd,CHARACTERS,TRACKS,UPGRADES,CONTRACTS,clamp,freshSave,sanitizeSave,buyUpgrade,claimContract,buildTrack,pointAt,project,rectangleClear,makeRace,tick,ranking,useItem,settleRace,finishResult,formatTime,ghostAt
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FarmRace=api;
})(typeof window!=='undefined'?window:globalThis);
