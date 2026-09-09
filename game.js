const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const startPanel = document.getElementById("start-panel");
const finishPanel = document.getElementById("finish-panel");
const finishTitle = document.getElementById("finish-title");
const finishCopy = document.getElementById("finish-copy");
const finishStats = document.getElementById("finish-stats");
const pausePanel = document.getElementById("pause-panel");

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
const spriteAnimations = {
  idle: { frames: [0, 1, 2, 3], fps: 5 },
  run: { frames: [0, 1, 2, 3, 4, 5], fps: 12 },
  boost: { frames: [3, 4, 5], fps: 16 }
};
const chickenTypes = {
  original: { name: "Gårds-Greta", baseSpeed: 2.45, boostSpeed: 3.9, boostDuration: 2.6, gear: "glasses" },
  rocket: { name: "Raket-Ragnhild", baseSpeed: 2.75, boostSpeed: 4.8, boostDuration: 3.4, gear: "flames" },
  armor: { name: "Pansar-Pär", baseSpeed: 2.25, boostSpeed: 3.6, boostDuration: 2.6, gear: "armor", resistance: true },
  bomber: { name: "Ägg-Bombaren", baseSpeed: 2.4, boostSpeed: 3.8, boostDuration: 2.6, gear: "cigar", startingItem: "muck" }
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
  { x: 900, y: 385, type: "muck", active: true, respawnTimer: 0 }
];
let pickupSpawnPoints = {
  boost: [{ x: 440, y: 102 }, { x: 585, y: 112 }, { x: 805, y: 165 }, { x: 265, y: 505 }],
  muck: [{ x: 900, y: 385 }, { x: 735, y: 485 }, { x: 205, y: 405 }, { x: 105, y: 285 }]
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
      muck: [{ x: 915, y: 360 }, { x: 560, y: 570 }, { x: 150, y: 300 }, { x: 300, y: 105 }]
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
      muck: [{ x: 520, y: 205 }, { x: 850, y: 490 }, { x: 150, y: 430 }, { x: 210, y: 180 }]
    },
    palette: { grass: "#93b878", grassLight: "#a8c987", grassDark: "#789f69", roadEdge: "#e2c188", roadBorder: "#9d7047", road: "#bd9562", leaf: "#47784a" }
  }
};
let actors = [], thrownObjects = [], mudBombs = [], particles = [], raceRunning = false, gamePaused = false, countdown = 0, pageVisible = true, raceTime = 0, lastTime = 0, selectedDifficulty = difficulty.normal, selectedChicken = chickenTypes.original, selectedTrack = trackLayouts.market;
let message = "", messageTimer = 0;
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
  { speaker: 4, target: 2, text: "En gud kan tydligen ha dåliga kvitton också." }
];

function configureTrack(layout) {
  route = layout.route;
  trackModel.centerline = route;
  obstacles = layout.obstacles;
  pickupSpawnPoints = layout.pickupSpawnPoints;
  Object.assign(visualStyle, layout.palette);
  pickups.forEach(pickup => {
    const point = pickupSpawnPoints[pickup.type][0];
    pickup.x = point.x;
    pickup.y = point.y;
  });
}

