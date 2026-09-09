const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const startPanel = document.getElementById("start-panel");
const finishPanel = document.getElementById("finish-panel");
const finishTitle = document.getElementById("finish-title");
const finishCopy = document.getElementById("finish-copy");
const finishStats = document.getElementById("finish-stats");
const pausePanel = document.getElementById("pause-panel");
const finishProgress = document.getElementById("finish-progress");
const recordTableBody = document.querySelector("#record-table tbody");
const soundToggle = document.getElementById("sound-toggle");
const musicToggle = document.getElementById("music-toggle");

const W = canvas.width, H = canvas.height;
const keys = new Set();
const sprites = {};
function loadSprite(name, source) {
  const image = new Image();
  image.onload = () => { sprites[name] = image; };
  image.onerror = () => console.warn(`Kunde inte ladda grafikresursen: ${source}`);
  image.src = source;
}
loadSprite("playerChicken", "assets/chicken/player-chicken-sheet.svg");
loadSprite("opponentChicken", "assets/opponents/opponent-chicken-sheet.svg");
loadSprite("hayBale", "assets/obstacles/hay-bale.svg");
loadSprite("mudPuddle", "assets/obstacles/mud-puddle.svg");
loadSprite("boostEgg", "assets/pickups/boost-egg.svg");
loadSprite("mudBomb", "assets/pickups/mud-bomb.svg");
const lapsToWin = 3;
const legendRecord = 42;
const visualStyle = {
  ink: "#35251d",
  paper: "#fff7e7",
  cream: "#fff0bd",
  shadow: "#4d3a2d",
  grass: "#9bc371",
  grassLight: "#a2c97a",
  grassDark: "#94bc6a",
  roadEdge: "#e3c98d",
  roadBorder: "#b88757",
  road: "#d3a76b",
  barnRed: "#b44732",
  hayGold: "#e3b35e",
  wood: "#8a5b36",
  leaf: "#3f7147",
  accentRed: "#d9654c",
  boostGold: "#e1a52f",
  mud: "#795238"
};
const baseVisualStyle = { ...visualStyle };
function pixelEdges() {
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";
}
function drawPixelShadow(x, y, width, height, offset = 4) {
  ctx.fillStyle = visualStyle.shadow;
  ctx.fillRect(Math.round(x - width / 2 + offset), Math.round(y - height / 2 + offset), width, height);
}
function drawPixelBadge(x, y, color) {
  pixelEdges();
  ctx.fillStyle = visualStyle.cream;
  ctx.fillRect(x - 18, y - 14, 36, 28);
  ctx.fillStyle = color;
  ctx.fillRect(x - 13, y - 10, 26, 20);
  ctx.fillStyle = visualStyle.cream;
  ctx.fillRect(x - 7, y - 7, 14, 4);
}
function drawPixelPanel(x, y, width, height, fill, border = visualStyle.ink) {
  pixelEdges();
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
}
const spriteAnimations = {
  idle: { frames: [0, 1, 2, 3], fps: 5 },
  run: { frames: [0, 1, 2, 3, 4, 5], fps: 12 },
  boost: { frames: [3, 4, 5], fps: 16 }
};
const chickenTypes = {
  original: { name: "Gårds-Greta", baseSpeed: 2.45, boostSpeed: 3.9, boostDuration: 2.6, gear: "farmer" },
  rocket: { name: "Raket-Ragnhild", baseSpeed: 2.75, boostSpeed: 4.8, boostDuration: 3.4, gear: "rocket" },
  armor: { name: "Pansar-Pär", baseSpeed: 2.25, boostSpeed: 3.6, boostDuration: 2.6, gear: "armor", resistance: true },
  bomber: { name: "Ägg-Bombaren", baseSpeed: 2.4, boostSpeed: 3.8, boostDuration: 2.6, gear: "bomber", startingItem: "muck" }
};
const difficulty = {
  easy: { speed: 1.45, wobble: .15 },
  normal: { speed: 1.75, wobble: .08 },
  hard: { speed: 2.02, wobble: .03 }
};
let route = [
  { x: 90, y: 250 }, { x: 200, y: 120 }, { x: 480, y: 82 },
  { x: 780, y: 130 }, { x: 970, y: 285 }, { x: 850, y: 480 },
  { x: 570, y: 570 }, { x: 270, y: 520 }, { x: 110, y: 390 }
];
let trackModel = {
  centerline: route,
  playableHalfWidth: 82,
  decorationClearance: 170,
  finishGateWidth: 126
};
let obstacles = [
  { x: 292, y: 160, type: "hay" }, { x: 620, y: 155, type: "hay" },
  { x: 825, y: 285, type: "mud" }, { x: 630, y: 465, type: "mud" },
  { x: 300, y: 425, type: "hay" }, { x: 175, y: 340, type: "mud" }
];
const pickups = [
  { x: 440, y: 102, type: "boost", active: true, respawnTimer: 0 },
  { x: 900, y: 385, type: "muck", active: true, respawnTimer: 0 },
  { x: 620, y: 110, type: "shield", active: true, respawnTimer: 0 },
  { x: 330, y: 510, type: "nutella", active: true, respawnTimer: 0 }
];
let pickupSpawnPoints = {
  boost: [{ x: 440, y: 102 }, { x: 585, y: 112 }, { x: 805, y: 165 }, { x: 265, y: 505 }],
  muck: [{ x: 900, y: 385 }, { x: 735, y: 485 }, { x: 205, y: 405 }, { x: 105, y: 285 }],
  shield: [{ x: 620, y: 110 }, { x: 850, y: 425 }, { x: 260, y: 120 }, { x: 570, y: 560 }],
  nutella: [{ x: 330, y: 510 }, { x: 760, y: 140 }, { x: 175, y: 390 }, { x: 700, y: 500 }]
};
const trackLayouts = {
  market: {
    name: "Björketorp marknad",
    route: route,
    obstacles,
    pickupSpawnPoints,
    palette: {}
  },
  meadow: {
    name: "Kladdis ängsslinga",
    route: [
      { x: 110, y: 220 }, { x: 260, y: 95 }, { x: 560, y: 75 },
      { x: 875, y: 145 }, { x: 965, y: 330 }, { x: 825, y: 520 },
      { x: 530, y: 595 }, { x: 245, y: 545 }, { x: 90, y: 390 }
    ],
    obstacles: [
      { x: 300, y: 130, type: "hay" }, { x: 675, y: 115, type: "mud" },
      { x: 865, y: 315, type: "hay" }, { x: 650, y: 520, type: "mud" },
      { x: 305, y: 500, type: "hay" }, { x: 145, y: 350, type: "mud" }
    ],
    pickupSpawnPoints: {
      boost: [{ x: 455, y: 88 }, { x: 760, y: 155 }, { x: 730, y: 515 }, { x: 210, y: 515 }],
      muck: [{ x: 915, y: 360 }, { x: 560, y: 570 }, { x: 150, y: 300 }, { x: 300, y: 105 }],
      shield: [{ x: 680, y: 105 }, { x: 880, y: 420 }, { x: 260, y: 115 }, { x: 530, y: 565 }],
      nutella: [{ x: 350, y: 520 }, { x: 790, y: 145 }, { x: 150, y: 390 }, { x: 700, y: 500 }]
    },
    palette: { grass: "#a7c985", grassLight: "#b6d795", grassDark: "#8fb873", roadEdge: "#ead59b", roadBorder: "#aa8150", road: "#c5a369" }
  },
  orchard: {
    name: "Äppellundens åttan",
    route: [
      { x: 120, y: 270 }, { x: 210, y: 115 }, { x: 445, y: 95 },
      { x: 555, y: 220 }, { x: 735, y: 95 }, { x: 940, y: 175 },
      { x: 985, y: 390 }, { x: 790, y: 520 }, { x: 585, y: 445 },
      { x: 430, y: 585 }, { x: 190, y: 535 }, { x: 80, y: 400 }
    ],
    obstacles: [
      { x: 255, y: 145, type: "mud" }, { x: 480, y: 155, type: "hay" },
      { x: 700, y: 145, type: "hay" }, { x: 900, y: 250, type: "mud" },
      { x: 780, y: 465, type: "hay" }, { x: 470, y: 520, type: "mud" },
      { x: 230, y: 470, type: "hay" }
    ],
    pickupSpawnPoints: {
      boost: [{ x: 330, y: 105 }, { x: 620, y: 145 }, { x: 900, y: 400 }, { x: 275, y: 535 }],
      muck: [{ x: 520, y: 205 }, { x: 850, y: 490 }, { x: 150, y: 430 }, { x: 210, y: 180 }],
      shield: [{ x: 390, y: 105 }, { x: 900, y: 350 }, { x: 215, y: 520 }, { x: 580, y: 430 }],
      nutella: [{ x: 530, y: 205 }, { x: 820, y: 500 }, { x: 180, y: 420 }, { x: 620, y: 95 }]
    },
    palette: { grass: "#93b878", grassLight: "#a8c987", grassDark: "#789f69", roadEdge: "#e2c188", roadBorder: "#9d7047", road: "#bd9562", leaf: "#47784a" }
  }
};
let actors = [], thrownObjects = [], mudBombs = [], particles = [], raceRunning = false, gamePaused = false, countdown = 0, pageVisible = true, raceTime = 0, lastTime = 0, selectedDifficulty = difficulty.normal, selectedChicken = chickenTypes.original, selectedTrack = trackLayouts.market;
let message = "", messageTimer = 0;
let raceEvent = { type: null, state: "idle", timer: 0, warning: 0 };
let tractor = { x: 0, y: 0, trackX: 0, trackY: 0, waypoint: 0, speed: .78, phase: 0, facing: 1 };
let audioContext = null, masterGain = null, musicTimer = null, musicStep = 0, musicTheme = "menu";
let soundEnabled = true, musicEnabled = true;
let raceAtmosphere = { weather: "clear", timeOfDay: "day", wind: 0, tint: "rgba(255,255,255,0)" };
let raceIntensity = 0, intensityLevel = 0, lastLapAnnounced = false;
let crowdEnergy = 0, crowdFocus = "start", crowdReactionTimer = 0;
let raceStartScene = { timer: 0, launched: false };
let finishScene = { active: false, timer: 0, winner: false };
let standingsSignature = "";
let lastIntensitySoundStep = -1;
const weatherProfiles = {
  clear: { name: "klar himmel", tint: "rgba(255,255,255,0)", music: 1 },
  cloudy: { name: "molnigt", tint: "rgba(120,145,160,.09)", music: .98 },
  drizzle: { name: "duggregn", tint: "rgba(105,150,170,.12)", music: .94 },
  golden: { name: "gyllene kväll", tint: "rgba(243,174,66,.15)", music: 1.02 }
};
const timeOfDayProfiles = {
  dawn: { tint: "rgba(244,178,106,.15)", sky: "#f6c27a" },
  day: { tint: "rgba(255,255,255,0)", sky: "#b7d9df" },
  golden: { tint: "rgba(239,155,49,.16)", sky: "#e9ae69" },
  dusk: { tint: "rgba(53,47,88,.22)", sky: "#6d729b" }
};
const musicThemes = {
  menu: { notes: [262, 330, 392, 523, 659, 523, 440, 392], bass: [131, 165, 196, 220], tempo: 220, wave: "square" },
  market: { notes: [262, 330, 392, 523, 392, 330, 294, 440], bass: [131, 165, 196, 147], tempo: 180, wave: "square" },
  meadow: { notes: [196, 247, 294, 392, 494, 392, 294, 247], bass: [98, 123, 147, 196], tempo: 260, wave: "triangle" },
  orchard: { notes: [330, 392, 494, 659, 587, 494, 370, 440], bass: [165, 196, 247, 185], tempo: 145, wave: "sawtooth" }
};
const personalityNames = { sprinter: "Sprinter", cautious: "Försiktig", bully: "Tuffing", steady: "Metodisk" };
let crowdTimer = 2;
let trackWarningCooldown = 0;
let crowdDialogueTimer = 2.5;
let crowdSpeech = null;
let crowdDialogueIndex = 0;
const crowdSpectators = [
  { x: 390, y: 210, color: "#d9654c", hat: "#e1a52f", mood: "angry" },
  { x: 430, y: 220, color: "#3f6b55", hat: "#b44732", mood: "shout" },
  { x: 590, y: 210, color: "#e1a32f", hat: "#48658c", mood: "angry" },
  { x: 640, y: 220, color: "#73506e", hat: "#d9654c", mood: "shout" },
  { x: 540, y: 180, color: "#48658c", hat: "#70a466", mood: "angry" }
];
const crowdDialogue = [
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
function initAudio() {
  if (audioContext) {
    if (audioContext.state === "suspended") audioContext.resume();
    return;
  }
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  audioContext = new AudioCtor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = .08;
  masterGain.connect(audioContext.destination);
  if (musicEnabled) startMusic();
}
function playTone(frequency, duration = .09, type = "square") {
  if (!audioContext || !masterGain || !soundEnabled) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.22, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  oscillator.connect(gain); gain.connect(masterGain);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
}
function startMusic() {
  if (!audioContext || !musicEnabled || musicTimer) return;
  const theme = musicThemes[musicTheme] || musicThemes.menu;
  const tick = () => {
    if (!musicEnabled || !audioContext) { musicTimer = null; return; }
    const step = musicStep++;
    playTone(theme.notes[step % theme.notes.length], .12, theme.wave);
    if (step % 2 === 0) playTone(theme.bass[(step / 2) % theme.bass.length], .18, "triangle");
    const atmosphereTempo = raceAtmosphere.weather ? weatherProfiles[raceAtmosphere.weather].music : 1;
    const intensityTempo = raceRunning ? 1 - raceIntensity * .14 : 1;
    musicTimer = setTimeout(tick, theme.tempo * atmosphereTempo * intensityTempo);
  };
  tick();
}
function playSfx(name) {
  if (!audioContext || !masterGain || !soundEnabled) return;
  const sounds = {
    pickup: [ [660, .06, "square"], [880, .08, "square"] ],
    boost: [ [220, .06, "sawtooth"], [330, .06, "sawtooth"], [523, .12, "square"] ],
    muck: [ [110, .12, "sawtooth"], [82, .16, "square"] ],
    shield: [ [392, .06, "triangle"], [587, .1, "triangle"] ],
    nutella: [ [294, .07, "square"], [370, .07, "square"], [494, .16, "sawtooth"] ],
    bump: [ [130, .06, "square"], [90, .1, "sawtooth"] ],
    bottle: [ [740, .04, "square"], [180, .12, "square"] ],
    tractor: [ [92, .18, "sawtooth"], [78, .2, "sawtooth"] ],
    lap: [ [523, .07, "square"], [659, .1, "square"] ],
    finish: [ [523, .08, "square"], [659, .08, "square"], [784, .18, "square"] ],
    start: [ [392, .08, "square"], [523, .08, "square"], [784, .16, "square"] ],
    cheer: [ [659, .05, "square"], [784, .05, "square"], [988, .1, "triangle"] ],
    lastLap: [ [440, .07, "square"], [659, .07, "square"], [880, .14, "square"] ],
    overtake: [ [330, .05, "square"], [494, .08, "square"] ]
  };
  const sequence = sounds[name];
  if (!sequence) return;
  sequence.forEach(([frequency, duration, type], index) => {
    setTimeout(() => playTone(frequency, duration, type), index * 55);
  });
}
function setMusicTheme(themeName) {
  musicTheme = musicThemes[themeName] ? themeName : "menu";
  musicStep = 0;
  if (musicTimer) {
    stopMusic();
    if (musicEnabled) startMusic();
  }
}
function stopMusic() {
  if (musicTimer) clearTimeout(musicTimer);
  musicTimer = null;
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function chooseRaceAtmosphere() {
  const trackIndex = Object.values(trackLayouts).indexOf(selectedTrack);
  const weatherChoices = selectedTrack === trackLayouts.orchard ? ["clear", "golden", "drizzle"] : ["clear", "cloudy", "drizzle", "golden"];
  const timeChoices = selectedTrack === trackLayouts.market ? ["day", "golden", "dusk"] : ["dawn", "day", "golden"];
  const weather = weatherChoices[(trackIndex + Math.floor(Math.random() * weatherChoices.length)) % weatherChoices.length];
  const timeOfDay = timeChoices[(trackIndex + Math.floor(Math.random() * timeChoices.length)) % timeChoices.length];
  raceAtmosphere = { weather, timeOfDay, wind: .3 + Math.random() * .7, tint: weatherProfiles[weather].tint };
}
function setCrowdMood(focus, energy = .25) {
  crowdFocus = focus;
  crowdEnergy = clamp(crowdEnergy + energy, 0, 1);
  crowdReactionTimer = 1.6;
}
function triggerCrowdReaction(type, actor = actors[0]) {
  if (!actor) return;
  const reactions = {
    start: ["NU KÖR VI!", "HÅLL I HATTEN!", "ÄGGSTRA FART!"],
    leader: ["HEJA LEDAREN!", "VILKEN FART!", "KLADDIS, SE UPP!", "Ingen når Kladdis nivå!", "Han åt Nutella och sprang ändå snabbare!"],
    overtake: ["SÅG NI DET?!", "FÖRBI PÅ UTSIDAN!", "BYT FIL, HÖNA!", "Emil hade luftmotstånd och vann ändå!", "Bumpstoppet försvann, men Kladdis fortsatte!"],
    hit: ["AJ, AJ, AJ!", "LERA PÅ FJÄDRARNA!", "DET DÄR SÅG DYRT UT!", "23018 kronor försvann när LubriKent lurade Emil!", "Kladdis ekonomi gick sönder, inte hans rekord!"],
    lastLap: ["SISTA VARVET!", "ALLT ELLER ÄGG!", "NU AVGÖRS DET!", "Kladdis är en gud på sista varvet!", "Ingen äter lika mycket Nutella som Emil!"],
    finish: ["MÅLGÅNG!", "HÖNSHJÄLTE!", "VILKEN FINAL!", "0:42 står fortfarande som Kladdis lag!", "Alla andra kör om andraplatsen!"]
  };
  const lines = reactions[type] || reactions.leader;
  const speaker = (crowdDialogueIndex + Math.floor(Math.random() * crowdSpectators.length)) % crowdSpectators.length;
  if (!crowdSpeech || crowdSpeech.timer <= 1) {
    crowdSpeech = { speaker, target: (speaker + 1) % crowdSpectators.length, text: lines[Math.floor(Math.random() * lines.length)], timer: type === "lastLap" ? 4.2 : 2.4 };
  }
  crowdDialogueTimer = type === "lastLap" ? 2.5 : 4.5;
  setCrowdMood(type, type === "hit" ? .16 : .32);
  if (type === "start" || type === "lastLap" || type === "finish") playSfx(type === "start" ? "start" : type === "lastLap" ? "lastLap" : "cheer");
}
function triggerRivalReaction(actor, type, text) {
  if (!actor || !actor.ai) return;
  const personalityText = {
    sprinter: { overtake: "Äsch! Fattas en växel!", hit: "Aj! Mina fjädrar!", powerup: "Nu blir det åka av!", lastLap: "Jag spurtar nu!" },
    cautious: { overtake: "Oj, var kom du ifrån?", hit: "Det där var inte planen.", powerup: "Försiktigt... men snabbt.", lastLap: "Jag håller linjen!" },
    bully: { overtake: "Flytta på dig!", hit: "Det var ditt fel!", powerup: "Min tur att stöka!", lastLap: "Ingen passerar mig!" },
    steady: { overtake: "Noterat.", hit: "Tillbaka på spåret.", powerup: "Taktiskt ägg.", lastLap: "Metodiskt mot mål." }
  };
  if (!actor.reactionTimer || actor.reactionTimer <= 1) {
    actor.reaction = text || personalityText[actor.personality]?.[type] || "Kackel!";
    actor.reactionTimer = type === "lastLap" ? 3 : 2.2;
  }
  actor.reactionType = type;
  if (type === "overtake" || type === "hit") addParticle(actor.x, actor.y, { height: 28, vz: .2, gravity: .01, life: .45, size: 3, color: type === "hit" ? "#d9654c" : "#f1cf58", shape: "confetti" });
}
function updateRaceIntensity(dt) {
  const player = actors[0];
  if (!player) return;
  const progress = clamp((getRaceProgress(player) / (route.length * lapsToWin)), 0, 1);
  const nextIntensity = clamp(progress * .72 + Math.min(1, raceTime / 90) * .28, 0, 1);
  raceIntensity += (nextIntensity - raceIntensity) * .05;
  const nextLevel = player.lap >= lapsToWin - 1 ? 3 : player.lap >= 1 ? 2 : 1;
  if (nextLevel !== intensityLevel) {
    intensityLevel = nextLevel;
    if (intensityLevel >= 2) setCrowdMood("race", .14);
  }
  if (player.lap >= lapsToWin - 1 && !lastLapAnnounced) {
    lastLapAnnounced = true;
    triggerCrowdReaction("lastLap", player);
    actors.slice(1).forEach(rival => triggerRivalReaction(rival, "lastLap"));
    message = "SISTA VARVET – ge järnet!";
    messageTimer = 1.8;
  }
}
function updateStandingsReactions() {
  if (actors.length < 2) return;
  const player = actors[0];
  const signature = actors.slice().sort((a, b) => getRaceProgress(b) - getRaceProgress(a)).map(actor => actor.name).join("|");
  if (standingsSignature) {
    const previous = standingsSignature.split("|");
    const current = signature.split("|");
    const wasLeader = previous[0] === player.name;
    const isLeader = current[0] === player.name;
    if (!wasLeader && isLeader) triggerCrowdReaction("leader", player);
    actors.slice(1).forEach(rival => {
      const wasAhead = previous.indexOf(rival.name) < previous.indexOf(player.name);
      const isAhead = current.indexOf(rival.name) < current.indexOf(player.name);
      if (!wasAhead && isAhead) {
        triggerRivalReaction(rival, "overtake");
        triggerCrowdReaction("overtake", rival);
      } else if (wasAhead && !isAhead) {
        triggerRivalReaction(rival, "overtake", "Du hann ikapp mig?!");
        triggerCrowdReaction("overtake", player);
      }
    });
  }
  standingsSignature = signature;
}
function updateDynamicAudio(dt) {
  if (!audioContext || !soundEnabled || !raceRunning || countdown > 0) return;
  if (crowdReactionTimer > 0) crowdReactionTimer -= dt / 60;
  if (intensityLevel >= 3 && musicTimer && musicStep % 16 === 0 && musicStep !== lastIntensitySoundStep) {
    lastIntensitySoundStep = musicStep;
    playTone(1046, .045, "square");
  }
}
function setAudioButton(button, enabled, label) {
  button.setAttribute("aria-pressed", String(enabled));
  button.textContent = `${enabled ? label === "Ljud" ? "🔊" : "♫" : "🔇"} ${label}`;
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  setAudioButton(soundToggle, soundEnabled, "Ljud");
  if (soundEnabled) { initAudio(); playTone(660, .1); }
}
function toggleMusic() {
  musicEnabled = !musicEnabled;
  setAudioButton(musicToggle, musicEnabled, "Musik");
  if (musicEnabled) { initAudio(); startMusic(); } else stopMusic();
}

function configureTrack(layout) {
  route = layout.route;
  trackModel.centerline = route;
  obstacles = layout.obstacles;
  pickupSpawnPoints = layout.pickupSpawnPoints;
  Object.assign(visualStyle, baseVisualStyle, layout.palette);
  pickups.forEach(pickup => {
    const point = pickupSpawnPoints[pickup.type][0];
    pickup.x = point.x;
    pickup.y = point.y;
  });
}

function newRace() {
  initAudio();
  chooseRaceAtmosphere();
  setMusicTheme(selectedTrack === trackLayouts.market ? "market" : selectedTrack === trackLayouts.meadow ? "meadow" : "orchard");
  configureTrack(selectedTrack);
  raceIntensity = 0;
  intensityLevel = 0;
  lastLapAnnounced = false;
  crowdEnergy = .28;
  crowdFocus = "start";
  crowdReactionTimer = 2.5;
  raceStartScene = { timer: 3, launched: false };
  finishScene = { active: false, timer: 0, winner: false };
  standingsSignature = "";
  lastIntensitySoundStep = -1;
  actors = [
    { name: selectedChicken.name, color: "#f5e5a4", sprite: "playerChicken", animTime: 0, x: 110, y: 300, angle: 0, facing: 1, speed: 0, lap: 0, waypoint: 0, finishArmed: false, boost: 0, nutella: 0, sticky: 0, shield: false, item: selectedChicken.startingItem || null, player: true, obstacleCooldown: 0, slowTimer: 0, dazed: 0, chickenType: selectedChicken },
    { name: "Agda", color: "#b44732", scarf: "#e1a52f", raceLook: "commando", personality: "steady", sprite: "opponentChicken", animTime: 0, x: 125, y: 330, angle: 0, facing: 1, speed: selectedDifficulty.speed, baseSpeed: selectedDifficulty.speed, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 1, obstacleCooldown: 0, slowTimer: 0, dazed: 0 },
    { name: "Berta", color: "#3f7147", scarf: "#70a466", raceLook: "ranger", personality: "sprinter", sprite: "opponentChicken", animTime: 0, x: 140, y: 360, angle: 0, facing: 1, speed: selectedDifficulty.speed * .96, baseSpeed: selectedDifficulty.speed * .96, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 2, obstacleCooldown: 0, slowTimer: 0, dazed: 0 },
    { name: "Cilla", color: "#73506e", scarf: "#73506e", raceLook: "heavy", personality: "bully", sprite: "opponentChicken", animTime: 0, x: 155, y: 390, angle: 0, facing: 1, speed: selectedDifficulty.speed * .93, baseSpeed: selectedDifficulty.speed * .93, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 3, obstacleCooldown: 0, slowTimer: 0, dazed: 0 },
    { name: "Doris", color: "#48658c", scarf: "#48658c", raceLook: "scout", personality: "cautious", sprite: "opponentChicken", animTime: 0, x: 170, y: 420, angle: 0, facing: 1, speed: selectedDifficulty.speed * .9, baseSpeed: selectedDifficulty.speed * .9, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 4, obstacleCooldown: 0, slowTimer: 0, dazed: 0 }
  ];
  pickups.forEach(p => { p.active = true; p.respawnTimer = 0; });
  thrownObjects = [];
  mudBombs = [];
  particles = [];
  raceTime = 0;
  crowdTimer = 2;
  crowdDialogueTimer = 1.5;
  crowdSpeech = null;
  crowdDialogueIndex = 0;
  trackWarningCooldown = 0;
  raceEvent = { type: null, state: "idle", timer: 12 + Math.random() * 6, warning: 0 };
  tractor = { x: route[2].x, y: route[2].y, trackX: route[2].x, trackY: route[2].y, waypoint: 2, speed: .78, phase: Math.random() * Math.PI * 2, facing: 1 };
  countdown = 3;
  gamePaused = false;
  pausePanel.classList.add("hidden");
  message = "Följ vägen och kör tre hela varv";
  messageTimer = 3;
  raceRunning = true;
  triggerCrowdReaction("start", actors[0]);
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function iso(x, y) { return { x: W / 2 + (x - y) * .75, y: 65 + (x + y) * .39 }; }
function drawPath(points, width, color) {
  ctx.beginPath();
  points.forEach((p, i) => { const q = iso(p.x, p.y); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
  ctx.closePath(); pixelEdges(); ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
}
function drawWorld() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = visualStyle.grass; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 32) for (let y = 0; y < H; y += 32) {
    ctx.fillStyle = (x / 32 + y / 32) % 2 ? visualStyle.grassDark : visualStyle.grassLight; ctx.globalAlpha = .32; ctx.fillRect(x, y, 16, 16);
  }
  ctx.globalAlpha = 1; drawPath(route, 210, visualStyle.roadEdge); drawPath(route, 170, visualStyle.roadBorder);
  drawPath(route, 145, visualStyle.road);
  drawFinishLine();
  drawDecorations(); drawMarket(); drawHumorousDetails(); drawCrowd();
}
function drawParticles() {
  particles.forEach(particle => {
    const q = iso(particle.x, particle.y);
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    if (particle.shape === "confetti") {
      ctx.save(); ctx.translate(q.x, q.y - particle.height); ctx.rotate(particle.rotation);
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.8); ctx.restore();
    } else {
      const size = Math.max(2, Math.round(particle.size * 2));
      ctx.fillRect(Math.round(q.x - size / 2), Math.round(q.y - particle.height - size / 2), size, size);
    }
  });
  ctx.globalAlpha = 1;
}
function addParticle(x, y, options = {}) {
  particles.push({
    x, y, vx: options.vx || 0, vy: options.vy || 0, height: options.height || 0,
    vz: options.vz || 0, gravity: options.gravity || 0, life: options.life || .5,
    maxLife: options.life || .5, size: options.size || 3, color: options.color || "#d3a76b",
    shape: options.shape || "circle", rotation: Math.random() * Math.PI
  });
}
function updateParticles(dt) {
  particles.forEach(particle => {
    particle.x += particle.vx * dt; particle.y += particle.vy * dt;
    particle.height += particle.vz * dt; particle.vz -= particle.gravity * dt;
    particle.rotation += .08 * dt; particle.life -= dt / 60;
  });
  particles = particles.filter(particle => particle.life > 0);
}
function drawFinishLine() {
  const start = iso(route[0].x, route[0].y);
  const before = iso(route[route.length - 1].x, route[route.length - 1].y);
  const after = iso(route[1].x, route[1].y);
  const tangentX = after.x - before.x, tangentY = after.y - before.y;
  const length = Math.hypot(tangentX, tangentY);
  const normalX = -tangentY / length, normalY = tangentX / length;
  const alongX = tangentX / length, alongY = tangentY / length;
  const width = trackModel.finishGateWidth, depth = 18, tiles = 8;
  for (let i = 0; i < tiles; i++) {
    const across = -width / 2 + i * width / tiles;
    const centerX = start.x + normalX * across;
    const centerY = start.y + normalY * across;
    ctx.fillStyle = i % 2 === 0 ? "#fff8dc" : "#35251d";
    ctx.beginPath();
    ctx.moveTo(centerX - normalX * width / tiles / 2 - alongX * depth / 2, centerY - normalY * width / tiles / 2 - alongY * depth / 2);
    ctx.lineTo(centerX + normalX * width / tiles / 2 - alongX * depth / 2, centerY + normalY * width / tiles / 2 - alongY * depth / 2);
    ctx.lineTo(centerX + normalX * width / tiles / 2 + alongX * depth / 2, centerY + normalY * width / tiles / 2 + alongY * depth / 2);
    ctx.lineTo(centerX - normalX * width / tiles / 2 + alongX * depth / 2, centerY - normalY * width / tiles / 2 + alongY * depth / 2);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = "#35251d"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(start.x - normalX * width / 2 - alongX * depth / 2, start.y - normalY * width / 2 - alongY * depth / 2); ctx.lineTo(start.x + normalX * width / 2 - alongX * depth / 2, start.y + normalY * width / 2 - alongY * depth / 2); ctx.stroke();
  ctx.textAlign = "left";
}
function drawDecorations() {
  const trees = [
    { x: 20, y: 20 }, { x: 150, y: 20 }, { x: 1080, y: 25 }, { x: 960, y: 10 },
    { x: 1080, y: 680 }, { x: 930, y: 700 }, { x: 15, y: 680 }, { x: 10, y: 450 },
    { x: 520, y: 700 }, { x: 300, y: 700 }, { x: 1090, y: 420 }, { x: 5, y: 250 }
  ];
  trees.filter(tree => isSafeDecorationPosition(tree.x, tree.y)).forEach(tree => {
    const q = iso(tree.x, tree.y);
    ctx.fillStyle = "#5a432d"; ctx.fillRect(q.x - 6, q.y - 3, 12, 28);
    ctx.fillStyle = "#315f3d"; ctx.fillRect(q.x - 23, q.y - 36, 46, 28); ctx.fillRect(q.x - 16, q.y - 43, 32, 7);
    ctx.fillStyle = "#4f8148"; ctx.fillRect(q.x - 29, q.y - 27, 12, 15); ctx.fillRect(q.x + 17, q.y - 27, 12, 15); ctx.fillRect(q.x - 13, q.y - 48, 26, 12);
    ctx.fillStyle = "#e7b64b"; ctx.fillRect(q.x - 4, q.y - 30, 5, 5); ctx.fillRect(q.x + 13, q.y - 18, 4, 4);
  });
  const bushes = [
    { x: 75, y: 35 }, { x: 230, y: 25 }, { x: 420, y: 15 }, { x: 820, y: 15 },
    { x: 1010, y: 90 }, { x: 1070, y: 300 }, { x: 1050, y: 620 }, { x: 770, y: 690 },
    { x: 410, y: 690 }, { x: 230, y: 675 }, { x: 35, y: 610 }, { x: 25, y: 180 }
  ];
  bushes.filter(bush => isSafeDecorationPosition(bush.x, bush.y, 135)).forEach(drawBush);
  const flowers = [{ x: 245, y: 85 }, { x: 740, y: 95 }, { x: 920, y: 460 }, { x: 235, y: 575 }, { x: 75, y: 430 }];
  flowers.forEach(flower => {
    const q = iso(flower.x, flower.y);
    ctx.strokeStyle = "#4e824b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y + 5); ctx.lineTo(q.x, q.y - 7); ctx.stroke();
    ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 4, q.y - 10, 4, 4); ctx.fillStyle = "#f1cf58"; ctx.fillRect(q.x, q.y - 10, 4, 4);
  });
  drawFence(350, 65, 520, 65); drawFence(90, 470, 90, 535);
  [{ x: 340, y: 90 }, { x: 770, y: 555 }, { x: 1000, y: 350 }].forEach(crate => {
    const q = iso(crate.x, crate.y);
    ctx.fillStyle = "#9a6338"; ctx.fillRect(q.x - 9, q.y - 10, 18, 15);
    ctx.strokeStyle = "#633f2b"; ctx.lineWidth = 2; ctx.strokeRect(q.x - 9, q.y - 10, 18, 15);
    ctx.beginPath(); ctx.moveTo(q.x - 8, q.y - 9); ctx.lineTo(q.x + 8, q.y + 4); ctx.moveTo(q.x + 8, q.y - 9); ctx.lineTo(q.x - 8, q.y + 4); ctx.stroke();
  });
  [{ x: 70, y: 175 }, { x: 1020, y: 185 }, { x: 760, y: 585 }].forEach(pumpkin => {
    const q = iso(pumpkin.x, pumpkin.y);
    ctx.fillStyle = "#d97932"; ctx.fillRect(q.x - 10, q.y - 6, 20, 12); ctx.fillRect(q.x - 6, q.y - 9, 12, 18);
    ctx.fillStyle = "#5b813f"; ctx.fillRect(q.x - 2, q.y - 10, 4, 4);
  });
  if (isSafeDecorationPosition(180, 170, 210)) drawFarmPlot(180, 170, 255, 205);
  if (isSafeDecorationPosition(780, 365, 210)) drawFarmPlot(780, 365, 900, 415);
  if (isSafeDecorationPosition(995, 420, 180)) drawBarrel(995, 420, "#6f8d91");
  if (isSafeDecorationPosition(275, 575, 180)) drawBarrel(275, 575, "#9a6338");
  if (isSafeDecorationPosition(285, 260, 170)) drawMarketSign(285, 260, "ÄGG");
  if (isSafeDecorationPosition(735, 235, 170)) drawMarketSign(735, 235, "HÖ");
  drawOuterBanners();
  if (isSafeDecorationPosition(100, 40, 120)) drawBarn(100, 40);
  if (isSafeDecorationPosition(180, 690, 135)) drawPitGarage(180, 690);
  [
    { x: 80, y: 100, color: "#d9654c" }, { x: 1020, y: 480, color: "#f1cf58" },
    { x: 430, y: 680, color: "#70a466" }, { x: 980, y: 650, color: "#d9654c" }
  ].filter(item => isSafeDecorationPosition(item.x, item.y, 150)).forEach(item => drawFlowerPatch(item.x, item.y, item.color));
  drawTrackSpecificDecorations();
  drawBackgroundLife();
}
function drawTrackSpecificDecorations() {
  if (selectedTrack === trackLayouts.meadow) {
    if (isSafeDecorationPosition(955, 70, 150)) drawWindmill(955, 70);
    if (isSafeDecorationPosition(350, 640, 135)) drawScarecrow(350, 640);
    if (isSafeDecorationPosition(710, 650, 135)) drawScarecrow(710, 650);
    if (isSafeDecorationPosition(55, 535, 145)) drawHayCart(55, 535);
    return;
  }
  if (selectedTrack === trackLayouts.orchard) {
    if (isSafeDecorationPosition(45, 95, 145)) drawAppleTree(45, 95);
    if (isSafeDecorationPosition(1035, 90, 145)) drawAppleTree(1035, 90);
    if (isSafeDecorationPosition(1035, 565, 145)) drawAppleTree(1035, 565);
    if (isSafeDecorationPosition(335, 650, 135)) drawAppleBasket(335, 650);
    if (isSafeDecorationPosition(70, 575, 135)) drawAppleBasket(70, 575);
  }
}
function drawWindmill(x, y) {
  const q = iso(x, y);
  ctx.fillStyle = "#8a5b36"; ctx.fillRect(q.x - 7, q.y - 68, 14, 68);
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(q.x - 22, q.y - 82, 44, 22);
  ctx.strokeStyle = "#35251d"; ctx.lineWidth = 3; ctx.strokeRect(q.x - 22, q.y - 82, 44, 22);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 13, q.y - 75, 26, 7);
  ctx.strokeStyle = "#70412f"; ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const angle = performance.now() / 900 + i * Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(q.x, q.y - 70); ctx.lineTo(q.x + Math.cos(angle) * 28, q.y - 70 + Math.sin(angle) * 28); ctx.stroke();
  }
}
function drawScarecrow(x, y) {
  const q = iso(x, y);
  ctx.strokeStyle = "#70412f"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(q.x, q.y - 42); ctx.lineTo(q.x, q.y + 8); ctx.moveTo(q.x - 24, q.y - 27); ctx.lineTo(q.x + 24, q.y - 27); ctx.stroke();
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 14, q.y - 23, 28, 22);
  ctx.fillStyle = "#f2c497"; ctx.fillRect(q.x - 10, q.y - 42, 20, 16);
  ctx.fillStyle = "#e1a52f"; ctx.fillRect(q.x - 15, q.y - 47, 30, 5);
  ctx.fillStyle = "#35251d"; ctx.fillRect(q.x - 5, q.y - 36, 3, 3); ctx.fillRect(q.x + 3, q.y - 36, 3, 3);
}
function drawHayCart(x, y) {
  const q = iso(x, y);
  ctx.fillStyle = "#70412f"; ctx.fillRect(q.x - 28, q.y - 20, 56, 24);
  ctx.fillStyle = "#e3b35e"; ctx.fillRect(q.x - 22, q.y - 31, 44, 15);
  ctx.fillStyle = "#35251d"; ctx.fillRect(q.x - 26, q.y + 1, 16, 15); ctx.fillRect(q.x + 10, q.y + 1, 16, 15);
  ctx.strokeStyle = "#8a5b36"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x + 27, q.y - 8); ctx.lineTo(q.x + 43, q.y - 18); ctx.stroke();
}
function drawAppleTree(x, y) {
  const q = iso(x, y);
  ctx.fillStyle = "#70412f"; ctx.fillRect(q.x - 7, q.y - 32, 14, 38);
  ctx.fillStyle = "#315f3d"; ctx.fillRect(q.x - 31, q.y - 65, 62, 38);
  ctx.fillStyle = "#4f8148"; ctx.fillRect(q.x - 40, q.y - 48, 24, 20); ctx.fillRect(q.x + 16, q.y - 50, 24, 22);
  ctx.fillStyle = "#d9654c"; [ [-20, -49], [5, -60], [21, -37], [-4, -32] ].forEach(([dx, dy]) => ctx.fillRect(q.x + dx, q.y + dy, 7, 7));
}
function drawAppleBasket(x, y) {
  const q = iso(x, y);
  ctx.fillStyle = "#8a5b36"; ctx.fillRect(q.x - 20, q.y - 14, 40, 17);
  ctx.strokeStyle = "#e1a52f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q.x - 17, q.y - 11); ctx.lineTo(q.x - 12, q.y - 19); ctx.lineTo(q.x + 12, q.y - 19); ctx.lineTo(q.x + 17, q.y - 11); ctx.stroke();
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 12, q.y - 17, 7, 7); ctx.fillRect(q.x + 4, q.y - 18, 7, 7);
}
function drawBush(bush) {
  const q = iso(bush.x, bush.y);
  ctx.fillStyle = "#315f3d"; ctx.fillRect(q.x - 18, q.y - 14, 36, 18);
  ctx.fillStyle = "#4f8148"; ctx.fillRect(q.x - 25, q.y - 8, 14, 11); ctx.fillRect(q.x + 11, q.y - 8, 14, 11);
  ctx.fillStyle = "#6d9a4e"; ctx.fillRect(q.x - 10, q.y - 19, 12, 7); ctx.fillRect(q.x + 4, q.y - 15, 11, 7);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 4, q.y - 11, 5, 5);
}
function drawOuterBanners() {
  const colors = ["#d9654c", "#f1cf58", "#70a466", "#d9654c", "#f1cf58", "#70a466"];
  const flap = Math.sin(performance.now() / 210) * (3 + raceAtmosphere.wind * 5);
  colors.forEach((color, index) => {
    const x = 330 + index * 58;
    ctx.fillStyle = "#8a5b36"; ctx.fillRect(x, 28, 3, 22);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 3, 30); ctx.lineTo(x + 33 + flap, 37); ctx.lineTo(x + 3, 44); ctx.closePath(); ctx.fill();
  });
}
function drawFlowerPatch(x, y, color) {
  const q = iso(x, y);
  ctx.fillStyle = "#4e824b"; ctx.fillRect(q.x - 2, q.y - 11, 4, 15);
  ctx.fillStyle = color; ctx.fillRect(q.x - 8, q.y - 15, 7, 7); ctx.fillRect(q.x + 2, q.y - 15, 7, 7);
  ctx.fillStyle = "#f1cf58"; ctx.fillRect(q.x - 2, q.y - 10, 5, 5);
}
function drawPitGarage(x, y) {
  const q = iso(x, y);
  ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1.35, 1.35);
  ctx.fillStyle = "#70412f"; ctx.fillRect(-68, -48, 136, 53);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(-62, -43, 124, 47);
  ctx.fillStyle = "#7c3028"; ctx.beginPath(); ctx.moveTo(-78, -43); ctx.lineTo(0, -86); ctx.lineTo(78, -43); ctx.closePath(); ctx.fill();
  ctx.fillStyle = visualStyle.ink; ctx.fillRect(-42, -28, 84, 32);
  ctx.fillStyle = "#f1cf58"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText("DEPÅ", 0, -61);
  ctx.fillStyle = "#9a6338"; ctx.fillRect(-58, -18, 12, 12); ctx.fillRect(46, -18, 12, 12);
  ctx.fillStyle = "#35251d"; ctx.fillRect(-40, 2, 20, 18); ctx.fillRect(21, 2, 20, 18);
  ctx.fillStyle = "#e1a52f"; ctx.fillRect(-4, -13, 8, 15);
  ctx.restore();
  drawPitCrew(q.x - 62, q.y - 7, "#48658c");
  drawPitCrew(q.x + 55, q.y - 5, "#e1a52f");
  drawPitChicken(q.x, q.y - 13);
}
function drawPitCrew(x, y, color, name) {
  ctx.fillStyle = "#4d3a2d"; ctx.fillRect(x - 10, y + 1, 20, 5);
  ctx.fillStyle = color; ctx.fillRect(x - 9, y - 18, 18, 21);
  ctx.fillStyle = visualStyle.cream; ctx.fillRect(x - 7, y - 13, 14, 4);
  ctx.fillStyle = "#f2c497"; ctx.fillRect(x - 7, y - 29, 14, 11);
  ctx.fillStyle = "#35251d"; ctx.fillRect(x - 10, y - 32, 20, 5);
  ctx.fillStyle = "#e1a52f"; ctx.fillRect(x - 7, y - 35, 14, 3);
  ctx.fillStyle = "#35251d"; ctx.fillRect(x - 4, y - 25, 3, 3); ctx.fillRect(x + 3, y - 25, 3, 3);
  ctx.fillStyle = "#b44732"; ctx.fillRect(x - 3, y - 20, 7, 3);
  if (name) {
    ctx.fillStyle = "#fff0bd"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillText(name, x, y + 11); ctx.textAlign = "left";
  }
  ctx.strokeStyle = "#8a5b36"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 7, y - 8); ctx.lineTo(x + 18, y - 17); ctx.stroke();
  ctx.fillStyle = "#d6a33e"; ctx.fillRect(x + 16, y - 21, 7, 7); ctx.fillRect(x + 18, y - 24, 3, 3);
}
function drawPitChicken(x, y) {
  const bob = Math.sin(performance.now() / 180) * 2;
  ctx.save(); ctx.translate(x, y + bob); ctx.fillStyle = "#4d3a2d"; ctx.fillRect(-18, 5, 36, 5);
  ctx.fillStyle = "#f5e5a4"; ctx.fillRect(-17, -12, 34, 19);
  ctx.fillStyle = "#fff8dc"; ctx.fillRect(-10, -8, 12, 11); ctx.fillRect(-5, -20, 18, 15);
  ctx.fillStyle = "#d64d37"; ctx.fillRect(8, -27, 8, 7); ctx.fillRect(13, -32, 5, 5);
  ctx.fillStyle = "#35251d"; ctx.fillRect(14, -18, 3, 3); ctx.fillRect(-1, -15, 3, 3);
  ctx.fillStyle = "#e3a52d"; ctx.fillRect(17, -14, 11, 5);
  ctx.fillStyle = "#f1cf58"; ctx.fillRect(-9, -27, 14, 4);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(-20, -8, 5, 12);
  ctx.fillStyle = "#e3a52d"; ctx.fillRect(-10, 7, 5, 8); ctx.fillRect(6, 7, 5, 8);
  ctx.restore();
}
function drawBackgroundLife() {
  const now = performance.now();
  const wave = Math.sin(now / 350) * 3;
  for (let bird = 0; bird < 3; bird++) {
    const birdX = (now / (28 + bird * 7) + bird * 320) % (W + 100) - 50;
    const birdY = 55 + bird * 25 + Math.sin(now / 240 + bird) * 9;
    ctx.fillStyle = bird === 1 ? "#fff0bd" : "#35251d";
    ctx.fillRect(birdX, birdY, 5, 3); ctx.fillRect(birdX + 9, birdY + (Math.sin(now / 100 + bird) > 0 ? -3 : 2), 5, 3);
  }
  const q = iso(700, 35);
  ctx.fillStyle = "#8a5b36"; ctx.fillRect(q.x - 2, q.y - 18, 4, 18);
  ctx.fillStyle = "#d9654c"; ctx.beginPath(); ctx.moveTo(q.x + 2, q.y - 18); ctx.lineTo(q.x + 23, q.y - 13); ctx.lineTo(q.x + 2, q.y - 8); ctx.closePath(); ctx.fill();
  const barn = iso(100, 40);
  for (let i = 0; i < 3; i++) {
    const smokeX = barn.x + 18 + Math.sin(now / 500 + i) * 5;
    const smokeY = barn.y - 92 - i * 14 - (now / 90 + i * 8) % 12;
    ctx.fillStyle = i === 1 ? "#d4c49b" : "#e7d9b7"; ctx.fillRect(smokeX, smokeY, 9, 7); ctx.fillRect(smokeX + 5, smokeY - 4, 7, 6);
  }
  const cloudX = (now / 45) % 1250 - 120;
  ctx.fillStyle = "#dce8bd"; ctx.fillRect(cloudX, 92, 46, 8); ctx.fillRect(cloudX + 12, 84, 32, 8); ctx.fillRect(cloudX + 36, 89, 30, 11);
  ctx.fillStyle = "#f1cf58"; ctx.fillRect(52, 95, 6, 6); ctx.fillRect(62, 95, 6, 6);
  const livestock = [{ x: 80, y: 610, color: "#fff0bd" }, { x: 1010, y: 105, color: "#d9654c" }];
  livestock.filter(animal => isSafeDecorationPosition(animal.x, animal.y, 140)).forEach((animal, index) => {
    const animalQ = iso(animal.x, animal.y);
    const trot = Math.sin(now / (170 + index * 40)) * 3;
    ctx.fillStyle = "#4d3a2d"; ctx.fillRect(animalQ.x - 15 + trot, animalQ.y - 5, 30, 13);
    ctx.fillStyle = animal.color; ctx.fillRect(animalQ.x - 13 + trot, animalQ.y - 16, 24, 17);
    ctx.fillStyle = "#35251d"; ctx.fillRect(animalQ.x + 9 + trot, animalQ.y - 14, 11, 10);
    ctx.fillRect(animalQ.x - 8 + trot, animalQ.y + 7, 4, 9); ctx.fillRect(animalQ.x + 8 + trot, animalQ.y + 7, 4, 9);
  });
  if (selectedTrack === trackLayouts.orchard) {
    const appleDrop = (now / 220) % 3;
    const applePositions = [[45, 95], [1035, 90], [1035, 565]];
    applePositions.forEach(([x, y], index) => {
      const appleQ = iso(x, y);
      const drop = (appleDrop + index * .8) % 3;
      ctx.fillStyle = "#d9654c"; ctx.fillRect(appleQ.x + 22 + drop * 4, appleQ.y - 48 + drop * 12, 6, 6);
      ctx.fillStyle = "#4f8148"; ctx.fillRect(appleQ.x + 28 + drop * 4, appleQ.y - 52 + drop * 12, 4, 4);
    });
  }
  for (let i = 0; i < 4; i++) {
    const dustX = (now / (95 + i * 15) + i * 210) % 1080;
    const dustY = 630 + Math.sin(now / 350 + i) * 6;
    ctx.globalAlpha = .14;
    ctx.fillStyle = "#e7d9b7"; ctx.fillRect(dustX, dustY, 18, 5); ctx.fillRect(dustX + 8, dustY - 5, 12, 5);
  }
  ctx.globalAlpha = 1;
}
function drawBarn(x, y) {
  const q = iso(x, y);
  ctx.fillStyle = "#70412f"; ctx.fillRect(q.x - 52, q.y - 48, 104, 62);
  ctx.fillStyle = "#b44732"; ctx.fillRect(q.x - 47, q.y - 43, 94, 54);
  ctx.fillStyle = "#7c3028"; ctx.beginPath(); ctx.moveTo(q.x - 62, q.y - 43); ctx.lineTo(q.x, q.y - 82); ctx.lineTo(q.x + 62, q.y - 43); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 19, q.y - 4, 38, 34);
  ctx.strokeStyle = "#35251d"; ctx.lineWidth = 3; ctx.strokeRect(q.x - 19, q.y - 4, 38, 34);
  ctx.beginPath(); ctx.moveTo(q.x - 19, q.y - 4); ctx.lineTo(q.x + 19, q.y + 30); ctx.moveTo(q.x + 19, q.y - 4); ctx.lineTo(q.x - 19, q.y + 30); ctx.stroke();
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(q.x - 38, q.y - 31, 15, 12); ctx.fillRect(q.x + 23, q.y - 31, 15, 12);
}
function drawTractor(x, y, facing = 1) {
  const q = iso(x, y);
  ctx.save(); ctx.translate(q.x, q.y - 5); ctx.scale(facing, 1);
  drawPixelShadow(0, 17, 92, 18, 4);
  ctx.fillStyle = visualStyle.ink; ctx.fillRect(-37, -3, 34, 29); ctx.fillRect(10, 2, 25, 24);
  ctx.fillStyle = "#8d9290"; ctx.fillRect(-29, 4, 17, 14); ctx.fillRect(16, 7, 13, 12);
  ctx.fillStyle = visualStyle.barnRed; ctx.fillRect(-28, -13, 52, 25);
  ctx.fillStyle = visualStyle.accentRed; ctx.fillRect(-6, -38, 29, 27);
  ctx.fillStyle = "#9cc0bd"; ctx.fillRect(-1, -34, 19, 14);
  ctx.strokeStyle = visualStyle.ink; ctx.lineWidth = 2; ctx.strokeRect(-1, -34, 19, 14);
  ctx.fillStyle = "#f1cf58"; ctx.fillRect(-31, -8, 11, 7); ctx.fillRect(7, -8, 10, 6);
  ctx.fillStyle = visualStyle.ink; ctx.fillRect(10, -47, 5, 10);
  ctx.fillStyle = "#e1a52f"; ctx.fillRect(6, -51, 14, 4);
  ctx.fillStyle = "#d6a33e"; ctx.fillRect(-19, -20, 29, 5);
  ctx.strokeStyle = visualStyle.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(52, 14); ctx.lineTo(69, 6); ctx.stroke();
  ctx.fillStyle = visualStyle.wood; ctx.fillRect(48, 5, 39, 22);
  ctx.fillStyle = "#70a466"; ctx.fillRect(54, 1, 23, 7);
  ctx.strokeStyle = "#d6a33e"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(52, 10); ctx.lineTo(81, 25); ctx.moveTo(65, 8); ctx.lineTo(85, 19); ctx.stroke();
  ctx.fillStyle = visualStyle.cream; ctx.font = "700 8px monospace"; ctx.textAlign = "center"; ctx.fillText("BONDE", 0, 35);
  ctx.restore(); ctx.textAlign = "left";
}
function drawFarmPlot(x1, y1, x2, y2) {
  const a = iso(x1, y1), b = iso(x2, y2);
  ctx.fillStyle = "#80603b"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + 24, b.y + 10); ctx.lineTo(a.x + 24, a.y + 10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#aa7c43"; ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const t = i / 5, sx = a.x + (b.x - a.x) * t, sy = a.y + (b.y - a.y) * t;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 20, sy + 8); ctx.stroke();
    ctx.fillStyle = i % 2 ? "#6c9347" : "#7da24d"; ctx.fillRect(sx + 6, sy - 5, 5, 5); ctx.fillRect(sx + 13, sy - 2, 5, 5);
  }
}
function drawBarrel(x, y, color) {
  const q = iso(x, y);
  ctx.fillStyle = "#4d3a2d"; ctx.fillRect(q.x - 10, q.y - 16, 20, 22);
  ctx.fillStyle = color; ctx.fillRect(q.x - 8, q.y - 14, 16, 18);
  ctx.fillStyle = "#35251d"; ctx.fillRect(q.x - 10, q.y - 10, 20, 3); ctx.fillRect(q.x - 10, q.y, 20, 3);
}
function drawMarketSign(x, y, text) {
  const q = iso(x, y);
  ctx.fillStyle = "#8a5b36"; ctx.fillRect(q.x - 3, q.y - 2, 6, 30);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 27, q.y - 27, 54, 25);
  ctx.strokeStyle = "#35251d"; ctx.lineWidth = 3; ctx.strokeRect(q.x - 27, q.y - 27, 54, 25);
  ctx.fillStyle = "#fff0bd"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText(text, q.x, q.y - 10); ctx.textAlign = "left";
}
function drawBanner(x1, y1, x2, y2) {
  const a = iso(x1, y1), b = iso(x2, y2);
  ctx.strokeStyle = "#8a5b36"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y - 18); ctx.lineTo(b.x, b.y - 18); ctx.stroke();
  const colors = ["#d9654c", "#f1cf58", "#70a466", "#d9654c", "#f1cf58", "#70a466"];
  colors.forEach((color, i) => {
    const t = (i + .5) / colors.length, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 14, y - 17); ctx.lineTo(x + 2, y - 17); ctx.lineTo(x - 6, y - 2); ctx.closePath(); ctx.fill();
  });
}
function drawFence(x1, y1, x2, y2) {
  const a = iso(x1, y1), b = iso(x2, y2);
  ctx.strokeStyle = "#8a5b36"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  [a, b].forEach(q => { ctx.fillStyle = "#a87543"; ctx.fillRect(q.x - 4, q.y - 14, 8, 22); });
}
function drawMarket() {
  const q = iso(510, 255); ctx.fillStyle = "#b44732"; ctx.fillRect(q.x - 63, q.y - 28, 126, 45);
  ctx.fillStyle = "#f1d071"; ctx.beginPath(); ctx.moveTo(q.x - 75, q.y - 29); ctx.lineTo(q.x, q.y - 62); ctx.lineTo(q.x + 75, q.y - 29); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#8a5b36"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q.x - 52, q.y - 25); ctx.lineTo(q.x - 52, q.y + 22); ctx.moveTo(q.x + 52, q.y - 25); ctx.lineTo(q.x + 52, q.y + 22); ctx.stroke();
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(q.x - 45, q.y - 22, 17, 8); ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 28, q.y - 22, 17, 8); ctx.fillStyle = "#fff0bd"; ctx.fillRect(q.x - 11, q.y - 22, 17, 8); ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x + 6, q.y - 22, 17, 8);
  ctx.fillStyle = "#fff3c6"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText("MARKNAD", q.x, q.y + 2); ctx.textAlign = "left";
}
function drawHumorousDetails() {
  const signs = [
    { x: 395, y: 75, text: "ÄGG 2 FÖR 1", color: "#d9654c" },
    { x: 875, y: 570, text: "SE UPP!", color: "#e1a52f" },
    { x: 120, y: 520, text: "HÖNS PÅ VÄG", color: "#70a466" }
  ];
  signs.filter(sign => isSafeDecorationPosition(sign.x, sign.y, 145)).forEach(sign => {
    const q = iso(sign.x, sign.y);
    ctx.fillStyle = "#8a5b36"; ctx.fillRect(q.x - 2, q.y - 3, 4, 27);
    ctx.fillStyle = sign.color; ctx.fillRect(q.x - 34, q.y - 30, 68, 24);
    ctx.strokeStyle = visualStyle.ink; ctx.lineWidth = 2; ctx.strokeRect(q.x - 34, q.y - 30, 68, 24);
    ctx.fillStyle = visualStyle.ink; ctx.font = "700 8px monospace"; ctx.textAlign = "center"; ctx.fillText(sign.text, q.x, q.y - 15);
  });
  const q = iso(585, 300);
  ctx.fillStyle = "#8a5b36"; ctx.fillRect(q.x - 18, q.y - 8, 36, 15);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 15, q.y - 13, 12, 8); ctx.fillRect(q.x + 3, q.y - 13, 12, 8);
  ctx.fillStyle = "#f1cf58"; ctx.fillRect(q.x - 7, q.y - 4, 14, 5);
  ctx.fillStyle = visualStyle.ink; ctx.font = "700 8px monospace"; ctx.fillText("MYSTISK KORG", q.x, q.y + 23);
  ctx.textAlign = "left";
}
function drawCrowd() {
  const wave = Math.sin(performance.now() / (crowdEnergy > .7 ? 105 : 180)) * (4 + crowdEnergy * 8);
  crowdSpectators.forEach(s => {
    const q = iso(s.x, s.y);
    ctx.fillStyle = "#4d3a2d88"; ctx.fillRect(q.x - 11, q.y + 5, 22, 5);
    ctx.fillStyle = s.color; ctx.fillRect(q.x - 9, q.y - 5, 18, 17);
    ctx.fillStyle = "#f2c497"; ctx.fillRect(q.x - 7, q.y - 18, 14, 13);
    ctx.fillStyle = s.hat; ctx.fillRect(q.x - 10, q.y - 23, 20, 5); ctx.fillRect(q.x - 5, q.y - 28, 11, 5);
    ctx.fillStyle = "#35251d"; ctx.fillRect(q.x - 4, q.y - 14, 3, 3); ctx.fillRect(q.x + 4, q.y - 14, 3, 3);
    ctx.fillStyle = "#b44732"; ctx.fillRect(q.x - 4, q.y - 8, 9, 3);
    ctx.strokeStyle = s.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x + 8, q.y - 1); ctx.lineTo(q.x + 15, q.y - 15 + wave); ctx.stroke();
    ctx.fillStyle = "#f2c497"; ctx.fillRect(q.x + 12, q.y - 18 + wave, 7, 7);
    if (crowdEnergy > .5) {
      ctx.fillStyle = s.hat; ctx.fillRect(q.x - 18, q.y - 42 - wave * .25, 5, 16);
      ctx.fillStyle = s.color; ctx.fillRect(q.x - 13, q.y - 42 - wave * .25, 18, 4);
    }
  });
  [
    { x: 410, y: 238, type: "bottle" }, { x: 670, y: 235, type: "can" },
    { x: 485, y: 230, type: "bottle" }
  ].forEach(litter => {
    const q = iso(litter.x, litter.y);
    ctx.fillStyle = "#35251d"; ctx.fillRect(q.x - 3, q.y - 2, 7, 4);
    ctx.fillStyle = litter.type === "bottle" ? "#74a9b8" : "#d6a33e"; ctx.fillRect(q.x - 2, q.y - 7, 5, 8);
  });
}
function drawCrowdSpeech(speech) {
  const speaker = crowdSpectators[speech.speaker];
  const target = crowdSpectators[speech.target];
  const q = iso(speaker.x, speaker.y);
  const targetQ = iso(target.x, target.y);
  ctx.font = "700 10px monospace";
  const lines = [];
  let line = "";
  speech.text.split(" ").forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > 142 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  const width = Math.min(178, Math.max(104, Math.max(...lines.map(item => ctx.measureText(item).width)) + 18));
  const height = lines.length * 13 + 16;
  const direction = targetQ.x >= q.x ? 1 : -1;
  const bubbleX = q.x + direction * 18;
  const bubbleY = q.y - 75 - height;
  ctx.save();
  pixelEdges();
  ctx.fillStyle = visualStyle.paper;
  ctx.strokeStyle = visualStyle.ink;
  ctx.lineWidth = 3;
  ctx.fillRect(bubbleX - width / 2, bubbleY, width, height);
  ctx.strokeRect(bubbleX - width / 2, bubbleY, width, height);
  ctx.fillStyle = visualStyle.paper;
  ctx.beginPath();
  ctx.moveTo(bubbleX + direction * 18, bubbleY + height);
  ctx.lineTo(bubbleX + direction * 30, bubbleY + height);
  ctx.lineTo(q.x + direction * 8, q.y - 56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = visualStyle.ink;
  ctx.font = "700 10px monospace";
  ctx.textAlign = "center";
  lines.forEach((item, index) => ctx.fillText(item, bubbleX, bubbleY + 14 + index * 13));
  ctx.restore();
  ctx.textAlign = "left";
}
function updateCrowdDialogue(dt) {
  crowdEnergy = Math.max(.18, crowdEnergy - dt / 9000);
  crowdDialogueTimer -= dt / 60;
  if (crowdSpeech) {
    crowdSpeech.timer -= dt / 60;
    if (crowdSpeech.timer <= 0) crowdSpeech = null;
  }
  if (crowdDialogueTimer <= 0 && !crowdSpeech) {
    crowdSpeech = { ...crowdDialogue[crowdDialogueIndex], timer: 3.8 };
    crowdDialogueIndex = (crowdDialogueIndex + 1) % crowdDialogue.length;
    crowdDialogueTimer = 1.1;
  }
}
function updateRaceEvent(dt) {
  if (!raceRunning || countdown > 0) return;
  const target = route[(tractor.waypoint + 1) % route.length];
  const dx = target.x - tractor.trackX, dy = target.y - tractor.trackY;
  const distance = Math.max(1, Math.hypot(dx, dy));
  tractor.trackX += dx / distance * tractor.speed * dt;
  tractor.trackY += dy / distance * tractor.speed * dt;
  tractor.facing = dx < 0 ? -1 : 1;
  if (Math.hypot(target.x - tractor.trackX, target.y - tractor.trackY) < 24) tractor.waypoint = (tractor.waypoint + 1) % route.length;
  const segmentStart = route[tractor.waypoint];
  const segmentEnd = route[(tractor.waypoint + 1) % route.length];
  const segmentX = segmentEnd.x - segmentStart.x, segmentY = segmentEnd.y - segmentStart.y;
  const segmentLength = Math.max(1, Math.hypot(segmentX, segmentY));
  const normalX = -segmentY / segmentLength, normalY = segmentX / segmentLength;
  tractor.phase += .045 * dt;
  const laneOffset = Math.sin(tractor.phase) * 108 + Math.sin(tractor.phase * .47 + 1.7) * 24;
  tractor.x = tractor.trackX + normalX * laneOffset;
  tractor.y = tractor.trackY + normalY * laneOffset;
  raceEvent.timer -= dt / 60;
  if (raceEvent.state === "idle" && raceEvent.timer <= 3) {
    raceEvent.state = "warning"; raceEvent.warning = 3;
    raceEvent.type = "rain";
    message = "VARNING: regn på väg – halt underlag!";
    messageTimer = 3; playSfx("tractor");
    setCrowdMood("weather", .2);
  }
  if (raceEvent.state === "warning") {
    raceEvent.warning = Math.max(0, raceEvent.warning - dt / 60);
    if (raceEvent.warning <= 0) {
      raceEvent.state = "active"; raceEvent.timer = 7;
      message = "REGNET ÄR HÄR! Håll i dig i kurvorna!";
      messageTimer = 2.2; playSfx("tractor");
      setCrowdMood("weather", .3);
    }
  } else if (raceEvent.state === "active" && raceEvent.timer <= 0) {
    raceEvent = { type: null, state: "idle", timer: 14 + Math.random() * 9, warning: 0 };
    message = "Banan är fri igen."; messageTimer = 1.2;
  }
}
function drawRaceEvent() {
  if (raceRunning) drawTractor(tractor.x, tractor.y, tractor.facing);
  if (raceEvent.state === "active" && raceEvent.type === "rain") {
    ctx.save(); ctx.strokeStyle = "#b8d8e0aa"; ctx.lineWidth = 2;
    for (let i = 0; i < 90; i++) { const x = (i * 83 + performance.now() / 8) % W; const y = (i * 47 + performance.now() / 11) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 14); ctx.stroke(); }
    ctx.restore();
  }
}
function drawAtmosphereOverlay() {
  const timeProfile = timeOfDayProfiles[raceAtmosphere.timeOfDay] || timeOfDayProfiles.day;
  const weatherProfile = weatherProfiles[raceAtmosphere.weather] || weatherProfiles.clear;
  ctx.save();
  ctx.globalAlpha = .38;
  ctx.fillStyle = timeProfile.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .8;
  ctx.fillStyle = weatherProfile.tint;
  ctx.fillRect(0, 0, W, H);
  if (raceAtmosphere.timeOfDay === "dusk") {
    ctx.fillStyle = "#fff0bd";
    for (let i = 0; i < 12; i++) ctx.fillRect((i * 97 + 32) % W, 70 + (i * 31) % 160, 3, 3);
  }
  if (raceAtmosphere.timeOfDay === "golden" || raceAtmosphere.timeOfDay === "dawn") {
    ctx.globalAlpha = .1;
    ctx.fillStyle = "#fff0bd";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(70 + i * 240, 0); ctx.lineTo(180 + i * 240, 0); ctx.lineTo(420 + i * 180, H); ctx.lineTo(300 + i * 180, H); ctx.closePath(); ctx.fill();
    }
  }
  if (raceAtmosphere.weather === "drizzle") {
    ctx.globalAlpha = .28;
    ctx.strokeStyle = "#d7eff2"; ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const x = (i * 83 + performance.now() / 7) % W, y = (i * 47 + performance.now() / 10) % H;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 12); ctx.stroke();
    }
  } else if (raceAtmosphere.weather === "cloudy") {
    ctx.globalAlpha = .12; ctx.fillStyle = "#dce8e5";
    for (let i = 0; i < 8; i++) ctx.fillRect((i * 170 + performance.now() / 50) % (W + 180) - 90, 155 + (i % 3) * 65, 120, 18);
  }
  ctx.restore();
}
function drawLastLapVisual() {
  if (!raceRunning || intensityLevel < 3) return;
  const pulse = .16 + Math.sin(performance.now() / 120) * .06;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = "#d9654c"; ctx.lineWidth = 12; ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.globalAlpha = .82;
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(W / 2 - 78, H - 44, 156, 26);
  ctx.fillStyle = "#d9654c"; ctx.font = "700 15px monospace"; ctx.textAlign = "center"; ctx.fillText("SISTA VARVET!", W / 2, H - 26);
  ctx.restore(); ctx.textAlign = "left";
}
function drawStartScene() {
  if (!raceRunning || countdown <= 0) return;
  const lights = countdown > 2 ? 1 : countdown > 1 ? 2 : 3;
  ctx.save();
  ctx.fillStyle = "#35251de8"; ctx.fillRect(W / 2 - 112, 72, 224, 34);
  ctx.fillStyle = "#f1cf58"; ctx.font = "700 14px monospace"; ctx.textAlign = "center"; ctx.fillText("STARTKLAR, HÖNOR!", W / 2, 94);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < lights ? "#d9654c" : "#604d38";
    ctx.fillRect(W / 2 - 38 + i * 28, 120, 18, 18);
  }
  ctx.fillStyle = "#fff0bd"; ctx.font = "700 11px monospace"; ctx.fillText(raceAtmosphere.weather === "drizzle" ? "Håll fjädrarna torra!" : "Publiken väntar...", W / 2, 160);
  ctx.restore(); ctx.textAlign = "left";
}
function drawFinishScene() {
  if (!finishScene.active) return;
  const pulse = 1 + Math.sin(performance.now() / 140) * .04;
  ctx.save();
  ctx.globalAlpha = .8;
  ctx.strokeStyle = finishScene.winner ? "#f1cf58" : "#fff0bd"; ctx.lineWidth = 8 * pulse;
  ctx.strokeRect(22, 22, W - 44, H - 44);
  ctx.globalAlpha = .9;
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(W / 2 - 124, 72, 248, 42);
  ctx.fillStyle = "#35251d"; ctx.font = "700 19px monospace"; ctx.textAlign = "center";
  ctx.fillText(finishScene.winner ? "MÅL! HÖNSHJÄLTE!" : "MÅL! BRA KÄMPAT!", W / 2, 99);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(W / 2 - 78, 126, 156, 7);
  ctx.restore(); ctx.textAlign = "left";
}
function drawObstacle(o) {
  const q = iso(o.x, o.y); ctx.save(); ctx.translate(q.x, q.y);
  const sprite = sprites[o.type === "mud" ? "mudPuddle" : "hayBale"];
  if (sprite) {
    ctx.drawImage(sprite, o.type === "mud" ? -48 : -40, o.type === "mud" ? -24 : -32);
    ctx.restore(); return;
  }
  if (o.type === "mud") {
    ctx.fillStyle = "#563a29"; ctx.fillRect(-34, -2, 68, 16); ctx.fillRect(-24, -8, 48, 28);
    ctx.fillStyle = "#815b39"; ctx.fillRect(-25, -4, 50, 10); ctx.fillRect(-17, -8, 34, 12);
    ctx.fillStyle = "#a77a4a"; ctx.fillRect(-17, -2, 5, 3); ctx.fillRect(8, 3, 7, 3);
  } else {
    ctx.fillStyle = "#a96e39"; ctx.fillRect(-25, -15, 50, 31); ctx.fillStyle = "#e3b35e"; ctx.fillRect(-21, -20, 42, 9);
    ctx.strokeStyle = "#704628"; ctx.lineWidth = 3; ctx.strokeRect(-25, -15, 50, 31);
    ctx.strokeStyle = "#c18b45"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -13); ctx.lineTo(-14, 13); ctx.moveTo(0, -13); ctx.lineTo(0, 13); ctx.moveTo(14, -13); ctx.lineTo(14, 13); ctx.stroke();
  }
  ctx.restore();
}
function drawPickup(p) {
  if (!p.active) return; const q = iso(p.x, p.y); ctx.save(); ctx.translate(q.x, q.y - 20 + Math.sin(performance.now() / 220 + p.x) * 3);
  const sprite = sprites[p.type === "boost" ? "boostEgg" : "mudBomb"];
  if (sprite && (p.type === "boost" || p.type === "muck")) {
    ctx.drawImage(sprite, -24, -24);
    ctx.font = "700 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#fff8dc"; ctx.fillText(p.type === "boost" ? "FART" : "LERA", 0, 34);
    ctx.restore(); ctx.textAlign = "left"; return;
  }
  const colors = { boost: visualStyle.boostGold, muck: visualStyle.mud, shield: "#5b9bc7", nutella: "#9a5d34" };
  const labels = { boost: "FART", muck: "LERA", shield: "SKYDD", nutella: "NUTELLA" };
  drawPixelBadge(0, 0, colors[p.type] || visualStyle.cream);
  ctx.fillStyle = "#fff8dc"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillText(p.type === "shield" ? "◇" : p.type === "nutella" ? "N" : p.type === "boost" ? "»" : "!", 0, 5);
  ctx.font = "700 9px monospace"; ctx.fillText(labels[p.type] || p.type, 0, 28);
  ctx.restore(); ctx.textAlign = "left";
}
function drawThrownObject(object) {
  const q = iso(object.x, object.y);
  ctx.save(); ctx.translate(q.x, q.y - 13 - object.height);
  ctx.rotate(object.spin);
  ctx.fillStyle = "#74a9b8"; ctx.fillRect(-4, -8, 8, 16);
  ctx.fillStyle = "#dceff0"; ctx.fillRect(-3, -6, 6, 4);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(-3, -11, 6, 4);
  ctx.restore();
}
function drawChicken(a) {
  const q = iso(a.x, a.y); const bob = Math.sin(performance.now() / 90 + a.x) * (a.speed > .3 ? 1.5 : 0);
  ctx.save(); ctx.translate(q.x, q.y - 20 + bob); ctx.scale(a.facing, 1);
  const sprite = sprites[a.sprite];
  if (sprite) {
    const raceLook = a.player ? a.chickenType.gear : a.raceLook;
    drawRaceLook(raceLook, true);
    const animation = a.boost > 0 ? spriteAnimations.boost : a.speed > .3 ? spriteAnimations.run : spriteAnimations.idle;
    const frame = animation.frames[Math.floor(a.animTime * animation.fps) % animation.frames.length];
    ctx.filter = raceLook === "armor" ? "grayscale(1) contrast(1.15)" : "none";
    ctx.drawImage(sprite, frame * 96, 0, 96, 96, -48, -78, 96, 96);
    ctx.filter = "none";
    drawRaceLook(raceLook, false);
    if (a.scarf) { ctx.fillStyle = a.scarf; ctx.fillRect(-15, 0, 25, 5); ctx.fillRect(8, 3, 5, 14); }
    if (a.boost > 0) {
      drawBoostChaos(a);
    }
    if (a.shield) {
      ctx.strokeStyle = "#69b9e8"; ctx.lineWidth = 3; ctx.globalAlpha = .75;
      const shieldSize = 48 + Math.sin(performance.now() / 140) * 2;
      ctx.strokeRect(-shieldSize, -28 - shieldSize, shieldSize * 2, shieldSize * 2); ctx.globalAlpha = 1;
    }
    drawDazedEffect(a);
    drawActorReaction(a);
    function drawRaceLook(look, behind) {
      if (behind && look === "flames") {
        ctx.fillStyle = "#b44732"; ctx.fillRect(-38, 1, 12, 21); ctx.fillRect(19, 1, 12, 21);
        ctx.fillStyle = "#d9654c"; ctx.fillRect(-43, 5, 6, 15); ctx.fillRect(26, 5, 6, 15);
        ctx.fillStyle = "#f1cf58"; ctx.fillRect(-50, 9, 10, 7); ctx.fillRect(31, 9, 10, 7);
      }
      if (behind && look === "spikes") {
        ctx.fillStyle = "#d6a33e";
        for (let i = -18; i <= 12; i += 10) { ctx.beginPath(); ctx.moveTo(i, -10); ctx.lineTo(i + 6, -22); ctx.lineTo(i + 12, -10); ctx.fill(); }
      }
      if (!behind && look === "farmer") {
        ctx.fillStyle = "#e1a52f"; ctx.fillRect(-24, -55, 45, 6); ctx.fillRect(-13, -62, 24, 7);
        ctx.fillStyle = "#70412f"; ctx.fillRect(-18, -50, 5, 4); ctx.fillRect(13, -50, 5, 4);
      }
      if (!behind && look === "commando") {
        ctx.fillStyle = "#394a35"; ctx.fillRect(-24, -55, 42, 7); ctx.fillRect(-12, -62, 24, 8);
        ctx.fillStyle = "#d6a33e"; ctx.fillRect(-21, -51, 5, 4); ctx.fillRect(10, -51, 5, 4);
        ctx.fillStyle = "#35251d"; ctx.fillRect(-37, -4, 12, 4); ctx.fillRect(-31, 0, 4, 13);
        ctx.fillStyle = "#e1a52f"; ctx.fillRect(-36, -8, 7, 4);
      }
      if (!behind && look === "ranger") {
        ctx.fillStyle = "#394a35"; ctx.fillRect(-25, -55, 44, 7); ctx.fillRect(-16, -62, 27, 8);
        ctx.fillStyle = "#70a466"; ctx.fillRect(-11, -59, 14, 4);
        ctx.fillStyle = "#68727a"; ctx.fillRect(-36, -21, 14, 8); ctx.fillRect(-36, -10, 14, 8);
        ctx.fillStyle = "#e1a52f"; ctx.fillRect(-34, -20, 6, 4); ctx.fillRect(-34, -9, 6, 4);
      }
      if (!behind && look === "heavy") {
        ctx.fillStyle = "#68727a"; ctx.fillRect(-30, -58, 49, 10); ctx.fillRect(-22, -65, 33, 8);
        ctx.fillStyle = "#bfc8c5"; ctx.fillRect(-22, -55, 8, 5); ctx.fillRect(8, -55, 8, 5);
        ctx.fillStyle = "#35251d"; ctx.fillRect(-35, 0, 14, 16); ctx.fillRect(15, 0, 14, 16);
        ctx.fillStyle = "#e1a52f"; ctx.fillRect(-32, 4, 7, 4); ctx.fillRect(18, 4, 7, 4);
        ctx.fillStyle = "#d9654c"; ctx.fillRect(-2, -5, 8, 8);
      }
      if (!behind && look === "scout") {
        ctx.fillStyle = "#d9654c"; ctx.fillRect(-26, -56, 45, 7); ctx.fillRect(-12, -63, 25, 8);
        ctx.fillStyle = "#fff0bd"; ctx.fillRect(-20, -53, 12, 3);
        ctx.fillStyle = "#35251d"; ctx.fillRect(9, -47, 18, 6); ctx.fillRect(28, -44, 5, 3);
        ctx.fillStyle = "#9cc0bd"; ctx.fillRect(10, -46, 10, 4);
      }
      if (!behind && look === "rocket") {
        ctx.fillStyle = "#68727a"; ctx.fillRect(-42, -18, 26, 12); ctx.fillRect(-42, 3, 26, 12);
        ctx.fillStyle = "#bfc8c5"; ctx.fillRect(-47, -17, 7, 10); ctx.fillRect(-47, 4, 7, 10);
        ctx.fillStyle = "#d9654c"; ctx.fillRect(-57, -16, 12, 9); ctx.fillRect(-57, 5, 12, 9);
        ctx.fillStyle = "#f1cf58"; ctx.fillRect(-66, -14, 10, 5); ctx.fillRect(-66, 7, 10, 5);
      }
      if (!behind && look === "glasses") {
        ctx.fillStyle = "#35251d"; ctx.fillRect(61 - 48, -47, 14, 7); ctx.fillRect(79 - 48, -47, 14, 7); ctx.fillRect(75 - 48, -45, 6, 3);
      }
      if (!behind && look === "bomber") {
        ctx.fillStyle = "#526243"; ctx.fillRect(-28, -10, 18, 18); ctx.fillRect(8, -4, 17, 15);
        ctx.fillStyle = "#394a35"; ctx.fillRect(-24, -7, 7, 6); ctx.fillRect(14, -1, 7, 6);
        ctx.fillStyle = "#7b8050"; ctx.fillRect(-13, 1, 7, 6); ctx.fillRect(3, -10, 6, 6);
        ctx.fillStyle = "#70412f"; ctx.fillRect(25, -25, 17, 24); ctx.fillRect(29, -28, 10, 5);
        ctx.fillStyle = "#fff8dc"; ctx.beginPath(); ctx.ellipse(34, -31, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e1a52f"; ctx.fillRect(32, -34, 4, 4);
      }
      if (!behind && look === "cigar") {
        ctx.fillStyle = "#8a5b36"; ctx.fillRect(38, -39, 14, 4); ctx.fillStyle = "#f1cf58"; ctx.fillRect(51, -39, 3, 4);
      }
      if (!behind && look === "armor") {
        const treadStep = Math.floor(performance.now() / 120) % 2;
        ctx.fillStyle = "#35251d"; ctx.fillRect(-39, 5, 19, 22); ctx.fillRect(14, 5, 19, 22);
        ctx.fillStyle = "#68727a"; ctx.fillRect(-36, 8, 13, 16); ctx.fillRect(17, 8, 13, 16);
        ctx.fillStyle = "#bfc8c5";
        for (let i = 0; i < 3; i++) {
          const treadY = 10 + i * 6 + (i % 2 === treadStep ? 1 : 0);
          ctx.fillRect(-38, treadY, 4, 3); ctx.fillRect(26, treadY, 4, 3);
        }
        ctx.fillStyle = "#e1a52f"; ctx.fillRect(-7, -10, 7, 7);
      }
    }
    ctx.save(); ctx.scale(a.facing, 1);
    ctx.fillStyle = "#fff8dc"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText(a.name, 0, -82);
    if (a.ai) { ctx.fillStyle = "#f3ce76"; ctx.font = "8px monospace"; ctx.fillText(personalityNames[a.personality] || "", 0, -72); }
    ctx.restore();
    ctx.restore(); ctx.textAlign = "left"; return;
  }
  drawPixelShadow(0, 23, 44, 8, 3);
  ctx.fillStyle = "#d6a33e"; ctx.fillRect(-9, 10, 4, 13); ctx.fillRect(5, 10, 4, 13);
  ctx.fillStyle = a.color; ctx.fillRect(-17, -11, 34, 22); ctx.fillRect(-11, -15, 22, 4);
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(-12, -1, 16, 10);
  ctx.fillRect(7, -18, 19, 18);
  ctx.fillStyle = "#d64d37"; ctx.fillRect(11, -21, 6, 6); ctx.fillRect(18, -18, 5, 5);
  ctx.fillStyle = "#35251d"; ctx.fillRect(15, -12, 4, 4);
  ctx.fillStyle = "#e3a52d"; ctx.fillRect(24, -8, 11, 6);
  if (a.boost > 0) drawBoostChaos(a);
  if (a.shield) { ctx.strokeStyle = "#69b9e8"; ctx.lineWidth = 3; ctx.strokeRect(-30, -40, 60, 60); }
  drawDazedEffect(a);
  drawActorReaction(a);
  ctx.save(); ctx.scale(a.facing, 1);
  ctx.fillStyle = "#fff8dc"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText(a.name, 0, -29);
  ctx.restore(); ctx.restore(); ctx.textAlign = "left";
}
function drawBoostChaos(actor) {
  const time = performance.now() / 90;
  const flicker = Math.sin(time) * 3;
  ctx.save();
  ctx.translate(-43, 5);
  ctx.fillStyle = "#d9654c";
  ctx.beginPath();
  ctx.moveTo(-8, 10); ctx.lineTo(-14, -3 + flicker); ctx.lineTo(-7, 0);
  ctx.lineTo(-3, -18 - flicker); ctx.lineTo(2, -3); ctx.lineTo(9, -13 + flicker);
  ctx.lineTo(8, 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f1cf58";
  ctx.beginPath();
  ctx.moveTo(-5, 9); ctx.lineTo(-7, -2); ctx.lineTo(-2, 2);
  ctx.lineTo(1, -11 - flicker); ctx.lineTo(5, 2); ctx.lineTo(6, 9);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawDazedEffect(actor) {
  if (actor.dazed <= 0) return;
  const spin = performance.now() / 180;
  ctx.save();
  ctx.scale(actor.facing, 1);
  ctx.translate(0, -68);
  ctx.rotate(spin * .12);
  ctx.fillStyle = "#f1cf58";
  for (let i = 0; i < 3; i++) {
    const angle = spin + i * Math.PI * 2 / 3;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -13); ctx.lineTo(3, -4); ctx.lineTo(11, -2);
    ctx.lineTo(4, 2); ctx.lineTo(2, 11); ctx.lineTo(-2, 3);
    ctx.lineTo(-10, 1); ctx.lineTo(-3, -3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#fff8dc";
  ctx.font = "700 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("DAZED!", 0, 25);
  ctx.restore();
  ctx.textAlign = "left";
}
function drawActorReaction(actor) {
  if (!actor.reactionTimer || actor.reactionTimer <= 0) return;
  ctx.save();
  ctx.scale(actor.facing, 1);
  const width = Math.max(42, Math.min(132, actor.reaction.length * 6 + 14));
  ctx.fillStyle = "#fff0bd"; ctx.strokeStyle = "#35251d"; ctx.lineWidth = 2;
  ctx.fillRect(-width / 2, -108, width, 18); ctx.strokeRect(-width / 2, -108, width, 18);
  ctx.fillStyle = "#35251d"; ctx.font = "700 8px monospace"; ctx.textAlign = "center"; ctx.fillText(actor.reaction, 0, -96);
  ctx.restore(); ctx.textAlign = "left";
}
function movePlayer(a, dt) {
  let dx = 0, dy = 0; if (keys.has("ArrowLeft") || keys.has("a")) dx--; if (keys.has("ArrowRight") || keys.has("d")) dx++; if (keys.has("ArrowUp") || keys.has("w")) dy--; if (keys.has("ArrowDown") || keys.has("s")) dy++;
  const length = Math.hypot(dx, dy) || 1;
  const normalMax = a.chickenType.baseSpeed, boostMax = a.chickenType.boostSpeed;
  const eventGrip = raceEvent.state === "active" && raceEvent.type === "rain" ? .72 : 1;
  const max = a.dazed > 0 ? normalMax * .16 : a.nutella > 0 ? boostMax * 1.22 : a.sticky > 0 ? normalMax * .45 : a.boost > 0 ? boostMax : a.slowTimer > 0 ? normalMax * .42 : normalMax;
  a.speed += (max - a.speed) * .12;
  a.speed *= eventGrip;
  if (dx || dy) { a.x += dx / length * a.speed * dt; a.y += dy / length * a.speed * dt; a.angle = Math.atan2(dy, dx); a.facing = dx < 0 ? -1 : 1; }
  a.x = Math.max(50, Math.min(1020, a.x)); a.y = Math.max(60, Math.min(600, a.y)); a.boost = Math.max(0, a.boost - dt / 60);
  if (a.nutella > 0) { a.nutella = Math.max(0, a.nutella - dt / 60); if (a.nutella === 0) { a.sticky = 2.4; message = "Nutellan tog slut – kladdig eftersmak!"; messageTimer = 1.5; } }
  a.sticky = Math.max(0, a.sticky - dt / 60); a.slowTimer = Math.max(0, a.slowTimer - dt / 60); a.dazed = Math.max(0, a.dazed - dt / 60);
  constrainToTrack(a);
}
function getTrackProjection(x, y) {
  let closest = null;
  for (let i = 0; i < trackModel.centerline.length; i++) {
    const start = trackModel.centerline[i], end = trackModel.centerline[(i + 1) % trackModel.centerline.length];
    const segmentX = end.x - start.x, segmentY = end.y - start.y;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    const t = Math.max(0, Math.min(1, ((x - start.x) * segmentX + (y - start.y) * segmentY) / lengthSquared));
    const projectedX = start.x + segmentX * t, projectedY = start.y + segmentY * t;
    const distance = Math.hypot(x - projectedX, y - projectedY);
    if (!closest || distance < closest.distance) closest = { x: projectedX, y: projectedY, distance };
  }
  return closest;
}
function isSafeDecorationPosition(x, y, clearance = trackModel.decorationClearance) {
  return getTrackProjection(x, y).distance > clearance;
}
function constrainToTrack(a) {
  const projection = getTrackProjection(a.x, a.y);
  const maxTrackDistance = trackModel.playableHalfWidth;
  if (projection.distance <= maxTrackDistance) return;
  const directionX = (a.x - projection.x) / projection.distance;
  const directionY = (a.y - projection.y) / projection.distance;
  a.x = projection.x + directionX * maxTrackDistance;
  a.y = projection.y + directionY * maxTrackDistance;
  if (trackWarningCooldown <= 0) {
    message = "Håll dig på banan! Här går det inte att gena.";
    messageTimer = 1.2;
    trackWarningCooldown = 1;
  }
}
function moveAI(a, dt) {
  const target = route[(a.waypoint + 1) % route.length], dx = target.x - a.x, dy = target.y - a.y;
  const personalityWobble = a.personality === "cautious" ? selectedDifficulty.wobble * 1.8 : a.personality === "sprinter" ? selectedDifficulty.wobble * .5 : selectedDifficulty.wobble;
  const wobble = Math.sin(performance.now() / 550 + a.seed) * personalityWobble; a.angle = Math.atan2(dy, dx) + wobble; a.facing = dx < 0 ? -1 : 1;
  const personalitySpeed = a.personality === "sprinter" && Math.sin(performance.now() / 1800 + a.seed) > .45 ? 1.12 : a.personality === "cautious" ? .94 : 1;
  const eventGrip = raceEvent.state === "active" && raceEvent.type === "rain" ? .72 : 1;
  const currentSpeed = a.dazed > 0 ? a.baseSpeed * .16 : a.slowTimer > 0 ? a.baseSpeed * .42 : a.baseSpeed * personalitySpeed * eventGrip;
  a.speed = currentSpeed;
  a.x += Math.cos(a.angle) * currentSpeed * dt; a.y += Math.sin(a.angle) * currentSpeed * dt;
  a.dazed = Math.max(0, a.dazed - dt / 60); a.slowTimer = Math.max(0, a.slowTimer - dt / 60);
}
function advanceNavigation(actor) {
  const target = route[(actor.waypoint + 1) % route.length];
  if (Math.hypot(actor.x - target.x, actor.y - target.y) < 95) actor.waypoint = (actor.waypoint + 1) % route.length;
}
function hasCrossedFinish(previousX, previousY, x, y) {
  const target = route[0], previous = route[route.length - 1];
  const directionX = target.x - previous.x, directionY = target.y - previous.y;
  const length = Math.hypot(directionX, directionY);
  const beforeSide = (previousX - target.x) * directionX + (previousY - target.y) * directionY;
  const afterSide = (x - target.x) * directionX + (y - target.y) * directionY;
  const lateralDistance = Math.abs((x - target.x) * directionY - (y - target.y) * directionX) / length;
  return beforeSide <= 0 && afterSide > 0 && lateralDistance <= trackModel.finishGateWidth;
}
function checkItems(a) {
  pickups.forEach(p => {
    if (p.active && Math.hypot(a.x - p.x, a.y - p.y) < 30) {
      p.active = false; p.respawnTimer = 5.5 + Math.random() * 2.5; a.item = p.type;
      if (a.player) {
        const pickupMessage = { boost: "Fartägg plockat! Tryck SPACE.", muck: "Lerbomb plockad! Tryck SPACE.", shield: "Sköld plockad! Tryck SPACE.", nutella: "Nutella plockad! Risk/reward – tryck SPACE." };
        message = pickupMessage[p.type]; messageTimer = 2.5;
      } else triggerRivalReaction(a, "powerup");
      playSfx("pickup");
    }
  });
  a.obstacleCooldown = Math.max(0, a.obstacleCooldown - 1 / 60);
  a.slowTimer = Math.max(0, a.slowTimer - 1 / 60);
  if (a.obstacleCooldown === 0 && obstacles.some(o => Math.hypot(a.x - o.x, a.y - o.y) < 40)) {
    if (a.shield) { a.shield = false; a.obstacleCooldown = 1.1; message = a.player ? "Skölden tog smällen!" : message; messageTimer = a.player ? 1.3 : messageTimer; playSfx("shield"); return; }
    if (a.player) a.speed *= a.chickenType.resistance ? .95 : .7;
    a.slowTimer = a.player && a.chickenType.resistance ? .35 : 1.5; a.obstacleCooldown = 1.2;
    for (let i = 0; i < 7; i++) addParticle(a.x, a.y, { vx: (Math.random() - .5) * .9, vy: (Math.random() - .5) * .9, height: 8, vz: 1.2, gravity: .05, life: .7, size: 3, color: "#795238" });
    if (a.player) {
      message = "Aj! Leran/höbalen bromsar dig.";
      messageTimer = 1.2;
      triggerCrowdReaction("hit", a);
    } else triggerRivalReaction(a, "hit");
  }
  if (a.obstacleCooldown === 0 && raceRunning && Math.hypot(a.x - tractor.x, a.y - tractor.y) < 52) {
    if (a.shield) {
      a.shield = false; a.obstacleCooldown = 1.2; if (a.player) { message = "Skölden räddade dig från traktorn!"; messageTimer = 1.5; }
    } else {
      a.dazed = .8; a.slowTimer = 1.2; a.obstacleCooldown = 1.3;
      if (a.player) {
        message = "Traktorn kör förbi! Väj undan.";
        messageTimer = 1.5;
        triggerCrowdReaction("hit", a);
      } else triggerRivalReaction(a, "hit", "Den där traktorn fuskar!");
    }
  }
}
function updateRaceInteractions(dt) {
  actors.forEach(a => { a.slipstream = false; a.collisionCooldown = Math.max(0, (a.collisionCooldown || 0) - dt / 60); });
  for (let i = 0; i < actors.length; i++) for (let j = i + 1; j < actors.length; j++) {
    const a = actors[i], b = actors[j], dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
    if (distance > 26 && distance < 92) {
      const dotA = (Math.cos(a.angle) * dx + Math.sin(a.angle) * dy) / distance;
      const dotB = (Math.cos(b.angle) * -dx + Math.sin(b.angle) * -dy) / distance;
      if (dotA > .35) a.slipstream = true;
      if (dotB > .35) b.slipstream = true;
    }
    if (distance < 27 && (a.collisionCooldown || 0) <= 0 && (b.collisionCooldown || 0) <= 0) {
      const nx = dx / (distance || 1), ny = dy / (distance || 1);
      a.x -= nx * 9; a.y -= ny * 9; b.x += nx * 9; b.y += ny * 9;
      const protectedHit = a.shield || b.shield;
      if (a.shield) a.shield = false; if (b.shield) b.shield = false;
      if (!protectedHit) { a.dazed = Math.max(a.dazed, .28); b.dazed = Math.max(b.dazed, .28); }
      a.collisionCooldown = b.collisionCooldown = .55;
      triggerRivalReaction(a, "hit");
      triggerRivalReaction(b, "hit");
      if (a.player || b.player) {
        const player = a.player ? a : b;
        message = protectedHit ? "Sköld mot krock!" : "BUMP! Hönorna knuffas.";
        messageTimer = 1.1;
        triggerCrowdReaction("hit", player);
        playSfx(protectedHit ? "shield" : "bump");
      }
    }
  }
  actors.forEach(a => { if (a.slipstream && a.dazed <= 0) a.speed *= 1.08; });
}
function updatePickupRespawns(dt) {
  pickups.forEach(pickup => {
    if (pickup.active) return;
    pickup.respawnTimer -= dt / 60;
    if (pickup.respawnTimer > 0) return;
    const points = pickupSpawnPoints[pickup.type];
    const point = points[Math.floor(Math.random() * points.length)];
    pickup.x = point.x + (Math.random() - .5) * 14;
    pickup.y = point.y + (Math.random() - .5) * 14;
    pickup.active = true;
    pickup.respawnTimer = 0;
  });
}
function throwFromCrowd() {
  const player = actors[0];
  if (!player || !raceRunning) return;
  const origin = { x: 540, y: 190 };
  const dx = player.x - origin.x, dy = player.y - origin.y, distance = Math.max(1, Math.hypot(dx, dy));
  const speed = 3.4;
  thrownObjects.push({
    x: origin.x, y: origin.y, vx: dx / distance * speed, vy: dy / distance * speed,
    height: 0, spin: 0, life: 5
  });
}
function updateThrownObjects(dt) {
  crowdTimer -= dt / 60;
  if (crowdTimer <= 0) { throwFromCrowd(); crowdTimer = 4.5; }
  thrownObjects.forEach(object => {
    object.x += object.vx * dt; object.y += object.vy * dt;
    object.height = Math.min(32, object.height + .8 * dt); object.spin += .18 * dt; object.life -= dt / 60;
    const player = actors[0];
    if (player && Math.hypot(player.x - object.x, player.y - object.y) < 25 && object.height > 8) {
      player.speed *= .25; player.dazed = 1.6; player.obstacleCooldown = 1.2;
      message = "Publiken kastade en flaska! Du blev DAZED."; messageTimer = 1.8; playSfx("bottle");
      triggerCrowdReaction("hit", player);
      object.life = 0;
    }
  });
  thrownObjects = thrownObjects.filter(object => object.life > 0 && object.x > 0 && object.x < 1100 && object.y > 0 && object.y < 700);
}
function drawMudBomb(bomb) {
  const q = iso(bomb.x, bomb.y);
  ctx.save(); ctx.translate(q.x, q.y - 18); ctx.rotate(bomb.spin);
  ctx.fillStyle = "#563a29"; ctx.fillRect(-7, -7, 14, 14);
  ctx.fillStyle = "#a77a4a"; ctx.fillRect(-4, -4, 5, 4);
  ctx.restore();
}
function throwMudBomb(player) {
  const target = actors.slice(1).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
  if (!target) return;
  const dx = target.x - player.x, dy = target.y - player.y, distance = Math.max(1, Math.hypot(dx, dy));
  mudBombs.push({ x: player.x, y: player.y, vx: dx / distance * 5.2, vy: dy / distance * 5.2, spin: 0, target, life: 2.5 });
}
function updateMudBombs(dt) {
  mudBombs.forEach(bomb => {
    bomb.x += bomb.vx * dt; bomb.y += bomb.vy * dt; bomb.spin += .25 * dt; bomb.life -= dt / 60;
    const targetDx = bomb.target.x - bomb.x, targetDy = bomb.target.y - bomb.y;
    const targetDistance = Math.max(1, Math.hypot(targetDx, targetDy));
    const desiredVx = targetDx / targetDistance * 5.8, desiredVy = targetDy / targetDistance * 5.8;
    bomb.vx += (desiredVx - bomb.vx) * .18; bomb.vy += (desiredVy - bomb.vy) * .18;
    if (targetDistance < 30) {
      bomb.target.slowTimer = 1.4; bomb.life = 0;
      for (let i = 0; i < 8; i++) addParticle(bomb.target.x, bomb.target.y, { vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2, height: 8, vz: 1, gravity: .05, life: .7, size: 3, color: "#795238" });
      message = `${bomb.target.name} fick lerbomben i fejset!`; messageTimer = 1.4;
      triggerRivalReaction(bomb.target, "hit", "LERATTACK!");
    }
  });
  mudBombs = mudBombs.filter(bomb => bomb.life > 0);
}
function update(dt) {
  if (countdown > 0) {
    const previousCountdown = countdown;
    countdown = Math.max(0, countdown - dt / 60);
    raceStartScene.timer = countdown;
    if (previousCountdown > 0 && countdown === 0 && !raceStartScene.launched) {
      raceStartScene.launched = true;
      raceStartScene.timer = 0;
      triggerCrowdReaction("start", actors[0]);
    }
    return;
  }
  raceTime += dt / 60;
  actors.forEach(a => {
    const previousX = a.x, previousY = a.y;
    if (a.player) movePlayer(a, dt); else moveAI(a, dt);
    advanceNavigation(a);
    if (a.waypoint >= route.length - 2) a.finishArmed = true;
    if (a.finishArmed && hasCrossedFinish(previousX, previousY, a.x, a.y)) {
      a.lap++; a.finishArmed = false;
      if (a.player) {
        message = "Mållinjen passerad! Nytt varv!";
        messageTimer = 1;
        playSfx("lap");
        triggerCrowdReaction(a.lap >= lapsToWin - 1 ? "lastLap" : "leader", a);
      } else {
        triggerRivalReaction(a, "overtake", a.lap >= lapsToWin - 1 ? "Sista varvet!" : "Varv klart!");
      }
    }
    a.animTime += dt / 60;
    if (a.speed > .5 && Math.random() < (.08 + raceIntensity * .11) * dt) {
      addParticle(a.x - a.facing * 16, a.y + 8, { vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, height: 1, vz: .18, gravity: .01, life: .45, size: 2.5, color: "#d8b477" });
    }
    if (a.player && a.boost > 0 && Math.random() < .16 * dt) {
      addParticle(a.x - a.facing * 28, a.y, { vx: -a.facing * .5, vy: (Math.random() - .5) * .5, height: 7, vz: .2, gravity: .01, life: .4, size: 3, color: Math.random() < .5 ? "#d9654c" : "#f1cf58" });
    }
    if (intensityLevel >= 2 && Math.random() < .025 * intensityLevel * dt) {
      addParticle(a.x + (Math.random() - .5) * 16, a.y, { vx: (Math.random() - .5) * .7, vy: (Math.random() - .5) * .7, height: 10, vz: .55, gravity: .03, life: .7, size: 2 + Math.random() * 2, color: intensityLevel === 3 ? "#f1cf58" : "#fff0bd", shape: "confetti" });
    }
    a.reactionTimer = Math.max(0, (a.reactionTimer || 0) - dt / 60);
    checkItems(a);
  });
  updateThrownObjects(dt);
  updateMudBombs(dt);
  updatePickupRespawns(dt);
  updateRaceEvent(dt);
  updateRaceInteractions(dt);
  updateCrowdDialogue(dt);
  updateRaceIntensity(dt);
  updateStandingsReactions();
  updateDynamicAudio(dt);
  updateParticles(dt);
  trackWarningCooldown = Math.max(0, trackWarningCooldown - dt / 60);
  const p = actors[0];
  if (keys.has(" ") && p.item) {
    if (p.item === "boost") { p.boost = p.chickenType.boostDuration; message = p.chickenType.gear === "rocket" ? "RAKETMOTORERNA TÄNDA! Håll i hönan!" : "FARTBOOST! Hönan rusar iväg."; }
    else if (p.item === "muck") { throwMudBomb(p); message = "LERBOMB! Siktar på närmaste motståndare."; }
    else if (p.item === "shield") { p.shield = true; message = "SKÖLD AKTIVERAD! En smäll är gratis."; }
    else if (p.item === "nutella") { p.nutella = 4.2; message = "NUTELLA-BOOST! Snabb men kladdig risk."; }
    const usedItem = p.item;
    playSfx({ boost: "boost", muck: "muck", shield: "shield", nutella: "nutella" }[usedItem]);
    actors.slice(1).forEach(rival => triggerRivalReaction(rival, "powerup"));
    messageTimer = 1.8; p.item = null; keys.delete(" ");
    localStorage.setItem("bjorketorp-powerups", String(Number(localStorage.getItem("bjorketorp-powerups") || 0) + 1));
  }
  messageTimer = Math.max(0, messageTimer - dt / 60);
  if (p.lap >= lapsToWin) endRace();
}
function drawHud() {
  const p = actors[0];
  drawPixelPanel(18, 18, 330, 128, "#35251de8", "#e3b35e");
  ctx.fillStyle = visualStyle.paper; ctx.font = "700 16px monospace"; ctx.fillText(`Varv ${Math.min(p.lap + 1, lapsToWin)} / ${lapsToWin}`, 34, 45);
  const itemNames = { boost: "Fartägg", muck: "Lerbomb", shield: "Sköld", nutella: "Nutella" };
  ctx.font = "14px monospace"; ctx.fillText(p.item ? `Power-up redo: ${itemNames[p.item]} (SPACE)` : "Power-up: inget redo", 34, 70);
  ctx.fillText(p.shield ? "Sköld aktiv · " : "", 34, 94);
  ctx.fillText(p.slipstream ? "SLIPSTREAM! +fart" : "Följ banan till mållinjen", 34, 110);
  ctx.fillStyle = "#f3ce76"; ctx.font = "11px monospace"; ctx.fillText(`Kladdis rekord: ${formatTime(legendRecord)}`, 34, 126);
  ctx.textAlign = "right"; ctx.font = "700 16px monospace"; ctx.fillText(formatTime(raceTime), W - 24, 44); ctx.font = "12px monospace"; ctx.fillText("TID", W - 24, 63); ctx.textAlign = "left";
  if (messageTimer > 0) {
    ctx.font = "700 15px monospace";
    const panelWidth = Math.min(W - 40, Math.max(300, ctx.measureText(message).width + 42));
    const panelX = (W - panelWidth) / 2;
    drawPixelPanel(panelX + 3, 15, panelWidth, 32, visualStyle.ink, visualStyle.ink);
    drawPixelPanel(panelX, 12, panelWidth, 32, visualStyle.cream, "#6f432d");
    ctx.fillStyle = "#35251d";
    ctx.textAlign = "center";
    ctx.fillText(message, W / 2, 34);
    ctx.textAlign = "left";
  }
  if (raceEvent.state === "warning" || raceEvent.state === "active") {
    const eventLabel = raceEvent.type === "tractor" ? "TRAKTORVARNING" : "REGNVARNING";
    const eventText = raceEvent.state === "warning" ? `Snart! ${Math.ceil(raceEvent.warning)} s` : `${Math.ceil(raceEvent.timer)} s kvar`;
    drawPixelPanel(W - 210, 76, 190, 38, raceEvent.state === "warning" ? "#f1cf58" : "#74a9b8", visualStyle.ink);
    ctx.fillStyle = visualStyle.ink;
    ctx.font = "700 13px monospace"; ctx.textAlign = "center"; ctx.fillText(eventLabel, W - 115, 92);
    ctx.font = "11px monospace"; ctx.fillText(eventText, W - 115, 106); ctx.textAlign = "left";
  }
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}.${String(Math.floor((seconds % 1) * 10))}`;
}
function getRaceProgress(actor) {
  const next = route[(actor.waypoint + 1) % route.length];
  return actor.lap * route.length + actor.waypoint + (1 - Math.min(1, Math.hypot(actor.x - next.x, actor.y - next.y) / 300));
}
function render() {
  drawWorld();
  const dynamicObjects = [
    ...obstacles,
    ...pickups.filter(pickup => pickup.active),
    ...thrownObjects,
    ...actors
  ].sort((a, b) => a.y - b.y);
  dynamicObjects.forEach(object => {
    if (actors.includes(object)) drawChicken(object);
    else if (thrownObjects.includes(object)) drawThrownObject(object);
    else if (pickups.includes(object)) drawPickup(object);
    else drawObstacle(object);
  });
  mudBombs.forEach(drawMudBomb);
  drawRaceEvent();
  drawParticles();
  if (crowdSpeech) drawCrowdSpeech(crowdSpeech);
  drawAtmosphereOverlay();
  drawLastLapVisual();
  drawStartScene();
  drawFinishScene();
  drawHud(); drawCountdown();
}
function drawCountdown() {
  if (countdown <= 0) return;
  const label = countdown > 2 ? "3" : countdown > 1 ? "2" : "1";
  drawPixelPanel(W / 2 - 70, H / 2 - 78, 140, 140, "#35251de8", "#e3b35e");
  ctx.fillStyle = "#f1cf58"; ctx.font = "bold 86px monospace"; ctx.textAlign = "center"; ctx.fillText(label, W / 2, H / 2 + 28);
  ctx.font = "bold 15px monospace"; ctx.fillStyle = "#fff0bd"; ctx.fillText("GÖR DIG REDO!", W / 2, H / 2 + 55); ctx.textAlign = "left";
}
function loop(now) {
  if (!pageVisible) return;
  if (!raceRunning && particles.length === 0) return;
  const dt = Math.min((now - lastTime) / 16.67, 2); lastTime = now;
  if (raceRunning && !gamePaused) update(dt); else if (!gamePaused) updateParticles(dt);
  render();
  if (raceRunning || particles.length > 0) requestAnimationFrame(loop);
}
function readRecords() {
  try { return JSON.parse(localStorage.getItem("bjorketorp-records") || "[]"); } catch (error) { return []; }
}
function saveRaceRecord(record) {
  const records = readRecords();
  records.push(record);
  records.sort((a, b) => a.time - b.time);
  try { localStorage.setItem("bjorketorp-records", JSON.stringify(records.slice(0, 8))); } catch (error) { /* storage can be disabled */ }
  return records.slice(0, 8);
}
function renderRecordTable(records) {
  recordTableBody.innerHTML = records.length ? records.map((record, index) =>
    `<tr><td>${index + 1}</td><td>${record.name}</td><td>${formatTime(record.time)}</td><td>${record.track}</td></tr>`
  ).join("") : "<tr><td colspan=\"4\">Inga rekord ännu – bli först!</td></tr>";
}
document.addEventListener("visibilitychange", () => {
  pageVisible = document.visibilityState === "visible";
  if (pageVisible) {
    lastTime = performance.now();
    if (raceRunning || particles.length > 0) requestAnimationFrame(loop);
  }
});
function endRace() {
  raceRunning = false;
  finishScene = { active: true, timer: 4, winner: false };
  const ranking = actors.slice().sort((a, b) => getRaceProgress(b) - getRaceProgress(a));
  const position = ranking.indexOf(actors[0]) + 1;
  finishScene.winner = position === 1;
  const bestKey = "bjorketorp-best-time";
  const previousBest = Number(localStorage.getItem(bestKey));
  const newBest = position === 1 && (!previousBest || raceTime < previousBest);
  if (newBest) localStorage.setItem(bestKey, String(raceTime));
  const records = saveRaceRecord({ name: selectedChicken.name, time: raceTime, track: selectedTrack.name });
  const completed = Number(localStorage.getItem("bjorketorp-races") || 0) + 1;
  const wins = Number(localStorage.getItem("bjorketorp-wins") || 0) + (position === 1 ? 1 : 0);
  localStorage.setItem("bjorketorp-races", String(completed)); localStorage.setItem("bjorketorp-wins", String(wins));
  for (let i = 0; i < 45; i++) addParticle(500 + Math.random() * 220, 250 + Math.random() * 90, { vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, height: 25 + Math.random() * 25, vz: 1.4 + Math.random(), gravity: .04, life: 2.2, size: 3 + Math.random() * 3, color: ["#d9654c", "#e1a52f", "#70a466", "#fff0bd"][i % 4], shape: "confetti" });
  finishTitle.textContent = position === 1 ? "Du tog hem det!" : `Du kom ${position}:a!`;
  finishCopy.textContent = position === 1 ? "Publiken på Björketorp marknad jublar – vilken hönshjälte!" : "Bra kämpat! Nästa gång tar du fler power-ups.";
  const legendMessage = raceTime < legendRecord ? "\nDu slog Emil “Kladdis” Callheims legendtid!" : `\n${formatTime(raceTime - legendRecord)} efter Kladdis gamla rekord.`;
  finishStats.textContent = `Tid: ${formatTime(raceTime)}${newBest ? "\nNytt personligt rekord!" : previousBest ? `\nBästa tid: ${formatTime(previousBest)}` : ""}${legendMessage}`;
  const challengeTarget = wins < 3 ? "Vinn 3 lopp" : completed < 5 ? "Kör 5 lopp" : "Mästare på gården!";
  const challengeProgress = wins < 3 ? `${wins}/3 segrar` : `${completed}/5 lopp`;
  finishProgress.textContent = `Utmaning: ${challengeTarget} (${challengeProgress}) · Power-ups använda: ${localStorage.getItem("bjorketorp-powerups") || 0}`;
  renderRecordTable(records);
  triggerCrowdReaction("finish", actors[0]);
  actors.slice(1).forEach(rival => triggerRivalReaction(rival, position === 1 ? "hit" : "overtake", position === 1 ? "Grattis då..." : "Nästa gång!"));
  playSfx(position === 1 ? "finish" : "bump");
  finishPanel.classList.remove("hidden");
}
document.addEventListener("keydown", e => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  if (e.key === "Escape" && raceRunning) {
    gamePaused = !gamePaused;
    pausePanel.classList.toggle("hidden", !gamePaused);
    render();
    return;
  }
  keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
});
document.addEventListener("keyup", e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
document.querySelectorAll("[data-control-key]").forEach(button => {
  const controlKey = button.dataset.controlKey;
  const press = event => { event.preventDefault(); keys.add(controlKey); };
  const release = event => { event.preventDefault(); keys.delete(controlKey); };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});
const touchItem = document.getElementById("touch-item");
touchItem.addEventListener("pointerdown", event => { event.preventDefault(); keys.add(" "); });
touchItem.addEventListener("pointerup", event => { event.preventDefault(); keys.delete(" "); });
touchItem.addEventListener("pointercancel", event => { event.preventDefault(); keys.delete(" "); });
touchItem.addEventListener("pointerleave", event => { event.preventDefault(); keys.delete(" "); });
document.getElementById("start-button").addEventListener("click", () => {
  selectedDifficulty = difficulty[document.querySelector("input[name=difficulty]:checked").value];
  selectedChicken = chickenTypes[document.querySelector("input[name=chicken]:checked").value];
  selectedTrack = trackLayouts[document.querySelector("input[name=track]:checked").value];
  startPanel.classList.add("hidden"); newRace();
});
document.getElementById("restart-button").addEventListener("click", () => { finishPanel.classList.add("hidden"); newRace(); });
document.getElementById("resume-button").addEventListener("click", () => { gamePaused = false; pausePanel.classList.add("hidden"); lastTime = performance.now(); });
document.getElementById("pause-restart-button").addEventListener("click", () => { pausePanel.classList.add("hidden"); newRace(); });
document.getElementById("menu-button").addEventListener("click", () => { gamePaused = false; raceRunning = false; pausePanel.classList.add("hidden"); finishPanel.classList.add("hidden"); startPanel.classList.remove("hidden"); setMusicTheme("menu"); drawWorld(); });
startPanel.addEventListener("pointerdown", () => {
  if (!musicEnabled) return;
  initAudio();
  if (musicTheme !== "menu") setMusicTheme("menu");
  if (!musicTimer) startMusic();
});
soundToggle.addEventListener("click", toggleSound);
musicToggle.addEventListener("click", toggleMusic);
setAudioButton(soundToggle, soundEnabled, "Ljud");
setAudioButton(musicToggle, musicEnabled, "Musik");
drawWorld();
