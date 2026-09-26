/* DOM, input and lifecycle. Simulation, original artwork and audio live in js/. */
(() => {
  'use strict';
  const C=window.FarmRace,A=window.FarmArt,$=id=>document.getElementById(id),SAVE_KEY='bjorketorp-farm-v2';
  let storageAvailable=true;
  function loadSave() {
    try {
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw)return C.sanitizeSave(JSON.parse(raw));
      const s=C.freshSave();
      // Keep earned race/win progress from the old game; old times belong to different courses.
      s.races=Math.max(0,Math.min(10000,Number(localStorage.getItem('bjorketorp-races'))||0));
      s.wins=Math.min(s.races,Math.max(0,Number(localStorage.getItem('bjorketorp-wins'))||0));
      s.coins=Math.min(200,s.races*20);
      s.xp=s.races*25;
      return C.sanitizeSave(s);
    }
    catch {
      storageAvailable=false;
      return C.freshSave();
    }
  }
  let save=loadSave(),screen='hub',race=null,background=null,frameId=null,lastTime=0,accumulator=0,pausedPhase=null,queuedItem=false,view='race',lastFarmDraw=0,lastHud=0,toastTimer=null;
  const keys=new Set(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)'),audio=new FarmAudio.AudioEngine(save.settings),backgrounds=new Map();
  const selected=save.selected;
  function persist() {
    try {
      localStorage.setItem(SAVE_KEY,JSON.stringify(save));
      storageAvailable=true;
    }
    catch {
      storageAvailable=false;
    }
    $('save-indicator').textContent=storageAvailable?'Sparas på den här enheten':'Tillfällig gård · lagring ej tillgänglig';
  }
  function toast(text) {
    $('global-toast').textContent=text;
    $('global-toast').classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>$('global-toast').classList.add('hidden'),3300);
  }
  function setText(id,value) {
    if($(id).textContent!==String(value))$(id).textContent=value;
  }
  function getBackground(track) {
    const level=Object.values(save.upgrades).reduce((a,b)=>a+b,0),key=track.id+':'+level;
    if(!backgrounds.has(key))backgrounds.set(key,A.makeBackground(track,level));
    return backgrounds.get(key);
  }
  function renderWallet() {
    setText('coin-count',save.coins);
    setText('races-count',`${save.races} lopp`);
    setText('medal-count',`${Object.values(save.medals).filter(m=>m>0).length} medaljer`);
    const level=1+Math.floor(save.xp/150);
    setText('xp-label',`Gårdsnivå ${level}`);
    $('xp-bar').style.width=`${save.xp%150/1.5}%`;
    const upgrades=Object.values(save.upgrades).reduce((a,b)=>a+b,0);
    setText('farm-level',upgrades>=6?'BYGDENS MÄSTARGÅRD':upgrades>=3?'DEN VÄXANDE HÖNSGÅRDEN':'LILLA HÖNSGÅRDEN');
    setText('farm-level-copy',upgrades>=6?'Hemma bra. På banan ännu bättre.':`${Math.max(0,(upgrades<3?3:6)-upgrades)} uppgraderingar till nästa gårdsutseende.`);
    A.drawFarm($('farm-scene'),save,0);
  }
  function renderTracks() {
    const season=C.TRACKS.findIndex(t=>t.id===selected.track);
    setText('season-label',`${['MARKNAD','REGN ÖVER ÅKERN','SKÖRDEFEST I NATT'][season]} I BJÖRKETORP`);
    $('track-cards').replaceChildren();
    for(const [index,t] of C.TRACKS.entries()) {
      const locked=save.races<t.unlock,button=document.createElement('button');
      button.type='button';
      button.className='track-card'+(selected.track===t.id?' selected':'');
      button.disabled=locked;
      button.setAttribute('aria-pressed',String(selected.track===t.id));
      button.setAttribute('aria-label',`${t.name}${locked?`, låses upp efter ${t.unlock} lopp`:''}`);
      const record=save.records[`${t.id}:${selected.mode}:${selected.difficulty}`],medal=save.medals[`${t.id}:${selected.difficulty}`]||0;
      button.innerHTML=`<canvas class="track-map" width="240" height="116" aria-hidden="true"></canvas>${locked?`<span class="locked-mark">${save.races} / ${t.unlock} LOPP</span>`:selected.track===t.id?'<span class="selection-mark">VALD BANA</span>':''}<span class="track-body"><b>${t.short}</b><span class="track-sub">${t.subtitle}</span><span class="track-meta"><span>${locked?'LÅST':`${['MARKNAD','REGN ÖVER ÅKERN','SKÖRDEFEST I NATT'][index]} · ${['LÄTT','MEDEL','TEKNISK'][index]}`}</span><span>${record?C.formatTime(record.time):medal?['','BRONS','SILVER','GULD'][medal]:'—'}</span></span></span>`;
      button.addEventListener('click',()=> {
        selected.track=t.id;
        audio.play('click');
        persist();
        renderTracks();
        setText('season-label',`${['MARKNAD','REGN ÖVER ÅKERN','SKÖRDEFEST I NATT'][index]} I BJÖRKETORP`);
      });
      $('track-cards').append(button);
      const ctx=button.querySelector('canvas').getContext('2d');
      ctx.imageSmoothingEnabled=false;
      const track=C.buildTrack(t);
      ctx.drawImage(getBackground(track).canvas,0,0,480,300,0,-15,240,150);
    }
  }
  function renderChickens() {
    $('chicken-cards').replaceChildren();
    const trial=selected.mode==='trial',chosen=trial?'greta':selected.chicken;
    for(const [key,c] of Object.entries(C.CHARACTERS)) {
      const button=document.createElement('button');
      button.className='chicken-card'+(chosen===key?' selected':'');
      button.disabled=trial;
      button.setAttribute('aria-pressed',String(chosen===key));
      button.setAttribute('aria-label',c.name+', '+c.perk);
      button.innerHTML=`<canvas width="64" height="54" aria-hidden="true"></canvas><b>${c.short}</b><small>${key==='ragna'?'FART':key==='par'?'TÅLIGHET':key==='agnes'?'FÖREMÅL':'BALANS'}</small>`;
      button.addEventListener('click',()=> {
        selected.chicken=key;
        audio.play('click');
        persist();
        renderChickens();
      });
      $('chicken-cards').append(button);
      A.drawPortrait(button.querySelector('canvas'),c.color,save.skin);
    }
    setText('chicken-perk',trial?'Gårds-Greta utan uppgraderingar · samma villkor för varje rekord':C.CHARACTERS[selected.chicken].perk);
  }
  function renderWorkshop() {
    $('upgrade-cards').replaceChildren();
    for(const [key,u] of Object.entries(C.UPGRADES)) {
      const level=save.upgrades[key],max=level===u.max,cost=u.cost[level],card=document.createElement('article');
      card.className='upgrade-card';
      card.innerHTML=`<div class="upgrade-icon"><canvas width="32" height="32" aria-hidden="true"></canvas></div><h3>${u.name}</h3><p>${u.description}</p><div class="upgrade-levels" aria-label="Nivå ${level} av 3">${[0,1,2].map(i=>`<i class="${i<level?'filled':''}"></i>`).join('')}</div><small>NIVÅ ${level} / 3</small><button class="secondary" ${max||save.coins<cost?'disabled':''}>${max?'Fullt uppgraderad':`Uppgradera · ${cost} mynt`}</button>`;
      card.querySelector('button').addEventListener('click',()=> {
        if(C.buyUpgrade(save,key)) {
          audio.unlock();
          audio.play('buy');
          persist();
          renderWallet();
          renderWorkshop();
          renderTracks();
          toast(`${u.name} är nu nivå ${save.upgrades[key]}!`);
        }
      });
      $('upgrade-cards').append(card);
      A.drawUpgrade(card.querySelector('canvas'),key);
    }
    $('skin-buttons').replaceChildren();
    for(const [key,name,unlocked,desc] of [['classic','Gårdsoriginal',true,'Alltid hemma'],['blue','Blå halsduk',save.races>=3,'Kör klart 3 lopp'],['gold','Guldhalsduk',C.TRACKS.every(t=>(save.medals[`${t.id}:normal`]||0)===3),'Guld på alla banor i marknadstempo']]) {
      const button=document.createElement('button');
      button.className=save.skin===key?'selected':'';
      button.disabled=!unlocked;
      button.setAttribute('aria-pressed',String(save.skin===key));
      button.innerHTML=`${name}<small>${unlocked?'UPPLÅST':desc}</small>`;
      button.onclick=()=> {
        save.skin=key;
        persist();
        renderWorkshop();
        renderChickens();
        renderWallet();
        audio.play('click');
      };
      $('skin-buttons').append(button);
    }
  }
  function renderJournal() {
    const next=C.TRACKS.find(t=>save.races<t.unlock);
    setText('unlock-note',next?`Nästa utflykt: ${next.name}. ${save.races} / ${next.unlock} avslutade lopp. Även en femteplats räknas!`:'Alla banor är öppna! Samla nio guldmedaljer, bygg ut gården och jaga dina rekord.');
    $('contract-cards').replaceChildren();
    for(const c of C.CONTRACTS) {
      const claimed=save.contracts[c.id]||0,progress=Math.min(c.target,Math.max(0,save[c.id]-claimed*c.target)),ready=progress>=c.target,card=document.createElement('article');
      card.className='contract-card';
      card.innerHTML=`<h4>${c.name}</h4><p>${c.description} · ${progress}/${c.target}</p><small>+${c.reward} gårdsmynt · omgång ${claimed+1}</small><button class="secondary" ${ready?'':'disabled'}>${ready?'Hämta':'Pågår'}</button>`;
      card.querySelector('button').onclick=()=> {
        const reward=C.claimContract(save,c.id);
        if(reward) {
          persist();
          renderJournal();
          renderWallet();
          renderWorkshop();
          audio.play('buy');
          toast(`Uppdrag klart! +${reward} gårdsmynt.`);
        }
      };
      $('contract-cards').append(card);
    }
    $('medal-shelf').innerHTML=C.TRACKS.map(t=>`<div class="medal-row"><b>${t.short}</b>${['easy','normal','hard'].map((d,i)=>{const m=save.medals[`${t.id}:${d}`]||0;return `<span class="${m?'earned':''}">${['—','● BRONS','● SILVER','★ GULD'][m]}<small>${['GÅRDSTUR','MARKNAD','ELIT'][i]}</small></span>`;}).join('')}</div>`).join('');
  }
  function setView(next) {
    view=next;
    for(const key of ['race','workshop','journal'])$(key+'-view').classList.toggle('hidden',key!==next);
    document.querySelectorAll('[data-view]').forEach(button=> {
      button.classList.toggle('active',button.dataset.view===next);
      button.setAttribute('aria-pressed',String(button.dataset.view===next));
    });
  }
  function showHub(next='race') {
    screen='hub';
    keys.clear();
    queuedItem=false;
    race=null;
    pausedPhase=null;
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    $('hub').classList.remove('hidden');
    $('race-screen').classList.add('hidden');
    $('results').classList.add('hidden');
    renderWallet();
    renderTracks();
    renderChickens();
    renderWorkshop();
    renderJournal();
    setView(next);
    audio.pause(false);
    audio.setTheme('farm');
    schedule();
  }
  function startRace() {
    const t=C.TRACKS.find(t=>t.id===selected.track);
    if(!t||t.unlock>save.races)return;
    audio.unlock();
    audio.pause(false);
    audio.setTheme(t.music);
    keys.clear();
    queuedItem=false;
    pausedPhase=null;
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    race=C.makeRace(selected,save);
    race.skin=save.skin;
    background=getBackground(race.track);
    screen='race';
    $('hub').classList.add('hidden');
    $('results').classList.add('hidden');
    $('race-screen').classList.remove('hidden');
    setText('race-track-name',race.track.name);
    setText('race-tip',selected.mode==='trial'?'Jaga din bästa tid. Spökhönan följer ditt personbästa och kan inte krocka med dig.':'Den ljusa stigen är din bana. Majs ger extra gårdsmynt när du går i mål.');
    setText('race-mode-label',selected.mode==='trial'?(race.ghost?'TIDSTRÄNING · SPÖKHÖNA AKTIV':'TIDSTRÄNING · STANDARDHÖNA'): {
      easy:'LUGN GÅRDSTUR',normal:'MARKNADSTEMPO',hard:'BYGDENS ELIT'
    }
    [selected.difficulty]);
    accumulator=0;
    lastTime=0;
    lastHud=0;
    updateHud();
    A.render($('game'),race,background,0,reducedMotion.matches);
    $('game').focus( {
      preventScroll:true
    });
    $('race-screen').scrollIntoView( {
      block:'start',behavior:'instant'
    });
    persist();
    schedule();
  }
  function finishRace() {
    const oldRaces=save.races,result=C.settleRace(save,race);
    if(!result)return;
    persist();
    screen='results';
    keys.clear();
    queuedItem=false;
    audio.setTheme('result');
    audio.play('finish');
    $('race-screen').classList.add('hidden');
    $('results').classList.remove('hidden');
    const trial=race.options.mode==='trial',p=race.actors[0];
    setText('result-title',trial?(result.newRecord?'Nytt personbästa!':'En fin träningsrunda.'):result.position===1?'Gårdens nya stolthet!':result.position<=3?'En plats på pallen!':'Varje runda räknas.');
    setText('result-copy',`${race.track.name} · ${trial?'Tidsträning':`${result.position}:a av 5 hönor`} ${result.newRecord?'· Nytt banrekord!':''}`);
    A.drawPortrait($('result-bird'),p.color,save.skin);
    $('result-stats').innerHTML=`<div><span>LOPPTID</span><strong>${C.formatTime(result.time)}</strong></div><div><span>BÄSTA VARV</span><strong>${C.formatTime(result.bestLap)}</strong></div><div><span>MAJSKORN</span><strong>${result.corn}</strong></div>`;
    $('result-rewards').innerHTML=trial?`Träning ger färdighet.<small>${result.newRecord&&save.ghosts[race.track.id]?'Din nya spökhöna är sparad. Slå den nästa gång!':'Ditt bästa lopp blir en spökhöna att jaga.'} Inga gårdsmynt delas ut.</small>`:`+${result.coins} gårdsmynt<small>Placering + ${result.corn*2} för majs ${result.clean?'+ 10 för ett rent lopp':''} · ${save.coins} mynt i kassan</small>`;
    const unlocked=C.TRACKS.filter(t=>oldRaces<t.unlock&&save.races>=t.unlock).map(t=>`${t.name} är nu öppen!`);
    if(oldRaces<3&&save.races>=3)unlocked.push('Blå halsduk upplåst i hönshuset!');
    if(!trial&&C.CONTRACTS.some(c=>save[c.id]>=((save.contracts[c.id]||0)+1)*c.target))unlocked.push('Ett uppdrag är klart. Hämta belöningen i gårdsboken.');
    $('result-unlocks').classList.toggle('hidden',!unlocked.length);
    setText('result-unlocks',unlocked.join(' '));
    $('result-ranking').replaceChildren();
    C.ranking(race).forEach((a,i)=> {
      const li=document.createElement('li');
      if(a.id===0)li.className='player';
      const name=document.createElement('span'),time=document.createElement('span');
      name.textContent=`${i+1}. ${a.name}${a.id===0?' (du)':''}`;
      time.textContent=a.finishTime===null?'På banan':C.formatTime(a.finishTime);
      li.append(name,time);
      $('result-ranking').append(li);
    });
    $('result-laps').innerHTML=p.laps.map((lap,i)=>`<li><span>Varv ${i+1}</span><b>${C.formatTime(lap)}${lap===result.bestLap?' ★':''}</b></li>`).join('');
    $('results').scrollIntoView( {
      block:'start',behavior:'instant'
    });
    $('restart-button').focus( {
      preventScroll:true
    });
  }
  function updateHud() {
    if(!race)return;
    const p=race.actors[0],position=C.ranking(race).findIndex(a=>a.id===0)+1;
    const pos=`${position}<em>/${race.actors.length}</em>`,lap=`${Math.min(3,p.lap+1)}<em>/3</em>`;
    if($('hud-position').innerHTML!==pos)$('hud-position').innerHTML=pos;
    if($('hud-lap').innerHTML!==lap)$('hud-lap').innerHTML=lap;
    setText('stamina-label',p.stamina<.01?'VILA VINGARNA':'SPURT');
    setText('hud-time',C.formatTime(race.time));
    setText('hud-corn',race.corn);
    setText('lap-time',C.formatTime(race.time-p.lapStart));
    $('stamina-fill').style.width=`${p.stamina/race.maxStamina*100}%`;
    const item= {
      boost:'Fartägg',shield:'Äggsköld',mud:'Lerbomb'
    }
    [p.item]||'Plocka ett ägg';
    setText('item-name',race.options.mode==='trial'?'Tidsträning':item);
    $('item-button').classList.toggle('ready',!!p.item);
    $('item-button').disabled=!p.item;
    $('countdown').classList.toggle('hidden',race.countdown===0);
    const count=Math.ceil(race.countdown);
    if($('countdown').querySelector('strong').textContent!==String(count))$('countdown').querySelector('strong').textContent=count;
    $('race-toast').classList.toggle('hidden',race.feedbackTime<=0||race.countdown>0);
    setText('race-toast',race.feedback);
    setText('crowd-caption',race.crowdSpeechTime>0?`📣 ${race.crowd[race.crowdSpeaker]?.name||'PUBLIKEN'}: ”${race.crowdSpeech}”`:'KLADDIS FANCLUB • Emil ”Kladdis” Callheim hälsar: håll i fjädrarna!');
  }
  function pauseRace(show=true) {
    if(screen!=='race'||!race||race.phase==='paused')return;
    pausedPhase=race.phase;
    race.phase='paused';
    keys.clear();
    queuedItem=false;
    audio.pause(true);
    if(show&&!document.querySelector('dialog[open]')) {
      $('pause-dialog').showModal();
      $('resume-button').focus();
    }
  }
  function resumeRace() {
    if(!race||race.phase!=='paused')return;
    race.phase=pausedPhase||'racing';
    pausedPhase=null;
    keys.clear();
    audio.pause(false);
    $('pause-dialog').close();
    lastTime=0;
    accumulator=0;
    $('game').focus( {
      preventScroll:true
    });
    schedule();
  }
  function schedule() {
    if(frameId===null&&!document.hidden)frameId=requestAnimationFrame(loop);
  }
  function loop(now) {
    frameId=null;
    if(document.hidden)return;
    const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;
    lastTime=now;
    if(screen==='race'&&race) {
      if(race.phase!=='paused') {
        accumulator+=dt;
        let steps=0;
        while(accumulator>=1/120&&steps++<12) {
          const input= {
            x:Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w')),sprint:keys.has('Shift'),item:queuedItem
          };
          C.tick(race,input,1/120);
          queuedItem=false;
          accumulator-=1/120;
          for(const event of race.events)audio.play(event);
          if(race.phase==='finished') {
            finishRace();
            break;
          }
        }
        if(screen==='race') {
          audio.lastLap=race.actors[0].lap===2;
          A.render($('game'),race,background,race.time+3-race.countdown,reducedMotion.matches);
        }
      }
      if(now-lastHud>70) {
        updateHud();
        lastHud=now;
      }
    }
    else if(screen==='hub'&&now-lastFarmDraw>180&&!reducedMotion.matches) {
      A.drawFarm($('farm-scene'),save,now/1000);
      lastFarmDraw=now;
    }
    schedule();
  }
  // Only gameplay owns movement keys. Native controls keep their keyboard behavior in menus.
  document.addEventListener('keydown',event=> {
    if(screen!=='race')return;
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(key==='Escape') {
      if(event.repeat)return;
      if(document.querySelector('dialog[open]'))return;
      event.preventDefault();
      pauseRace();
      return;
    }
    if(race.phase==='paused'||document.querySelector('dialog[open]'))return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' ','Shift'].includes(key)) {
      event.preventDefault();
      if(key===' ') {
        if(!event.repeat)queuedItem=true;
      }
      else keys.add(key);
    }
  });
  document.addEventListener('keyup',event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key));
  window.addEventListener('blur',()=> {
    keys.clear();
    if(screen==='race')pauseRace();
    audio.pause(true);
  });
  window.addEventListener('focus',()=> {
    if(screen!=='race'||race?.phase!=='paused')audio.pause(false);
  });
  document.addEventListener('visibilitychange',()=> {
    if(document.hidden) {
      keys.clear();
      pauseRace();
      audio.pause(true);
      if(frameId!==null)cancelAnimationFrame(frameId);
      frameId=null;
    }
    else {
      lastTime=0;
      if(screen!=='race'||race?.phase!=='paused')audio.pause(false);
      schedule();
    }
  });
  document.querySelectorAll('[data-key]').forEach(button=> {
    button.addEventListener('pointerdown',event=> {
      if(screen!=='race'||race.phase==='paused')return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      keys.add(button.dataset.key);
    });
    const release=()=>keys.delete(button.dataset.key);
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
  });
  for(const id of ['touch-item','item-button'])$(id).addEventListener('click',()=> {
    queuedItem=true;
    $('game').focus( {
      preventScroll:true
    });
  });
  $('start-button').onclick=startRace;
  $('restart-button').onclick=startRace;
  $('pause-restart-button').onclick=startRace;
  $('pause-button').onclick=()=>pauseRace();
  $('resume-button').onclick=resumeRace;
  $('pause-dialog').addEventListener('cancel',event=> {
    event.preventDefault();
    resumeRace();
  });
  $('menu-button').onclick=()=>showHub();
  $('finish-menu-button').onclick=()=> {
    showHub('workshop');
    $('hub').scrollIntoView( {
      block:'start',behavior:'instant'
    });
  };
  $('home-link').onclick=event=> {
    event.preventDefault();
    if(screen==='race')pauseRace();
    else showHub();
  };
  document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=> {
    setView(button.dataset.view);
    audio.play('click');
    audio.unlock();
  });
  $('difficulty').value=selected.difficulty;
  $('mode').value=selected.mode;
  $('difficulty').onchange=()=> {
    selected.difficulty=$('difficulty').value;
    persist();
    renderTracks();
  };
  function modeCopy() {
    setText('session-summary',selected.mode==='trial'?'3 varv · solo · rekordjakt':'3 varv · cirka 1 minut · 5 hönor');
    setText('start-copy',selected.mode==='trial'?'Hitta din linje, spara spurten och sätt ett nytt personbästa.':'Samla majs, hitta din linje och spara en spurt till slutet.');
    setText('mode-copy',selected.mode==='trial'?'Jaga din egen spökhöna! Solo med standard-Greta. Ditt bästa lopp sparas som en spökhöna till nästa försök.':'Alla målgångar ger gårdsmynt. En pallplats ger medalj!');
    $('difficulty').disabled=selected.mode==='trial';
  }
  $('mode').onchange=()=> {
    selected.mode=$('mode').value;
    if(selected.mode==='trial') {
      selected.difficulty='easy';
      $('difficulty').value='easy';
    }
    modeCopy();
    persist();
    renderTracks();
    renderChickens();
  };
  modeCopy();
  function openDialog(id) {
    if(screen==='race')pauseRace(false);
    $(id).showModal();
    if(screen!=='race')audio.unlock();
  }
  function closedDialog() {
    if(screen==='race'&&race.phase==='paused'&&!$('pause-dialog').open)$('pause-dialog').showModal();
  }
  $('settings-button').onclick=()=>openDialog('settings-dialog');
  $('pause-audio-button').onclick=()=>openDialog('settings-dialog');
  $('help-button').onclick=()=>openDialog('help-dialog');
  document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>$(button.dataset.close).close());
  for(const id of ['settings-dialog','help-dialog'])$(id).addEventListener('close',closedDialog);
  for(const key of ['music','sfx','ambience']) {
    const slider=$(key+'-volume');
    slider.value=Math.round(save.settings[key]*100);
    setText(key+'-value',slider.value+' %');
    slider.oninput=()=> {
      save.settings[key]=Number(slider.value)/100;
      setText(key+'-value',slider.value+' %');
      audio.configure(save.settings);
      persist();
    };
  }
  function muteLabel() {
    $('mute-button').setAttribute('aria-pressed',String(save.settings.mute));
    setText('mute-button',save.settings.mute?'Slå på ljudet':'Stäng av allt ljud');
  }
  $('mute-button').onclick=()=> {
    save.settings.mute=!save.settings.mute;
    audio.configure(save.settings);
    audio.unlock();
    muteLabel();
    persist();
  };
  muteLabel();
  $('sound-test').onclick=async()=> {
    const paused=audio.paused;
    audio.pause(false);
    if(await audio.unlock())audio.play('pickup');
    if(paused)setTimeout(()=> {
      if(race?.phase==='paused')audio.pause(true);
    },450);
  };
  // A first intentional interaction enables audio; browsers never receive autoplay requests.
  $('hub').addEventListener('pointerdown',()=>audio.unlock(), {
    once:true
  });
  window.addEventListener('pagehide',()=>audio.pause(true));
  persist();
  showHub();
})();
