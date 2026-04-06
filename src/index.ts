import {
  Candle,
  OrderBook,
  RandomTrader,
  TrendFollower,
  MarketCorrectionTrader,
  MarketMaker,
  type eventType,
  Event,
  EventSystem,
} from "./main";

// ============================================================
// Canvas Setup
// ============================================================

const STARTING_PRICE = 500;
const CANDLE_WIDTH = 15;
const CANDLE_INTERVAL = 10; // ticks per candle

function initCanvas(id: string): {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const el = document.getElementById(id) as HTMLCanvasElement;
  if (!el) throw new Error(`Canvas #${id} not found`);
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error(`Canvas #${id} context missing`);
  return { el, ctx };
}

const { el: tradeCanvas, ctx } = initCanvas("monkey_trade");
const { el: priceCanvas, ctx: priceCtx } = initCanvas("price-axis");

tradeCanvas.width = window.innerWidth;
tradeCanvas.height = window.innerHeight;
priceCanvas.width = 200;
priceCanvas.height = window.innerHeight;

// ============================================================
// Price Axis
// ============================================================
function renderPriceAxis() {
  const h = priceCanvas.height;
  priceCtx.clearRect(0, 0, priceCanvas.width, h);
  priceCtx.setTransform(1, 0, 0, 1, 0, 0);
  priceCtx.font = "24px monospace";
  priceCtx.fillStyle = "rgba(255,255,255,0.6)";
  priceCtx.textAlign = "left";
  priceCtx.textBaseline = "middle";

  for (let i = 0; i < h; i += 100) {
    const y = h - i;
    priceCtx.fillStyle = "rgba(255,255,255,0.15)";
    priceCtx.fillRect(0, y, priceCanvas.width - 90, 1);
    priceCtx.fillStyle = "rgba(255,255,255,0.6)";
    priceCtx.fillText(i.toString(), 105, y);
  }
}

renderPriceAxis();

// ============================================================
// Zoom
// ============================================================

let scale = 1;

const zoomRange = document.getElementById("zoom-range") as HTMLInputElement;
zoomRange?.addEventListener("input", () => {
  scale = 10 * (Number(zoomRange.value) / 100 + 0.1);
  tradeCanvas.width = scale * window.innerWidth;
  tradeCanvas.height = scale * window.innerHeight;
  priceCanvas.height = scale * window.innerHeight;
  renderPriceAxis();
  redrawCandles();
});

// ============================================================
// Market Entities
// ============================================================

const orderBook = new OrderBook("Bananajs", STARTING_PRICE);
const randomTrader = new RandomTrader(1000, 100_000, orderBook);
const trendFollower = new TrendFollower(1000, 100_000, orderBook);
const marketCorrectionTrader = new MarketCorrectionTrader(
  1000,
  100_000,
  orderBook,
);
const marketMaker = new MarketMaker(100_000, 100_000_000, orderBook);

// ============================================================
// Event System
// ============================================================

const eventSystem = new EventSystem();
const affected_Markets = [orderBook];

const all_availableEvents: Record<eventType, Event[]> = {
  Bullish: [
    new Event(
      "Bumper Harvest",
      0.6,
      3_600_000,
      0.000_001,
      0.05,
      "Bullish",
      7_200_000,
      affected_Markets,
    ),
    new Event(
      "New Banana Peel Patent",
      0.3,
      1_800_000,
      0.000_05,
      0.15,
      "Bullish",
      3_600_000,
      affected_Markets,
    ),
  ],
  Bearish: [
    new Event(
      "Panama Disease Outbreak",
      -0.8,
      5_400_000,
      0.000_000_5,
      0.02,
      "Bearish",
      14_400_000,
      affected_Markets,
    ),
    new Event(
      "Monkey Labor Strike",
      -0.4,
      1_200_000,
      0.000_1,
      0.1,
      "Bearish",
      3_600_000,
      affected_Markets,
    ),
  ],
  Hype: [
    new Event(
      "Influencer Smoothie Trend",
      0.9,
      600_000,
      0.005,
      0.08,
      "Hype",
      1_800_000,
      affected_Markets,
    ),
  ],
  Panic: [
    new Event(
      "Potassium Overdose Scare",
      -0.95,
      900_000,
      0.008,
      0.01,
      "Panic",
      21_600_000,
      affected_Markets,
    ),
  ],
  OVERVALUED: [
    new Event(
      "Retail Euphoria",
      -0.2,
      2_400_000,
      0.000_1,
      0.2,
      "OVERVALUED",
      3_600_000,
      affected_Markets,
    ),
  ],
  UNDERVALUED: [
    new Event(
      "Deep Value Discovery",
      0.4,
      3_600_000,
      0.000_01,
      0.1,
      "UNDERVALUED",
      7_200_000,
      affected_Markets,
    ),
  ],
  TREND_BOOST: [
    new Event(
      "Smoothie Season Arrival",
      0.2,
      7_200_000,
      0.000_000_1,
      0.3,
      "TREND_BOOST",
      0,
      affected_Markets,
    ),
  ],
  TREND_EXHAUSTION: [
    new Event(
      "Banana Saturation",
      -0.1,
      1_800_000,
      0.000_1,
      0.4,
      "TREND_EXHAUSTION",
      0,
      affected_Markets,
    ),
  ],
};

// Tracks cooldown expiry times per event name
const eventCooldowns = new Map<string, number>();

