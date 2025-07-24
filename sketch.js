/*
 * Combined Continuous Candlestick & Background Ticker Animation in p5.js
 * - Solid black background
 * - White candlestick graph (eased growth, centered vertically)
 * - Random tickers scrolling slowly in the background, fading in/out
 */

// ------------------- Candlestick Config -------------------
let candles = [];
const cSpacing = 30;
const cWidth   = 20;
const speed    = 2;
let tick = 0;
let growFrames;
let cameraX = 0;
let vMin, vMax;

// ease-in-out quadratic
function easeInOutQuad(p) {
  return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
}

// ------------------- Ticker Config -------------------
let textSizeVar           = 30;
let maxTickers            = 20;
let baseTickerSpeed       = 1.5;
let tickerDurationVar     = 20;      // seconds
let numberUpdateInterval  = 5000;

// Colors for tickers
let greenRatio            = 0.5;
let greenHex              = '#64E664';
let redHex                = '#E66464';
let useBWPalette          = false;
let bwGreenHex            = '#9D9D9D';
let bwRedHex              = '#3F3F3F';

// Font settings for tickers
let mainFontFile = 'Supply-Regular.otf';
let fallbackFont = 'sans-serif';
let mainFont;

// Internals for tickers
let tickers = [];
let lastTickerSpawn = 0;
let tickerDurationMs, tickerSpawnInterval;
let rowHeight, rowCount;
let greenColTicker, redColTicker;

function preload() {
  // Load font for tickers
  mainFont = loadFont(mainFontFile);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);

  // Candlesticks
  growFrames = cSpacing / speed;
  vMin = height * 0.15;
  vMax = height * 0.85;
  const n = ceil(width / cSpacing) + 2;
  let lastClose = height / 2;
  for (let i = 0; i < n; i++) {
    const c = generateCandle(lastClose);
    lastClose = c.close;
    c.worldX = i * cSpacing;
    c.spawnTick = -growFrames;
    candles.push(c);
  }

  // Tickers
  tickerDurationMs    = tickerDurationVar * 1000;
  tickerSpawnInterval = tickerDurationMs / maxTickers;
  rowHeight  = textSizeVar * 1.2;
  rowCount   = floor(height / rowHeight);
  greenColTicker = color(useBWPalette ? bwGreenHex : greenHex);
  redColTicker   = color(useBWPalette ? bwRedHex   : redHex);
  textAlign(LEFT, CENTER);
}

function generateCandle(prevClose) {
  const open = constrain(prevClose, vMin, vMax);
  let close  = open + random(-height * 0.1, height * 0.1);
  close = constrain(close, vMin, vMax);
  let high = max(open, close) + random(0, height * 0.05);
  high = constrain(high, vMin, vMax);
  let low  = min(open, close) - random(0, height * 0.05);
  low  = constrain(low, vMin, vMax);
  return { open, close, high, low };
}