function newRace() {
  configureTrack(selectedTrack);
  actors = [
    { name: selectedChicken.name, color: "#f5e5a4", sprite: "playerChicken", animTime: 0, x: 110, y: 300, angle: 0, facing: 1, speed: 0, lap: 0, waypoint: 0, finishArmed: false, boost: 0, item: selectedChicken.startingItem || null, player: true, obstacleCooldown: 0, slowTimer: 0, dazed: 0, chickenType: selectedChicken },
    { name: "Agda", color: "#d9654c", scarf: "#e1a52f", raceLook: "glasses", sprite: "opponentChicken", animTime: 0, x: 125, y: 330, angle: 0, facing: 1, speed: selectedDifficulty.speed, baseSpeed: selectedDifficulty.speed, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 1, obstacleCooldown: 0, slowTimer: 0, dazed: 0 },
    { name: "Berta", color: "#70a466", scarf: "#70a466", raceLook: "spikes", sprite: "opponentChicken", animTime: 0, x: 140, y: 360, angle: 0, facing: 1, speed: selectedDifficulty.speed * .96, baseSpeed: selectedDifficulty.speed * .96, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 2, obstacleCooldown: 0, slowTimer: 0, dazed: 0 },
    { name: "Cilla", color: "#73506e", scarf: "#73506e", raceLook: "cigar", sprite: "opponentChicken", animTime: 0, x: 155, y: 390, angle: 0, facing: 1, speed: selectedDifficulty.speed * .93, baseSpeed: selectedDifficulty.speed * .93, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 3, obstacleCooldown: 0, slowTimer: 0, dazed: 0 },
    { name: "Doris", color: "#48658c", scarf: "#48658c", raceLook: "flames", sprite: "opponentChicken", animTime: 0, x: 170, y: 420, angle: 0, facing: 1, speed: selectedDifficulty.speed * .9, baseSpeed: selectedDifficulty.speed * .9, lap: 0, waypoint: 0, finishArmed: false, ai: true, seed: 4, obstacleCooldown: 0, slowTimer: 0, dazed: 0 }
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
  countdown = 3;
  gamePaused = false;
  pausePanel.classList.add("hidden");
  message = "Följ vägen och kör tre hela varv";
  messageTimer = 3;
  raceRunning = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function iso(x, y) { return { x: W / 2 + (x - y) * .75, y: 65 + (x + y) * .39 }; }
function drawPath(points, width, color) {
  ctx.beginPath();
  points.forEach((p, i) => { const q = iso(p.x, p.y); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
  ctx.closePath(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
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
  drawDecorations(); drawMarket(); drawCrowd();
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
      ctx.beginPath(); ctx.arc(q.x, q.y - particle.height, particle.size, 0, Math.PI * 2); ctx.fill();
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
    ctx.fillStyle = "#d97932"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
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
  if (isSafeDecorationPosition(60, 650, 100)) drawTractor(60, 650);
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
  ctx.fillStyle = "#35251d"; ctx.beginPath(); ctx.arc(q.x - 18, q.y + 8, 8, 0, Math.PI * 2); ctx.arc(q.x + 18, q.y + 8, 8, 0, Math.PI * 2); ctx.fill();
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
  ctx.strokeStyle = "#e1a52f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y - 11, 17, Math.PI, 0); ctx.stroke();
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
  colors.forEach((color, index) => {
    const x = 330 + index * 58;
    ctx.fillStyle = "#8a5b36"; ctx.fillRect(x, 28, 3, 22);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 3, 30); ctx.lineTo(x + 33, 37); ctx.lineTo(x + 3, 44); ctx.closePath(); ctx.fill();
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
  ctx.fillStyle = "#35251d"; ctx.fillRect(-42, -28, 84, 32);
  ctx.fillStyle = "#f1cf58"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.fillText("DEPÅ", 0, -61);
  ctx.fillStyle = "#9a6338"; ctx.fillRect(-58, -18, 12, 12); ctx.fillRect(46, -18, 12, 12);
  ctx.fillStyle = "#35251d"; ctx.beginPath(); ctx.arc(-30, 11, 10, 0, Math.PI * 2); ctx.arc(31, 11, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e1a52f"; ctx.fillRect(-4, -13, 8, 15);
  ctx.restore();
  drawPitCrew(q.x - 62, q.y - 7, "#48658c", "MACKAN");
  drawPitCrew(q.x + 55, q.y - 5, "#e1a52f", "SIV");
  drawPitChicken(q.x, q.y - 13);
}
function drawPitCrew(x, y, color, name) {
  ctx.fillStyle = color; ctx.fillRect(x - 7, y - 18, 14, 20);
  ctx.fillStyle = "#f2c497"; ctx.fillRect(x - 6, y - 27, 12, 10);
  ctx.fillStyle = "#35251d"; ctx.fillRect(x - 8, y - 30, 16, 4);
  ctx.fillStyle = "#fff0bd"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"; ctx.fillText(name, x, y + 11); ctx.textAlign = "left";
  ctx.strokeStyle = "#8a5b36"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 7, y - 8); ctx.lineTo(x + 18, y - 17); ctx.stroke();
  ctx.fillStyle = "#d6a33e"; ctx.fillRect(x + 16, y - 21, 7, 7);
}
function drawPitChicken(x, y) {
  const bob = Math.sin(performance.now() / 180) * 2;
  ctx.save(); ctx.translate(x, y + bob); ctx.fillStyle = "#f5e5a4"; ctx.fillRect(-15, -12, 30, 18);
  ctx.fillStyle = "#d64d37"; ctx.fillRect(8, -22, 8, 7); ctx.fillStyle = "#35251d"; ctx.fillRect(14, -17, 3, 3);
  ctx.fillStyle = "#e3a52d"; ctx.fillRect(17, -14, 9, 4); ctx.fillStyle = "#f1cf58"; ctx.fillRect(-6, -25, 12, 4);
  ctx.restore();
}
function drawBackgroundLife() {
  const now = performance.now();
  const wave = Math.sin(now / 350) * 3;
  ctx.fillStyle = "#35251d"; ctx.fillRect(780, 58 + wave, 3, 3); ctx.fillRect(790, 50 + wave, 3, 3); ctx.fillRect(800, 58 + wave, 3, 3);
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(520, 105 + wave, 5, 5); ctx.fillRect(527, 101 + wave, 5, 5);
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
function drawTractor(x, y) {
  const q = iso(x, y);
  ctx.fillStyle = "#35251d"; ctx.beginPath(); ctx.arc(q.x - 18, q.y + 9, 13, 0, Math.PI * 2); ctx.arc(q.x + 20, q.y + 9, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#b44732"; ctx.fillRect(q.x - 22, q.y - 11, 43, 22);
  ctx.fillStyle = "#d9654c"; ctx.fillRect(q.x - 2, q.y - 31, 21, 23);
  ctx.fillStyle = "#9cc0bd"; ctx.fillRect(q.x + 2, q.y - 27, 14, 11);
  ctx.fillStyle = "#e1a52f"; ctx.fillRect(q.x - 28, q.y - 8, 8, 6);
  ctx.strokeStyle = "#35251d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q.x + 20, q.y + 3); ctx.lineTo(q.x + 45, q.y + 14); ctx.lineTo(q.x + 57, q.y + 8); ctx.stroke();
  ctx.fillStyle = "#8a5b36"; ctx.fillRect(q.x + 43, q.y + 6, 24, 15);
  ctx.fillStyle = "#70a466"; ctx.fillRect(q.x + 48, q.y + 3, 14, 4);
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
  ctx.fillStyle = "#fff0bd"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText(text, q.x, q.y - 10); ctx.textAlign = "left";
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
  ctx.fillStyle = "#fff3c6"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.fillText("MARKNAD", q.x, q.y + 2); ctx.textAlign = "left";
}
function drawCrowd() {
  const wave = Math.sin(performance.now() / 180) * 4;
  crowdSpectators.forEach(s => {
    const q = iso(s.x, s.y);
    ctx.fillStyle = "#4d3a2d55"; ctx.fillRect(q.x - 11, q.y + 5, 22, 5);
    ctx.fillStyle = s.color; ctx.fillRect(q.x - 9, q.y - 5, 18, 17);
    ctx.fillStyle = "#f2c497"; ctx.fillRect(q.x - 7, q.y - 18, 14, 13);
    ctx.fillStyle = s.hat; ctx.fillRect(q.x - 10, q.y - 23, 20, 5); ctx.fillRect(q.x - 5, q.y - 28, 11, 5);
    ctx.fillStyle = "#35251d"; ctx.fillRect(q.x - 4, q.y - 14, 3, 3); ctx.fillRect(q.x + 4, q.y - 14, 3, 3);
    ctx.fillStyle = "#b44732"; ctx.fillRect(q.x - 4, q.y - 8, 9, 3);
    ctx.strokeStyle = s.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x + 8, q.y - 1); ctx.lineTo(q.x + 15, q.y - 15 + wave); ctx.stroke();
    ctx.fillStyle = "#f2c497"; ctx.fillRect(q.x + 12, q.y - 18 + wave, 7, 7);
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
  ctx.font = "700 10px sans-serif";
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
  ctx.fillStyle = "#fff7e7";
  ctx.strokeStyle = "#35251d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bubbleX - width / 2, bubbleY, width, height, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff7e7";
  ctx.beginPath();
  ctx.moveTo(bubbleX + direction * 18, bubbleY + height);
  ctx.lineTo(bubbleX + direction * 30, bubbleY + height);
  ctx.lineTo(q.x + direction * 8, q.y - 56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#35251d";
  ctx.font = "700 10px sans-serif";
  ctx.textAlign = "center";
  lines.forEach((item, index) => ctx.fillText(item, bubbleX, bubbleY + 14 + index * 13));
  ctx.restore();
  ctx.textAlign = "left";
}
function updateCrowdDialogue(dt) {
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
function drawObstacle(o) {
  const q = iso(o.x, o.y); ctx.save(); ctx.translate(q.x, q.y);
  const sprite = sprites[o.type === "mud" ? "mudPuddle" : "hayBale"];
  if (sprite) {
    ctx.drawImage(sprite, o.type === "mud" ? -48 : -40, o.type === "mud" ? -24 : -32);
    ctx.restore(); return;
  }
  if (o.type === "mud") {
    ctx.fillStyle = "#563a29"; ctx.beginPath(); ctx.ellipse(0, 6, 34, 16, -.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#815b39"; ctx.beginPath(); ctx.ellipse(-5, 0, 25, 9, -.1, 0, Math.PI * 2); ctx.fill();
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
  if (sprite) {
    ctx.drawImage(sprite, -24, -24);
    ctx.font = "700 9px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff8dc"; ctx.fillText(p.type === "boost" ? "FART" : "LERA", 0, 34);
    ctx.restore(); ctx.textAlign = "left"; return;
  }
  ctx.fillStyle = "#fff8dc"; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.type === "boost" ? visualStyle.boostGold : visualStyle.mud; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff8dc"; ctx.font = "bold 17px sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.type === "boost" ? "»" : "!", 0, 6);
  ctx.font = "700 9px sans-serif"; ctx.fillText(p.type === "boost" ? "SÄLLSYNT FART" : "SÄLLSYNT LERA", 0, 28);
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
    ctx.drawImage(sprite, frame * 96, 0, 96, 96, -48, -78, 96, 96);
    drawRaceLook(raceLook, false);
    if (a.scarf) { ctx.fillStyle = a.scarf; ctx.fillRect(-15, 0, 25, 5); ctx.fillRect(8, 3, 5, 14); }
    if (a.boost > 0) {
      drawBoostChaos(a);
    }
    drawDazedEffect(a);
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
      if (!behind && look === "glasses") {
        ctx.fillStyle = "#35251d"; ctx.fillRect(61 - 48, -47, 14, 7); ctx.fillRect(79 - 48, -47, 14, 7); ctx.fillRect(75 - 48, -45, 6, 3);
      }
      if (!behind && look === "cigar") {
        ctx.fillStyle = "#8a5b36"; ctx.fillRect(38, -39, 14, 4); ctx.fillStyle = "#f1cf58"; ctx.fillRect(51, -39, 3, 4);
      }
      if (!behind && look === "armor") {
        ctx.fillStyle = "#68727a"; ctx.strokeStyle = "#35251d"; ctx.lineWidth = 3; ctx.fillRect(-22, -4, 44, 18); ctx.strokeRect(-22, -4, 44, 18);
        ctx.fillStyle = "#bfc8c5"; ctx.fillRect(-14, -1, 8, 8); ctx.fillRect(6, -1, 8, 8);
      }
    }
    ctx.fillStyle = "#fff8dc"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText(a.name, 0, -82);
    ctx.restore(); ctx.textAlign = "left"; return;
  }
  ctx.fillStyle = "#4d3a2d55"; ctx.beginPath(); ctx.ellipse(0, 23, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d6a33e"; ctx.fillRect(-9, 10, 4, 13); ctx.fillRect(5, 10, 4, 13);
  ctx.fillStyle = a.color; ctx.beginPath(); ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff0bd"; ctx.beginPath(); ctx.ellipse(-5, 3, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -9, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d64d37"; ctx.fillRect(11, -21, 6, 6); ctx.fillRect(18, -18, 5, 5);
  ctx.fillStyle = "#35251d"; ctx.beginPath(); ctx.arc(17, -11, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e3a52d"; ctx.beginPath(); ctx.moveTo(22, -7); ctx.lineTo(33, -2); ctx.lineTo(22, 2); ctx.fill();
  if (a.boost > 0) drawBoostChaos(a);
  drawDazedEffect(a);
  ctx.fillStyle = "#fff8dc"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText(a.name, 0, -29); ctx.restore(); ctx.textAlign = "left";
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
  ctx.font = "700 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DAZED!", 0, 25);
  ctx.restore();
  ctx.textAlign = "left";
}
function movePlayer(a, dt) {
  let dx = 0, dy = 0; if (keys.has("ArrowLeft") || keys.has("a")) dx--; if (keys.has("ArrowRight") || keys.has("d")) dx++; if (keys.has("ArrowUp") || keys.has("w")) dy--; if (keys.has("ArrowDown") || keys.has("s")) dy++;
  const length = Math.hypot(dx, dy) || 1;
  const normalMax = a.chickenType.baseSpeed, boostMax = a.chickenType.boostSpeed;
  const max = a.dazed > 0 ? normalMax * .16 : a.boost > 0 ? boostMax : a.slowTimer > 0 ? normalMax * .42 : normalMax;
  a.speed += (max - a.speed) * .12;
  if (dx || dy) { a.x += dx / length * a.speed * dt; a.y += dy / length * a.speed * dt; a.angle = Math.atan2(dy, dx); a.facing = dx < 0 ? -1 : 1; }
  a.x = Math.max(50, Math.min(1020, a.x)); a.y = Math.max(60, Math.min(600, a.y)); a.boost = Math.max(0, a.boost - dt / 60); a.slowTimer = Math.max(0, a.slowTimer - dt / 60); a.dazed = Math.max(0, a.dazed - dt / 60);
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
  const wobble = Math.sin(performance.now() / 550 + a.seed) * selectedDifficulty.wobble; a.angle = Math.atan2(dy, dx) + wobble; a.facing = dx < 0 ? -1 : 1;
  const currentSpeed = a.dazed > 0 ? a.baseSpeed * .16 : a.slowTimer > 0 ? a.baseSpeed * .42 : a.baseSpeed;
  a.speed = currentSpeed;
  a.x += Math.cos(a.angle) * currentSpeed * dt; a.y += Math.sin(a.angle) * currentSpeed * dt;
  a.dazed = Math.max(0, a.dazed - dt / 60);
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
      if (a.player) { message = p.type === "boost" ? "Fartägg plockat! Tryck SPACE." : "Lerbomb plockad! Tryck SPACE."; messageTimer = 2.5; }
    }
  });
  a.obstacleCooldown = Math.max(0, a.obstacleCooldown - 1 / 60);
  a.slowTimer = Math.max(0, a.slowTimer - 1 / 60);
  if (a.obstacleCooldown === 0 && obstacles.some(o => Math.hypot(a.x - o.x, a.y - o.y) < 40)) {
    if (a.player) a.speed *= a.chickenType.resistance ? .95 : .7;
    a.slowTimer = a.player && a.chickenType.resistance ? .35 : 1.5; a.obstacleCooldown = 1.2;
    for (let i = 0; i < 7; i++) addParticle(a.x, a.y, { vx: (Math.random() - .5) * .9, vy: (Math.random() - .5) * .9, height: 8, vz: 1.2, gravity: .05, life: .7, size: 3, color: "#795238" });
    if (a.player) { message = "Aj! Leran/höbalen bromsar dig."; messageTimer = 1.2; }
  }
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
      message = "Publiken kastade en flaska! Du blev DAZED."; messageTimer = 1.8;
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
    }
  });
  mudBombs = mudBombs.filter(bomb => bomb.life > 0);
}
function update(dt) {
  if (countdown > 0) {
    countdown = Math.max(0, countdown - dt / 60);
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
      if (a.player) { message = "Mållinjen passerad! Nytt varv!"; messageTimer = 1; }
    }
    a.animTime += dt / 60;
    if (a.speed > .5 && Math.random() < .08 * dt) {
      addParticle(a.x - a.facing * 16, a.y + 8, { vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, height: 1, vz: .18, gravity: .01, life: .45, size: 2.5, color: "#d8b477" });
    }
    if (a.player && a.boost > 0 && Math.random() < .16 * dt) {
      addParticle(a.x - a.facing * 28, a.y, { vx: -a.facing * .5, vy: (Math.random() - .5) * .5, height: 7, vz: .2, gravity: .01, life: .4, size: 3, color: Math.random() < .5 ? "#d9654c" : "#f1cf58" });
    }
    checkItems(a);
  });
  updateThrownObjects(dt);
  updateMudBombs(dt);
  updatePickupRespawns(dt);
  updateCrowdDialogue(dt);
  updateParticles(dt);
  trackWarningCooldown = Math.max(0, trackWarningCooldown - dt / 60);
  const p = actors[0];
  if (keys.has(" ") && p.item) {
    if (p.item === "boost") { p.boost = p.chickenType.boostDuration; message = p.chickenType.gear === "rocket" ? "RAKETMOTORERNA TÄNDA! Håll i hönan!" : "FARTBOOST! Hönan rusar iväg."; }
    else { throwMudBomb(p); message = "LERBOMB! Siktar på närmaste motståndare."; }
    messageTimer = 1.8; p.item = null; keys.delete(" ");
  }
  messageTimer = Math.max(0, messageTimer - dt / 60);
  if (p.lap >= lapsToWin) endRace();
}
function drawHud() {
  const p = actors[0]; ctx.fillStyle = "#35251dcc"; ctx.fillRect(18, 18, 310, 112);
  ctx.fillStyle = "#fff7e7"; ctx.font = "700 16px sans-serif"; ctx.fillText(`Varv ${Math.min(p.lap + 1, lapsToWin)} / ${lapsToWin}`, 34, 45);
  ctx.font = "14px sans-serif"; ctx.fillText(p.item ? `Power-up redo: ${p.item === "boost" ? "Fartägg" : "Lerbomb"} (SPACE)` : "Power-up: inget redo", 34, 70);
  ctx.fillText("Följ banan till mållinjen", 34, 94);
  ctx.fillStyle = "#f3ce76"; ctx.font = "11px sans-serif"; ctx.fillText(`Kladdis rekord: ${formatTime(legendRecord)}`, 34, 110);
  ctx.textAlign = "right"; ctx.font = "700 16px sans-serif"; ctx.fillText(formatTime(raceTime), W - 24, 44); ctx.font = "12px sans-serif"; ctx.fillText("TID", W - 24, 63); ctx.textAlign = "left";
  if (messageTimer > 0) {
    ctx.font = "700 15px sans-serif";
    const panelWidth = Math.min(W - 40, Math.max(300, ctx.measureText(message).width + 42));
    const panelX = (W - panelWidth) / 2;
    ctx.fillStyle = "#35251d";
    ctx.fillRect(panelX + 3, 15, panelWidth, 32);
    ctx.fillStyle = "#fff0bd";
    ctx.fillRect(panelX, 12, panelWidth, 32);
    ctx.strokeStyle = "#6f432d";
    ctx.lineWidth = 3;
    ctx.strokeRect(panelX, 12, panelWidth, 32);
    ctx.fillStyle = "#35251d";
    ctx.textAlign = "center";
    ctx.fillText(message, W / 2, 34);
    ctx.textAlign = "left";
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
  drawParticles();
  if (crowdSpeech) drawCrowdSpeech(crowdSpeech);
  drawHud(); drawCountdown();
}
function drawCountdown() {
  if (countdown <= 0) return;
  const label = countdown > 2 ? "3" : countdown > 1 ? "2" : "1";
  ctx.fillStyle = "#35251dcc"; ctx.fillRect(W / 2 - 70, H / 2 - 78, 140, 140);
  ctx.fillStyle = "#f1cf58"; ctx.font = "bold 86px sans-serif"; ctx.textAlign = "center"; ctx.fillText(label, W / 2, H / 2 + 28);
  ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "#fff0bd"; ctx.fillText("GÖR DIG REDO!", W / 2, H / 2 + 55); ctx.textAlign = "left";
}
function loop(now) {
  if (!pageVisible) return;
  if (!raceRunning && particles.length === 0) return;
  const dt = Math.min((now - lastTime) / 16.67, 2); lastTime = now;
  if (raceRunning && !gamePaused) update(dt); else if (!gamePaused) updateParticles(dt);
  render();
  if (raceRunning || particles.length > 0) requestAnimationFrame(loop);
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
  const ranking = actors.slice().sort((a, b) => getRaceProgress(b) - getRaceProgress(a));
  const position = ranking.indexOf(actors[0]) + 1;
  const bestKey = "bjorketorp-best-time";
  const previousBest = Number(localStorage.getItem(bestKey));
  const newBest = position === 1 && (!previousBest || raceTime < previousBest);
  if (newBest) localStorage.setItem(bestKey, String(raceTime));
  for (let i = 0; i < 45; i++) addParticle(500 + Math.random() * 220, 250 + Math.random() * 90, { vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, height: 25 + Math.random() * 25, vz: 1.4 + Math.random(), gravity: .04, life: 2.2, size: 3 + Math.random() * 3, color: ["#d9654c", "#e1a52f", "#70a466", "#fff0bd"][i % 4], shape: "confetti" });
  finishTitle.textContent = position === 1 ? "Du tog hem det!" : `Du kom ${position}:a!`;
  finishCopy.textContent = position === 1 ? "Publiken på Björketorp marknad jublar – vilken hönshjälte!" : "Bra kämpat! Nästa gång tar du fler power-ups.";
  const legendMessage = raceTime < legendRecord ? "\nDu slog Emil “Kladdis” Callheims legendtid!" : `\n${formatTime(raceTime - legendRecord)} efter Kladdis gamla rekord.`;
  finishStats.textContent = `Tid: ${formatTime(raceTime)}${newBest ? "\nNytt personligt rekord!" : previousBest ? `\nBästa tid: ${formatTime(previousBest)}` : ""}${legendMessage}`;
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
document.getElementById("start-button").addEventListener("click", () => {
  selectedDifficulty = difficulty[document.querySelector("input[name=difficulty]:checked").value];
  selectedChicken = chickenTypes[document.querySelector("input[name=chicken]:checked").value];
  selectedTrack = trackLayouts[document.querySelector("input[name=track]:checked").value];
  startPanel.classList.add("hidden"); newRace();
});
document.getElementById("restart-button").addEventListener("click", () => { finishPanel.classList.add("hidden"); newRace(); });
document.getElementById("resume-button").addEventListener("click", () => { gamePaused = false; pausePanel.classList.add("hidden"); lastTime = performance.now(); });
document.getElementById("pause-restart-button").addEventListener("click", () => { pausePanel.classList.add("hidden"); newRace(); });
document.getElementById("menu-button").addEventListener("click", () => { gamePaused = false; raceRunning = false; pausePanel.classList.add("hidden"); finishPanel.classList.add("hidden"); startPanel.classList.remove("hidden"); drawWorld(); });
drawWorld();