function maybeFireEvents() {
  const now = Date.now();
  for (const events of Object.values(all_availableEvents)) {
    for (const event of events) {
      // Skip if on cooldown
      const cooldownUntil = eventCooldowns.get(event.name) ?? 0;
      if (now < cooldownUntil) continue;
      // Skip if already active in the system
      if (eventSystem.active_Events.some((e) => e.name === event.name))
        continue;
      // Roll against weight
      if (Math.random() < event.weight_of_occuring) {
        const fresh = new Event(
          event.name,
          event.dreadness,
          event.tick_duration,
          event.decayRate,
          event.weight_of_occuring,
          event.category,
          event.coolDown,
          affected_Markets,
        );
        eventSystem.addEvent(fresh);
        eventCooldowns.set(event.name, now + event.coolDown);
        console.log(`[EVENT] ${event.name} fired | dread=${event.dreadness}`);
      }
    }
  }
}

// ============================================================
// Trader Firing — sentiment-scaled
// ============================================================

function tickTraders(sentiment: number) {
  // const abs = Math.abs(sentiment);
  const abs = 0;
  randomTrader.placeOrder(10, randomTrader, sentiment);
  trendFollower.placeOrder(10, trendFollower, sentiment);
  marketCorrectionTrader.placeOrder(marketCorrectionTrader, sentiment);
  // marketMaker.placeOrder(1, marketMaker, sentiment);

 

  // Random traders flood market during panic/hype (1x → 5x)
  // const randomBurst = Math.max(1, Math.round(1 + abs * 4));
  // for (let i = 0; i < randomBurst; i++) {
  //   randomTrader.placeOrder(1, randomTrader, sentiment);
  // }

  // // Trend followers activate more when signal is clear
  // const trendProb = 0.3 + abs * 0.5;
  // if (Math.random() < trendProb) {
  //   trendFollower.placeOrder(1, trendFollower, sentiment);
  // }

  // // Correction traders suppressed during strong sentiment
  // const correctionProb = abs > 0.5 ? 0.15 : 0.6;
  // if (Math.random() < correctionProb) {
  //   marketCorrectionTrader.placeOrder(marketCorrectionTrader, sentiment);
  // }

  // Market maker always runs — but spread widens with sentiment (handled inside)
  // marketMaker.placeOrder(5, marketMaker, sentiment);

  
}

// ============================================================
// Order Book UI
// ============================================================

function renderOrderBook(
  buyMap: Map<number, number>,
  sellMap: Map<number, number>,
) {
  const buyContainer = document.getElementById("buyOrders");
  const sellContainer = document.getElementById("sellOrders");
  if (!buyContainer || !sellContainer) return;

  buyContainer.innerHTML = Array.from(buyMap.entries())
    .map(
      ([p, q]) =>
        `<div class="row buy"><span>${p}</span><span>${q}</span></div>`,
    )
    .join("");

  sellContainer.innerHTML = Array.from(sellMap.entries())
    .map(
      ([p, q]) =>
        `<div class="row sell"><span>${p}</span><span>${q}</span></div>`,
    )
    .join("");
}

// ============================================================
// Candle State
// ============================================================

const candles: Candle[] = [];
let tick = 0;
let candleX = 0;
let priceBefore = STARTING_PRICE;
let cameraOffset = 0;

function applyTransform(offset = cameraOffset) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(offset, tradeCanvas.height);
  ctx.scale(1, -1);
}

function redrawCandles() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, tradeCanvas.width, tradeCanvas.height);
  applyTransform();

  const start = Math.max(0, candles.length - 100);
  for (let i = start; i < candles.length; i++) {
    candles[i].draw();
    if (i > start) {
      const prev = candles[i - 1];
      const curr = candles[i];
      ctx.beginPath();
      ctx.moveTo(prev.posX, prev.close);
      ctx.lineTo(curr.posX, curr.close);
      ctx.strokeStyle = "rgba(100,149,237,0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

// ============================================================
// Game Loop
// ============================================================

function gameLoop() {
  // 1. Tick event system — prune expired events
  eventSystem.update();

  // 2. Maybe fire a new event this tick
  // maybeFireEvents();

  // 3. Get current sentiment and fire traders
  const sentiment = eventSystem.getMarketSentiment();
  // const sentiment = -0.1
  tickTraders(sentiment);

  // 4. Update price display
  tick++;
  const price = orderBook.Current_Market_SharePrice;
  const priceBtn = document.getElementById("price-btn");
  if (priceBtn) priceBtn.innerText = price.toFixed(2);

  // 5. Draw live price tick
  applyTransform();
  const liveCandle = new Candle(ctx, candleX, priceBefore, price);
  liveCandle.draw();

  // 6. Every CANDLE_INTERVAL ticks — commit candle and update order book UI
  if (tick % CANDLE_INTERVAL === 0) {
    const committed = new Candle(ctx, candleX, priceBefore, price);
    candles.push(committed);
    candleX += CANDLE_WIDTH;
    priceBefore = price;

    if (candleX > tradeCanvas.width / 2) {
      cameraOffset -= CANDLE_WIDTH;
    }

    renderOrderBook(
      orderBook.orderBookRecords().top20BuyOrders,
      orderBook.orderBookRecords().top20SellOrders,
    );
  }

  // 7. Redraw all committed candles
  redrawCandles();

  // 8. Stop after canvas fills up
  // if (tick > 1.5 * window.innerWidth) {
  //   clearInterval(loop);
  // }
}

const loop = setInterval(gameLoop, 10);

// ============================================================
// Drag to Scroll
// ============================================================

let dragStartX = 0;
let isDragging = false;

window.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.clientX;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  redrawCandles(); // redraw at current offset first

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, tradeCanvas.width, tradeCanvas.height);
  applyTransform(cameraOffset + dx);

  const start = Math.max(0, candles.length - 100 - Math.floor(Math.max(dx, 0)));
  for (let i = start; i < candles.length; i++) {
    candles[i].draw();
  }
});

window.addEventListener("mouseup", (e) => {
  if (!isDragging) return;
  cameraOffset += e.clientX - dragStartX;
  isDragging = false;
});
