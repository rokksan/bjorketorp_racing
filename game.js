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
  const mouse={x:240,y:150,active:false,down:false,queued:false,reloadQueued:false};
  const keys=new Set(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)'),audio=new FarmAudio.AudioEngine(save.settings),backgrounds=new Map();
  const selected=save.selected;
  const touchMode=matchMedia('(pointer: coarse), (hover: none), (max-width: 700px)');
  const sticks={move:{id:null,x:0,y:0},aim:{id:null,x:0,y:0}};
  let ownFullscreen=false;
  function resetTouch(){
    for(const [name,stick] of Object.entries(sticks)){
      const el=$(name==='move'?'move-stick':'aim-stick'),id=stick.id;
      stick.id=null;stick.x=stick.y=0;
      el.classList.remove('engaged');el.querySelector('.stick-knob').style.transform='translate(-50%, -50%)';
      if(id!==null&&el.hasPointerCapture?.(id))el.releasePointerCapture(id);
    }
  }
  function mobileRace(active){
    document.documentElement?.classList.toggle('mobile-racing',active&&touchMode.matches);
    resetTouch();
    if(!active&&ownFullscreen){ownFullscreen=false;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});}
  }
  function enterFullscreen(){
    if(document.fullscreenElement||!document.documentElement?.requestFullscreen)return;
    document.documentElement.requestFullscreen().then(()=>{ownFullscreen=true;}).catch(()=>{});
  }

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
    toastTimer=setTimeout(()=>$('global-toast').classList.add('hidden'),5500);
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
    setText('farm-level',upgrades>=6?'PANTKUNGENS NEONPALATS':upgrades>=3?'SVÅGERNS SKULDIMPERIUM':'KOMMUNENS BORTGLÖMDA UTHUS');
    setText('farm-level-copy',upgrades>=6?'Hemma bra. På banan ännu bättre.':`${Math.max(0,(upgrades<3?3:6)-upgrades)} uppgraderingar till nästa gårdsutseende.`);
    A.drawFarm($('farm-scene'),save,0);
    modeCopy();
  }
  function renderTracks() {
    const season=C.TRACKS.findIndex(t=>t.id===selected.track);
    setText('season-label',`${['MARKNAD','REGN ÖVER ÅKERN','SKÖRDEFEST I NATT'][season]} I BJÖRKETORP`);
    $('track-cards').replaceChildren();
    const combat=selected.mode==='combat',chosen=combat?selected.combatTrack:selected.track;
    for(const [index,t] of (combat?C.COMBAT_TRACKS:C.TRACKS).entries()) {
      const locked=save.races<t.unlock,button=document.createElement('button');
      button.type='button';
      button.className='track-card'+(chosen===t.id?' selected':'');
      button.disabled=locked;
      button.setAttribute('aria-pressed',String(chosen===t.id));
      button.setAttribute('aria-label',`${t.name}${locked?`, låses upp efter ${t.unlock} lopp`:''}`);
      const record=save.records[`${t.id}:${selected.mode}:${selected.difficulty}`],medal=save.medals[`${t.id}:${selected.difficulty}`]||0;
      button.innerHTML=`<canvas class="track-map" width="240" height="116" aria-hidden="true"></canvas>${locked?`<span class="locked-mark">${save.races} / ${t.unlock} LOPP</span>`:chosen===t.id?'<span class="selection-mark">VALD BANA</span>':''}<span class="track-body"><b>${t.short}</b><span class="track-sub">${combat?t.description||t.subtitle:t.subtitle}</span><span class="track-meta"><span>${locked?'LÅST':`${combat?({fair:'MARKNAD',scrapyard:'SKROT',peat:'TORVTRÄSK',airstrip:'TJUVJAKT',park:'FOLKETS PARK'}[t.id]):['MARKNAD','REGN ÖVER ÅKERN','SKÖRDEFEST I NATT'][index]} · ${combat?'2 VARV':['LÄTT','MEDEL','TEKNISK'][index]}`}</span><span>${record?C.formatTime(record.time):medal?['','BRONS','SILVER','GULD'][medal]:'—'}</span></span></span>`;
      button.addEventListener('click',()=> {
        if(combat)selected.combatTrack=t.id;else selected.track=t.id;
        audio.play('click');
        persist();
        renderTracks();
        setText('season-label',`${combat?t.short.toUpperCase():['MARKNAD','REGN ÖVER ÅKERN','SKÖRDEFEST I NATT'][index]} I BJÖRKETORP`);
      });
      $('track-cards').append(button);
      const ctx=button.querySelector('canvas').getContext('2d');
      ctx.imageSmoothingEnabled=false;
      const track=C.buildTrack(t);
      ctx.drawImage(getBackground(track).canvas,0,0,track.worldWidth||480,track.worldHeight||300,0,-15,240,150);
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
      A.drawPortrait(button.querySelector('canvas'),c.color,save.skin,save.outfit);
    }
    setText('chicken-perk',trial?'Svets-Greta utan uppgraderingar · samma villkor för varje rekord':C.CHARACTERS[selected.chicken].tag+' '+C.CHARACTERS[selected.chicken].perk);
  }
  function renderArmory(){
    $('weapon-cards').replaceChildren();
    const copy={shotgun:'Bred knuff på nära håll. Två patroner, sedan får du stå för fiolerna.',pistol:'Lätt att bära. Snabba skott tömmer rivalens spurt, men knuffar svagt.',rifle:'Långa skott bryter boost. Tung att bära och sparkar som en obesiktigad älg.',potato:'Långsam potatis, stor mosfläck. Bromsar alla i närheten — även leverantören.'};
    for(const [key,w] of Object.entries(C.WEAPONS)){
      const card=document.createElement('article'),active=(selected.weapon||'shotgun')===key,up=save.weaponUpgrades?.[key]||{},runs=save.combatMastery?.[key]||0,mastery=Math.min(3,Math.floor(runs/3));
      card.className='catalog-product weapon-product'+(active?' equipped':'');
      card.innerHTML=`<span class="catalog-edition">ART. 049-${Object.keys(C.WEAPONS).indexOf(key)+1} / LAGÅRDSKLASS</span><canvas width="160" height="70" aria-hidden="true"></canvas><h3>${w.name}</h3><p>${copy[key]}</p><dl class="weapon-spec"><div><dt>Magasin</dt><dd>${w.ammo} skott</dd></div><div><dt>Omladdning</dt><dd>${(w.reload*(1-mastery*.06-(up.reload||0)*.05)).toFixed(2)} s</dd></div><div><dt>Egen rekyl</dt><dd>${Math.round(w.recoil*(1-(up.recoil||0)*.12))}</dd></div></dl><button class="secondary weapon-equip" aria-pressed="${active}">${active?'✓ Packad till loppet':'Välj vapen · gratis'}</button><p class="weapon-mastery">MÄSTERSKAP ${mastery}/3 · ${runs} målgångar<br><small>${mastery===3?'Fullärd byfåne. −18 % omladdning.':`${3-runs%3} lopp till nästa nivå · −6 % omladdning/nivå`}</small></p><div class="weapon-tuning"></div>`;
      card.querySelector('.weapon-equip').onclick=()=>{selected.weapon=key;persist();modeCopy();renderArmory();audio.play('click');};
      for(const [type,u] of Object.entries(C.WEAPON_UPGRADES)){
        const level=up[type]||0,cost=u.cost[level],row=document.createElement('div');row.className='weapon-upgrade';
        row.innerHTML=`<b>${u.name}</b><small>${u.description} Nivå ${level}/3.</small><button class="secondary" ${level===3||save.coins<cost?'disabled':''}>${level===3?'Färdigfultrimmad':`Uppgradera · ${cost} mynt`}</button>`;
        row.querySelector('button').onclick=()=>{if(C.buyWeaponUpgrade(save,key,type)){persist();renderWallet();renderArmory();audio.play('buy');toast(u.name+' monterad på '+w.name);}};
        card.querySelector('.weapon-tuning').append(row);
      }
      $('weapon-cards').append(card);A.drawWeapon?.(card.querySelector('canvas'),key);
    }
  }
  function renderWorkshop() {
    $('upgrade-cards').replaceChildren();
    for(const [key,u] of Object.entries(C.UPGRADES)) {
      const level=save.upgrades[key],max=level===u.max,cost=u.cost[level],card=document.createElement('article');
      card.className='upgrade-card';
      card.innerHTML=`<div class="upgrade-icon"><canvas width="32" height="32" aria-hidden="true"></canvas></div><h3>${u.name}</h3><p>${u.description}</p><p class="upgrade-next">${max?'Svågern vägrar ta mer ansvar.':`Nästa: ${u.tiers[level]}`}</p><div class="upgrade-levels" aria-label="Nivå ${level} av 3">${[0,1,2].map(i=>`<i class="${i<level?'filled':''}"></i>`).join('')}</div><small>${level?u.tiers[level-1]:'Ännu inte skuldsatt'} · NIVÅ ${level} / 3</small><button class="secondary" ${max||save.coins<cost?'disabled':''}>${max?'Fullt uppgraderad':`Uppgradera · ${cost} mynt`}</button>`;
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
    const trimHeading=document.createElement('h3');trimHeading.className='garage-subhead';trimHeading.textContent='BÄNK 02 / Gratis fultrim · välj ett bygge';$('upgrade-cards').append(trimHeading);
    for(const [key,b] of Object.entries(C.BUILDS)) {
      const card=document.createElement('article');card.className='upgrade-card';
      const unlocked=save.races>=b.unlock;
      card.innerHTML=`<h3>${b.name}</h3><p>${b.description}</p><small>${unlocked?'Gratis att byta • ett trimval åt gången':`Låses upp efter ${b.unlock} lopp`}</small><button class="secondary" aria-pressed="${save.build===key}" ${unlocked?'':'disabled'}>${save.build===key?'Monterat':unlocked?'Montera':`${save.races} / ${b.unlock} lopp`}</button>`;
      card.querySelector('button').onclick=()=>{save.build=key;persist();renderWorkshop();modeCopy();audio.play('click');};
      $('upgrade-cards').append(card);
    }
    $('catalog-cards').replaceChildren();
    for(const [key,item] of Object.entries(C.CATALOG)) {
      const owned=save.owned.includes(key),active=save[item.slot]===key,unlocked=C.catalogUnlocked(save,key),card=document.createElement('article');
      card.className='catalog-product';
      card.innerHTML=`<canvas width="96" height="64" aria-label="Förhandsvisning: ${item.name}"></canvas><span class="catalog-price">${item.challenge?'MERIT':item.cost}<small>${item.challenge?' BELÖNING':' MYNT'}</small></span><h3>${item.name}</h3><p>${item.description}</p><small>${item.slot==='outfit'?'En styling åt gången, alla hönor':'En dekor åt gången på den extra tomtplatsen'} · endast utseende</small><button class="secondary" ${!owned&&(!unlocked||save.coins<item.cost)?'disabled':''}>${active?'Ta av':owned?'Använd':!unlocked?(item.challenge?'Lås upp i skuldboken':'Meritkrav saknas'):`Köp · ${item.cost} mynt`}</button>`;
      card.querySelector('button').onclick=()=>{
        if(owned)C.equipCosmetic(save,item.slot,active?null:key);else if(!C.buyCosmetic(save,key))return;
        persist();renderWorkshop();renderWallet();renderChickens();audio.play(owned?'click':'buy');
      };
      $('catalog-cards').append(card);A.drawCatalog?.(card.querySelector('canvas'),key);
    }
    $('skin-buttons').replaceChildren();
    for(const [key,name,unlocked,desc] of [['classic','Ärvd från dödsboet',true,'Luktar fortfarande lagård'],['blue','Kommunens avlagda disktrasa',save.races>=3,'Kör klart 3 lopp'],['gold','Förgylld pantkungstrasa',C.TRACKS.every(t=>(save.medals[`${t.id}:normal`]||0)===3),'Guld på alla banor i Pantpanik']]) {
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
    const cup=C.TRACKS[save.cup.stage];
    $('unlock-note').textContent+=` Kommunmästerskapet: ${save.cup.stage}/3 pallplatser. Nästa: ${cup.short}. Kör ett gårdslopp på valfri svårighet och kom topp 3. Tre etapper ger 150 mynt och en pokal. Titlar: ${save.cup.titles}.`;
    $('cup-ledger').innerHTML=`<strong>${save.cup.titles} CUPTITLAR · 150 MYNT PER FULLBORDAD CUP</strong><ol>${C.TRACKS.map((t,i)=>`<li class="${i<save.cup.stage?'done':i===save.cup.stage?'current':''}"><span>${i<save.cup.stage?'✓':'0'+(i+1)}</span><b>${t.short}</b><small>${i<save.cup.stage?'KVITTERAD':i===save.cup.stage?'NÄSTA: TOPP 3':'VÄNTAR'}</small></li>`).join('')}</ol>`;
    $('contract-cards').replaceChildren();
    $('combat-contract-cards').replaceChildren();
    $('rival-cards').replaceChildren();
    for(const [i,rival] of C.RIVALS.entries()) {
      const card=document.createElement('article');card.className='contract-card';
      card.innerHTML=`<h4>${rival.name}</h4><p>“${rival.quip}”</p><small>Du har slagit rivalen ${save.rivalWins[i]} gånger.</small>`;
      $('rival-cards').append(card);
    }

    for(const c of C.CONTRACTS) {
      const claimed=save.contracts[c.id]||0,progress=Math.min(c.target,Math.max(0,save[c.id]-claimed*c.target)),done=c.once&&claimed>0,ready=!done&&progress>=c.target,card=document.createElement('article');
      card.className='contract-card'+(ready?' claim-ready':'');
      card.innerHTML=`<span class="ledger-label">${done?'KVITTERAT':ready?'KLAR ATT KVITTERA':'PÅGÅENDE ÄRENDE'}</span><h4>${c.name}</h4><p>${c.description} · ${done?c.target:progress}/${c.target}</p><progress max="${c.target}" value="${done?c.target:progress}" aria-label="${c.name}"></progress><small>+${c.reward} gårdsmynt · ${c.once?'engångsuppdrag':'omgång '+(claimed+1)}${c.cosmetic?' · '+C.CATALOG[c.cosmetic].name:''}</small><button class="secondary" ${ready?'':'disabled'}>${done?'Kvitterat':ready?'Hämta':'Pågår'}</button>`;
      card.querySelector('button').onclick=()=> {
        const reward=C.claimContract(save,c.id);
        if(reward) {
          persist();
          renderJournal();
          renderWallet();
          renderWorkshop();
          audio.play('buy');
          toast(`Uppdrag klart! +${reward} gårdsmynt.${c.cosmetic?' Styling finns nu i Hönstema!':''}`);
        }
      };
      $(c.mode==='combat'?'combat-contract-cards':'contract-cards').append(card);
    }
    $('medal-shelf').innerHTML=C.TRACKS.map(t=>`<div class="medal-row"><b>${t.short}</b>${['easy','normal','hard'].map((d,i)=>{const m=save.medals[`${t.id}:${d}`]||0;return `<span class="${m?'earned':''}">${['—','● BRONS','● SILVER','★ GULD'][m]}<small>${['BAKFYLLA','PANTPANIK','FOGDEN'][i]}</small></span>`;}).join('')}</div>`).join('');
  }
  function setView(next) {
    view=next;
    if(next==='armory')renderArmory();
    for(const key of ['race','workshop','catalog','armory','journal'])$(key+'-view').classList.toggle('hidden',key!==next);
    document.querySelectorAll('[data-view]').forEach(button=> {
      button.classList.toggle('active',button.dataset.view===next);
      button.setAttribute('aria-pressed',String(button.dataset.view===next));
    });
  }
  function showHub(next='race') {
    screen='hub';mobileRace(false);
    keys.clear();mouse.down=false;
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
    if(!t||selected.mode!=='combat'&&t.unlock>save.races)return;
    audio.unlock();
    audio.pause(false);
    audio.setTheme(selected.mode==='combat'?(C.COMBAT_TRACKS.find(t=>t.id===selected.combatTrack)?.music||'market'):t.music);
    keys.clear();
    queuedItem=false;
    pausedPhase=null;
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    race=C.makeRace({...selected,weapon:selected.weapon,combatTrack:selected.combatTrack},save);
    race.skin=save.skin;
    race.outfit=save.outfit;
    mouse.down=false;mouse.queued=false;mouse.reloadQueued=false;mouse.active=false;
    if(race.combat)race.camera={x:0,y:0,zoom:.5};
    $('combat-hud').classList.toggle('hidden',!race.combat);
    $('game').classList.toggle('combat-cursor',race.combat);
    background=getBackground(race.track);
    screen='race';mobileRace(true);
    $('aim-stick').classList.toggle('hidden',!race.combat);$('touch-reload').classList.toggle('hidden',!race.combat);
    if(touchMode.matches)enterFullscreen();
    $('hub').classList.add('hidden');
    $('results').classList.add('hidden');
    $('race-screen').classList.remove('hidden');
    setText('race-track-name',race.track.name);
    setText('race-tip',race.combat?'WASD: spring · mus: sikta · klick: skjut · R: ladda · Shift: spurt · Space: föremål':selected.mode==='trial'?'Jaga din bästa tid. Spökhönan följer ditt personbästa och kan inte krocka med dig.':race.feedback);
    setText('race-mode-label',race.combat?'SKROTKRIG · 2 VARV · TESTBANA':selected.mode==='trial'?(race.ghost?'TIDSTRÄNING · SPÖKHÖNA AKTIV':'TIDSTRÄNING · STANDARDHÖNA'): {
      easy:'SÖNDAGSBAKFYLLA',normal:'PANTPANIK',hard:'FOGDEN KOMMER'
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
    screen='results';mobileRace(false);
    keys.clear();
    queuedItem=false;
    audio.setTheme('result');
    audio.play('finish');
    $('race-screen').classList.add('hidden');
    $('results').classList.remove('hidden');
    const trial=race.options.mode==='trial',p=race.actors[0];
    setText('result-title',trial?(result.newRecord?'Nytt personbästa!':'En fin träningsrunda.'):result.position===1?'Gårdens nya stolthet!':result.position<=3?'En plats på pallen!':'Varje runda räknas.');
    setText('result-copy',`${race.track.name} · ${trial?'Tidsträning':`${result.position}:a av 5 hönor`} ${result.newRecord?'· Nytt banrekord!':''}${trial?'':` · ${C.RIVALS[0].name}: ${save.rivalWins[0]>0?'Nästa gång tar jag fan traktorn.':C.RIVALS[0].quip}`}`);
    A.drawPortrait($('result-bird'),p.color,save.skin,save.outfit);
    $('result-stats').innerHTML=`<div><span>LOPPTID</span><strong>${C.formatTime(result.time)}</strong></div><div><span>BÄSTA VARV</span><strong>${C.formatTime(result.bestLap)}</strong></div><div><span>MAJSKORN</span><strong>${result.corn}</strong></div>`;
    $('result-rewards').innerHTML=race.combat?`+${result.coins} gårdsmynt · Vapenmästerskap +1<small>${C.WEAPONS[race.actors[0].gun.weapon].name}: ${result.mastery} lopp · nivå ${Math.min(3,Math.floor(result.mastery/3))}/3. Var tredje målgång ger 6 % snabbare omladdning.</small>`:trial?`Träning ger färdighet.<small>${result.newRecord&&save.ghosts[race.track.id]?'Din nya spökhöna är sparad. Slå den nästa gång!':'Ditt bästa lopp blir en spökhöna att jaga.'} Inga gårdsmynt delas ut.</small>`:`+${result.coins} gårdsmynt<small>Målgång 60 + placering + ${result.corn*10} för majs ${result.clean?'+ 15 för ett rent lopp':''} · ${save.coins} mynt i kassan</small>`;
    const unlocked=C.TRACKS.filter(t=>oldRaces<t.unlock&&save.races>=t.unlock).map(t=>`${t.name} är nu öppen!`);
    if(result.cupMessage)unlocked.push(result.cupMessage);
    if(oldRaces<3&&save.races>=3)unlocked.push('Kommunens avlagda disktrasa upplåst i hönshuset!');
    if(!trial&&C.CONTRACTS.some(c=>(!c.once||!save.contracts[c.id])&&save[c.id]>=((save.contracts[c.id]||0)+1)*c.target))unlocked.push('Ett uppdrag är klart. Hämta belöningen i gårdsboken.');
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
    const pos=`${position}<em>/${race.actors.length}</em>`,lap=`${Math.min(race.combat?2:3,p.lap+1)}<em>/${race.combat?2:3}</em>`;
    if($('hud-position').innerHTML!==pos)$('hud-position').innerHTML=pos;
    if($('hud-lap').innerHTML!==lap)$('hud-lap').innerHTML=lap;
    setText('stamina-label',p.stamina<.01?'VILA VINGARNA':'SPURT');
    setText('hud-time',C.formatTime(race.time));
    setText('hud-corn',race.corn);
    if(race.combat){const w=C.WEAPONS[p.gun.weapon];setText('combat-status',p.gun.reload>0?`${w.name.toUpperCase()} · LADDAR ${p.gun.reload.toFixed(1)} s`:`${w.name.toUpperCase()} · M${p.gun.mastery} · ${p.gun.ammo}/${w.ammo} SKOTT · ${p.gun.rearFire>0?'BAKÅTSKYTTE −15 % FART':p.draft>.5?'SLIPSTREAM +9 %':touchMode.matches?'DRA HÖGER SPAK: SKJUT':'KLICK: SKJUT · R: LADDA'}`);}
    setText('lap-time',C.formatTime(race.time-p.lapStart));
    $('stamina-fill').style.width=`${p.stamina/race.maxStamina*100}%`;
    const item= {
      boost:'Motorsprit i äggkopp',shield:'Volvodörr från skroten',mud:'Kommunalt slamskott'
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

  }
  function pauseRace(show=true) {
    if(screen!=='race'||!race||race.phase==='paused')return;
    resetTouch();mouse.down=false;mouse.queued=false;mouse.reloadQueued=false;
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
            x:sticks.move.id!==null?sticks.move.x:Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:sticks.move.id!==null?sticks.move.y:Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w')),analog:sticks.move.id!==null,sprint:keys.has('Shift')||Math.hypot(sticks.move.x,sticks.move.y)>.92,item:queuedItem,fire:mouse.down||mouse.queued,reload:keys.has('r')||mouse.reloadQueued,aimX:race.combat&&mouse.active?race.camera.x+mouse.x/race.camera.zoom:undefined,aimY:race.combat&&mouse.active?race.camera.y+mouse.y/race.camera.zoom:undefined
          };
          if(race.combat&&sticks.aim.id!==null){
            const a=sticks.aim,p=race.actors[0],distance=Math.hypot(a.x,a.y);
            input.fire=distance>.18;input.aimX=distance>.08?p.x+a.x*180:undefined;input.aimY=distance>.08?p.y+a.y*180:undefined;
          }
          C.tick(race,input,1/120);
          if(race.combat){
            const p=race.actors[0],cam=race.camera,targetZoom=race.countdown>0?.5:1.05,k=1-Math.exp(-5/120);
            cam.zoom+=(targetZoom-cam.zoom)*k;
            const tx=C.clamp(p.x+p.vx*.65-240/cam.zoom,0,race.track.worldWidth-480/cam.zoom),ty=C.clamp(p.y+p.vy*.65-150/cam.zoom,0,race.track.worldHeight-300/cam.zoom);
            cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;
            race.aim=sticks.aim.id!==null?{x:p.x+sticks.aim.x*180,y:p.y+sticks.aim.y*180}:mouse.active?{x:cam.x+mouse.x/cam.zoom,y:cam.y+mouse.y/cam.zoom}:null;
          }
          queuedItem=false;mouse.queued=false;mouse.reloadQueued=false;
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
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' ','Shift','r'].includes(key)) {
      event.preventDefault();
      if(key==='r'&&!event.repeat)mouse.reloadQueued=true;
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
  for(const [name,id] of [['move','move-stick'],['aim','aim-stick']]){
    const el=$(id),stick=sticks[name];
    const move=event=>{
      if(event.pointerId!==stick.id)return;event.preventDefault();
      const box=el.getBoundingClientRect(),radius=box.width*.28,dx=(event.clientX-box.left-box.width/2)/radius,dy=(event.clientY-box.top-box.height/2)/radius,length=Math.hypot(dx,dy);
      const strength=Math.pow(Math.min(1,Math.max(0,(length-.07)/.93)),.85);
      stick.x=length?dx/length*strength:0;stick.y=length?dy/length*strength:0;
      el.querySelector('.stick-knob').style.transform=`translate(calc(-50% + ${stick.x*radius}px), calc(-50% + ${stick.y*radius}px))`;
    };
    el.addEventListener('pointerdown',event=>{
      if(screen!=='race'||race.phase==='paused'||stick.id!==null)return;
      event.preventDefault();stick.id=event.pointerId;el.setPointerCapture(event.pointerId);el.classList.add('engaged');audio.unlock();move(event);
    });
    el.addEventListener('pointermove',move);
    const release=event=>{if(event.pointerId!==stick.id)return;stick.id=null;stick.x=stick.y=0;el.classList.remove('engaged');el.querySelector('.stick-knob').style.transform='translate(-50%, -50%)';};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);
  }
  $('touch-reload').onclick=()=>{if(race?.phase==='racing')mouse.reloadQueued=true;};
  $('touch-fullscreen').onclick=()=>{resetTouch();if(document.fullscreenElement){ownFullscreen=false;document.exitFullscreen?.().catch(()=>{});}else enterFullscreen();};
  window.addEventListener('resize',resetTouch);
  window.addEventListener('orientationchange',resetTouch);
  document.addEventListener('fullscreenchange',()=>{resetTouch();if(!document.fullscreenElement&&screen==='race')pauseRace();});
  const aimPointer=event=>{
    if(event.pointerType==='touch')return;
    const box=$('game').getBoundingClientRect();
    mouse.x=(event.clientX-box.left)*480/box.width;mouse.y=(event.clientY-box.top)*300/box.height;mouse.active=true;
  };
  $('game').addEventListener('pointermove',aimPointer);
  $('game').addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||!race?.combat||race.phase!=='racing'||event.button!==0)return;
    event.preventDefault();aimPointer(event);mouse.down=true;mouse.queued=true;audio.unlock();$('game').setPointerCapture(event.pointerId);
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])$('game').addEventListener(name,()=>mouse.down=false);
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
    setText('start-copy',selected.mode==='trial'?'Hitta din linje, spara spurten och sätt ett nytt personbästa.':`Cup ${save.cup.stage+1}/3: pallplats på ${C.TRACKS[save.cup.stage].short}. Trimning: ${C.BUILDS[save.build].name}.`);
    setText('mode-copy',selected.mode==='trial'?'Jaga din egen spökhöna! Solo med standard-Greta. Ditt bästa lopp sparas som en spökhöna till nästa försök.':'Alla målgångar ger gårdsmynt. En pallplats ger medalj!');
    $('difficulty').disabled=selected.mode==='trial';
    $('combat-loadout')?.classList.toggle('hidden',selected.mode!=='combat');
    $('track-cards').classList.remove('hidden');
    setText('weapon-summary',C.WEAPONS[selected.weapon||'shotgun'].name+' · välj & uppgradera');
    if(selected.mode==='combat'){setText('session-summary','SKROTKRIGET · 2 VARV · MUSSIKTE');setText('start-copy','Fem stridsbanor. Fyra vapen. Rivalerna har egna vapen — välj ditt motdrag.');setText('mode-copy',`${save.combatMastery?.[selected.weapon]||0} målgångar med valt vapen. Vapenmästerskap: var tredje målgång med ett vapen ger 6 % snabbare omladdning, upp till nivå 3. Du tjänar gårdsmynt även här. Cupsteg påverkas inte.`);}
  }
  $('open-armory').onclick=()=>setView('armory');
  $('armory-back').onclick=()=>{setView('race');renderTracks();modeCopy();};
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