function draw() {
  background(0);
  let now = millis();

  // --- Spawn & manage tickers ---
  if (now - lastTickerSpawn > tickerSpawnInterval && tickers.length < maxTickers) {
    // try random row without overlap
    let rows = shuffle(Array.from({ length: rowCount }, (_, i) => i), true);
    for (let r of rows) {
      let t = new Ticker(r);
      let startX = t.x;
      let endX   = startX + t.totalWidth;
      let clash = tickers.some(o => o.rowIndex === r && startX < o.x + o.totalWidth && o.x < endX);
      if (!clash) {
        tickers.push(t);
        break;
      }
    }
    lastTickerSpawn = now;
  }

  // update & draw tickers (background)
  for (let i = tickers.length - 1; i >= 0; i--) {
    let t = tickers[i];
    t.update();
    t.draw();
    if (t.isDead()) tickers.splice(i, 1);
  }

  // --- Candlestick animation ---
  tick++;
  cameraX += speed;
  if (tick % growFrames === 0) {
    const spawnX = cameraX + width * 2 / 3;
    const prevClose = candles.length ? candles[candles.length - 1].close : height / 2;
    let c = generateCandle(prevClose);
    c.worldX    = spawnX;
    c.spawnTick = tick;
    candles.push(c);
  }

  for (let i = candles.length - 1; i >= 0; i--) {
    const c = candles[i];
    const sx = c.worldX - cameraX;
    if (sx < -cSpacing) { candles.splice(i, 1); continue; }
    if (sx > width + cSpacing) continue;

    const elapsed = tick - c.spawnTick;
    const p = easeInOutQuad(constrain(elapsed / growFrames, 0, 1));
    const currOpen  = c.open;
    const currClose = c.open + (c.close - c.open) * p;
    let   currHigh  = c.open + (c.high  - c.open) * p;
    let   currLow   = c.open + (c.low   - c.open) * p;
    currHigh = constrain(currHigh, vMin, vMax);
    currLow  = constrain(currLow, vMin, vMax);

    stroke(255);
    strokeWeight(2);
    line(sx + cSpacing/2, currHigh, sx + cSpacing/2, currLow);
    noStroke(); fill(255);
    let top = min(currOpen, currClose);
    rect(sx + (cSpacing - cWidth)/2, top, cWidth, max(abs(currClose - currOpen),1), cWidth);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  vMin = height * 0.15;
  vMax = height * 0.85;
  rowHeight = textSizeVar * 1.2;
  rowCount  = floor(height / rowHeight);
}

// --------------------------------
// Ticker class (as provided)
// --------------------------------
class Ticker {
  constructor(rowIndex) {
    this.rowIndex = rowIndex;
    this.y        = rowIndex * rowHeight + rowHeight / 2;
    const banned = ["FUCK","SHIT","CUNT","PISS","DICK","COCK","TWAT","TITS",
      "DAMN","HELL","SLUT","FAGG","CRAP","SUCK","WANK","BLOW",
      "FART","BUTT","ANAL","DYKE","JERK","NOOB","PORN","CACA",
      "CUMS","GAYS","HOES","NUTS","SACK","SEXY","SUQS","TURD",
      "TOKE","HASH","BOOB","KUNT","PIMP","FAGS","HOAR","METH",
      "RAPE","ROFL","SNUF","TITS","WEED","XTCY","FODA","PUTA",
      "DAMN","CRAP","ANUS","ARSE","BDSM","BJAB","BANG","BURP",
      "DOPE","FAPS","FLOG","GASM","JIZZ","JUGS","KNOB","MOAN",
      "ORGY","PEEN","POOP","PRIK","PUKE","SKAN","SMUT","SPIT",
      "SUQS","TOKE","URIN","VIAG","VULV","WTFX","XXXO"];
    let sym;
    do {
      sym = Array.from({length:4}, () => String.fromCharCode(floor(random(65,91)))).join('');
    } while (banned.includes(sym));
    this.symbol = sym;
    this.isGreen = random() < greenRatio;
    this.arrow   = this.isGreen ? '▲' : '▼';
    this.col     = this.isGreen ? greenColTicker : redColTicker;

    textSize(textSizeVar);
    textFont(fallbackFont);
    this.widthMid = textWidth(this.arrow);
    this.randomizeNumbers();

    this.dir      = -1; // move left
    const marginM = 200;
    this.x        = width + marginM;
    this.speed    = random(baseTickerSpeed * 1, baseTickerSpeed * 1.5);
    this.lifespan = random(tickerDurationMs * 0.5, tickerDurationMs * 1.5);
    this.birth    = millis();
    this.nextUpdate = this.birth + random(0, numberUpdateInterval);
  }

  randomizeNumbers() {
    let p = random(100, 9999.99);
    this.price = p.toFixed(2);
    let c = this.isGreen ? random(0,20) : random(-10,0);
    this.change = c.toFixed(2);
    this.percent = random(0.01,10).toFixed(2) + '%';

    this.preText  = `${this.symbol} ${this.price} `;
    this.midText  = this.arrow;
    this.postText = ` ${this.change} (${this.percent})`;

    textSize(textSizeVar);
    textFont(mainFont);
    this.widthPre  = textWidth(this.preText);
    textFont(fallbackFont);
    this.widthMid  = textWidth(this.midText);
    textFont(mainFont);
    this.widthPost = textWidth(this.postText);
    this.totalWidth = this.widthPre + this.widthMid + this.widthPost;
  }

  update() {
    this.x -= this.speed * (deltaTime / 16.6667);
    let now = millis();
    if (now >= this.nextUpdate) {
      this.randomizeNumbers();
      this.nextUpdate += numberUpdateInterval;
    }
  }

  draw() {
    let age = millis() - this.birth;
    const fadeDur = 1000;
    let alpha = 255;
    if (age < fadeDur) alpha = map(age, 0, fadeDur, 0, 255);
    else if (age > this.lifespan - fadeDur)
      alpha = map(age, this.lifespan - fadeDur, this.lifespan, 255, 0);

    textSize(textSizeVar);
    fill(red(this.col), green(this.col), blue(this.col), alpha);
    textFont(mainFont);
    text(this.preText, this.x, this.y);
    textFont(fallbackFont);
    text(this.midText, this.x + this.widthPre, this.y);
    textFont(mainFont);
    text(this.postText, this.x + this.widthPre + this.widthMid, this.y);
  }

  isDead() {
    return millis() - this.birth > this.lifespan;
  }
}
