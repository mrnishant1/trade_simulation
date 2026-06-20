import {
  Candle,
  Order,
  OrderBook,
  RandomTrader,
  TrendFollower,
  MarketCorrectionTrader,
  // MarketMaker,
  // type eventType,
  // Event,
  // EventSystem,
  Player,
} from "./main";
import { GLOBALGameState } from "./globalstate";

// ============================================================
// Market Entities
// ============================================================
const saved = localStorage.getItem("banana");
let Bananajs: OrderBook;
let firstOrderBookName = "Bananajs";
const STARTING_PRICE = 500;
if (saved) {
  const snapshot = JSON.parse(saved);
  // Reconstruct from saved data instead of hardcoded defaults
  Bananajs = OrderBook.fromJSON(snapshot);
  firstOrderBookName = Bananajs.ShareName;
} else {
  Bananajs = new OrderBook(firstOrderBookName, STARTING_PRICE);
}
const All_OrderBook = { [firstOrderBookName]: Bananajs };



//==============================Bot Trader instantiate=========================================
const randomTrader = new RandomTrader(
  { [firstOrderBookName]: { asset: Bananajs, assetQuntity: 1000 } },
  1000,
  All_OrderBook,
);
const trendFollower = new TrendFollower(
  { [firstOrderBookName]: { asset: Bananajs, assetQuntity: 1000 } },
  1000,
  All_OrderBook,
);
const marketCorrectionTrader = new MarketCorrectionTrader(
  { [firstOrderBookName]: { asset: Bananajs, assetQuntity: 1000 } },
  1000,
  All_OrderBook,
);
// const marketMaker = new MarketMaker(
//   { [firstOrderBookName]: { asset: Bananajs, assetQuntity: 1000 } },
//   100_000,
//   All_OrderBook,
// );

// ===================================================
// Experimenting with player (Not the final verson But JUGAAD version)
// ===================================================

//==============================Player =========================================
export const player = new Player({}, 2000, All_OrderBook);
const buybtn = document.getElementById("buy-btn");
const sellbtn = document.getElementById("sell-btn");
const orderDialog = document.getElementById("order-dialog");
const orderDialogTitle = document.getElementById("order-dialog-title");
const orderQtyInput = document.getElementById("order-qty-input") as HTMLInputElement | null;
const orderPriceInput = document.getElementById("order-price-input") as HTMLInputElement | null;
const orderHelperText = document.getElementById("order-helper-text");
const orderSubmitButton = document.getElementById("order-submit-button");
const orderCancelButton = document.getElementById("order-cancel-button");
const orderDialogCloseButton = document.getElementById("order-dialog-close");

type PlayerOrderType = "Buy" | "Sell";

let activePlayerOrder: Order | null = null;
let orderDialogType: PlayerOrderType | null = null;

function getPlayerHolding() {
  return player.assetInventory[firstOrderBookName]?.assetQuntity ?? 0;
}

function playerHasOrderInBook(order: Order) {
  const book = All_OrderBook[firstOrderBookName];
  const map = order.OrderType === "Buy"
    ? book.BuyOrders_Heap.All_BuyOrders_Map
    : book.SellOrders_Heap.All_SellOrders_Map;

  for (const list of map.priceMap.values()) {
    let node = list.head;
    while (node) {
      if (node.Order.OrderID === order.OrderID) return true;
      node = node.Next;
    }
  }

  return false;
}

function openOrderDialog(orderType: PlayerOrderType) {
  if (!orderDialog || !orderDialogTitle || !orderQtyInput || !orderPriceInput || !orderHelperText || !orderSubmitButton) return;

  const currentPrice = All_OrderBook[firstOrderBookName].Current_Market_SharePrice;
  const holding = getPlayerHolding();
  const maxAffordable = Math.floor(player.cashDeposit / currentPrice);

  if (orderType === "Sell" && holding <= 0) {
    alert("No BANANA available to sell.");
    return;
  }
  if (orderType === "Buy" && maxAffordable <= 0) {
    alert("Not enough cash to buy BANANA.");
    return;
  }

  orderDialogType = orderType;
  orderDialogTitle.textContent = `${orderType} BANANA`;
  orderQtyInput.value = "1";
  orderPriceInput.value = currentPrice.toFixed(2);
  orderHelperText.textContent = orderType === "Sell"
    ? `Max sell quantity: ${holding} BANANA.`
    : `Max buy quantity: ${maxAffordable} BANANA at current market price.`;
  orderSubmitButton.textContent = `${orderType} ORDER`;
  orderDialog.classList.add("visible");
}

function closeOrderDialog() {
  if (!orderDialog) return;
  orderDialog.classList.remove("visible");
  orderDialogType = null;
}

function submitOrderFromDialog() {
  if (!orderDialogType || !orderQtyInput || !orderPriceInput) return;

  const quantity = Math.floor(Number(orderQtyInput.value));
  const price = Number(orderPriceInput.value);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    alert("Please enter a valid price.");
    return;
  }

  if (orderDialogType === "Sell") {
    const holding = getPlayerHolding();
    if (holding <= 0) {
      alert("You have no BANANA to sell.");
      return;
    }
    if (quantity > holding) {
      alert(`You can only sell up to ${holding} BANANA.`);
      return;
    }
  }

  if (orderDialogType === "Buy") {
    const maxAffordable = Math.floor(player.cashDeposit / price);
    if (maxAffordable <= 0) {
      alert("Not enough cash to buy any BANANA at that price.");
      return;
    }
    if (quantity > maxAffordable) {
      alert(`You can only buy up to ${maxAffordable} BANANA at this price.`);
      return;
    }
  }

  placePlayerOrder(orderDialogType, quantity, price);
  closeOrderDialog();
}

function placePlayerOrder(orderType: PlayerOrderType, quantity: number, price: number) {
  const order = player.placeOrder(
    quantity,
    player,
    All_OrderBook[firstOrderBookName],
    price,
    orderType,
  );
  if (!order) {
    if (orderType === "Sell") {
      alert("Order failed: insufficient BANANA holdings.");
    } else {
      alert("Order failed: insufficient cash.");
    }
    return;
  }

  activePlayerOrder = order.Quantity > 0 ? order : null;
  console.log("player order placed", order);
  console.log(player.assetInventory);
  syncGlobalState();
}

if (buybtn != null && sellbtn != null) {
  buybtn.onclick = () => openOrderDialog("Buy");
  sellbtn.onclick = () => openOrderDialog("Sell");
}

if (orderCancelButton) {
  orderCancelButton.onclick = closeOrderDialog;
}
if (orderDialogCloseButton) {
  orderDialogCloseButton.onclick = closeOrderDialog;
}
if (orderSubmitButton) {
  orderSubmitButton.onclick = submitOrderFromDialog;
}

function updatePlayerBal() {
  let playerBal = document.getElementById("hud-balance");
  let playerWorth = document.getElementById("hud-worth");
  let profit_loss = document.getElementById("hud-pnl");
  const balance = player.cashDeposit;
  const monetryAsset = player.getPlayerWorth();
  if (playerBal && playerWorth && profit_loss) {
    playerBal.textContent = `$${balance.toFixed(2)}`;
    playerWorth.textContent = `$${monetryAsset.toFixed(2)}`;
    profit_loss.innerText = `$${(monetryAsset - 2000).toFixed(2)}`;
    profit_loss.style.color = monetryAsset - 2000 > 0 ? "green" : "red";
  }
}

function renderPlayerAssets() {
  const list = document.getElementById("player-assets-list");
  const preview = document.getElementById("player-assets-preview");
  const state = GLOBALGameState.player;

  const makeAssetHtml = (symbol: string, asset: { quantity: number; marketPrice: number; marketValue: number }) => {
    return `
      <div class="asset-item">
        <div class="asset-symbol">${symbol}</div>
        <div class="asset-details">
          <div>${asset.quantity} units</div>
          <div>${asset.marketPrice.toFixed(2)} USD</div>
        </div>
        <div class="asset-value">$${asset.marketValue.toFixed(2)}</div>
      </div>
    `;
  };

  if (list) {
    const entries = Object.entries(state.assets);
    list.innerHTML = entries.length
      ? entries.map(([symbol, asset]) => makeAssetHtml(symbol, asset)).join("")
      : `<div class="asset-empty">No assets held yet</div>`;
  }

  if (preview) {
    const assetCount = Object.keys(state.assets).length;
    const totalAssets = Object.values(state.assets).reduce((sum, asset) => sum + asset.marketValue, 0);
    preview.innerHTML = `
      <div class="asset-preview-row"><span>Cash</span><strong>$${state.cashDeposit.toFixed(2)}</strong></div>
      <div class="asset-preview-row"><span>Holdings</span><strong>$${totalAssets.toFixed(2)}</strong></div>
      <div class="asset-preview-row"><span>Net Worth</span><strong>$${state.netWorth.toFixed(2)}</strong></div>
      <div class="asset-preview-row"><span>Assets</span><strong>${assetCount}</strong></div>
    `;
  }
}

function renderOrderbookSummary() {
  const marketPrice = document.getElementById("market-price");
  const lastBuy = document.getElementById("last-buy");
  const lastSell = document.getElementById("last-sell");
  const priceBtn = document.getElementById("price-btn");
  const summary = GLOBALGameState.orderbooks[0];

  if (priceBtn && summary) {
    priceBtn.textContent = `$${summary.marketPrice.toFixed(2)}`;
  }
  if (marketPrice && summary) {
    marketPrice.textContent = `$${summary.marketPrice.toFixed(2)}`;
  }
  if (lastBuy) {
    lastBuy.textContent = summary.lastBuyOrder
      ? `${summary.lastBuyOrder.quantity} @ $${summary.lastBuyOrder.price.toFixed(2)}`
      : "—";
  }
  if (lastSell) {
    lastSell.textContent = summary.lastSellOrder
      ? `${summary.lastSellOrder.quantity} @ $${summary.lastSellOrder.price.toFixed(2)}`
      : "—";
  }
}

function renderPlayerActiveOrder() {
  const statusEl = document.getElementById("player-order-text");
  if (!statusEl) return;

  if (activePlayerOrder && playerHasOrderInBook(activePlayerOrder)) {
    statusEl.textContent = `${activePlayerOrder.OrderType} ${activePlayerOrder.Quantity} BANANA @ $${activePlayerOrder.AtPrice.toFixed(2)} (pending)`;
  } else {
    activePlayerOrder = null;
    statusEl.textContent = "No active unsettled order";
  }
}

function captureOrderSnapshot(orderBook: OrderBook) {
  const buyEntry = orderBook.BuyOrders_Heap.peak()?.Order;
  const sellEntry = orderBook.SellOrders_Heap.peak()?.Order;

  return {
    orderBookName: orderBook.ShareName,
    marketPrice: orderBook.Current_Market_SharePrice,
    lastBuyOrder: buyEntry
      ? {
          price: buyEntry.AtPrice,
          quantity: buyEntry.Quantity,
          time: buyEntry.time,
          trader: buyEntry.Order_PlacedBy.constructor.name,
        }
      : null,
    lastSellOrder: sellEntry
      ? {
          price: sellEntry.AtPrice,
          quantity: sellEntry.Quantity,
          time: sellEntry.time,
          trader: sellEntry.Order_PlacedBy.constructor.name,
        }
      : null,
  };
}

function syncGlobalState() {
  player.updatePlayerState(GLOBALGameState);
  GLOBALGameState.orderbooks = Object.values(All_OrderBook).map(captureOrderSnapshot);
  renderPlayerAssets();
  renderOrderbookSummary();
  renderPlayerActiveOrder();
  updatePlayerBal();
}

setInterval(syncGlobalState, 5000);
syncGlobalState();

function tickTraders(sentiment: number) {
  // const abs = Math.abs(sentiment);
  // const abs = 0;
  randomTrader.placeOrder(3, randomTrader, sentiment, Bananajs);
  trendFollower.placeOrder(10, trendFollower, sentiment, Bananajs);
  marketCorrectionTrader.placeOrder(
    marketCorrectionTrader,
    sentiment,
    Bananajs,
  );

}

// ============================================================
// Event System  (Has not yet implemented completely- workiing on it)
// ============================================================

// const eventSystem = new EventSystem();
// const affected_Markets = [Bananajs];

// const all_availableEvents: Record<eventType, Event[]> = {
//   Bullish: [
//     new Event(
//       "Bumper Harvest",
//       0.6,
//       3_600_000,
//       0.000_001,
//       0.05,
//       "Bullish",
//       7_200_000,
//       affected_Markets,
//     ),
//     new Event(
//       "New Banana Peel Patent",
//       0.3,
//       1_800_000,
//       0.000_05,
//       0.15,
//       "Bullish",
//       3_600_000,
//       affected_Markets,
//     ),
//   ],
//   Bearish: [
//     new Event(
//       "Panama Disease Outbreak",
//       -0.8,
//       5_400_000,
//       0.000_000_5,
//       0.02,
//       "Bearish",
//       14_400_000,
//       affected_Markets,
//     ),
//     new Event(
//       "Monkey Labor Strike",
//       -0.4,
//       1_200_000,
//       0.000_1,
//       0.1,
//       "Bearish",
//       3_600_000,
//       affected_Markets,
//     ),
//   ],
//   Hype: [
//     new Event(
//       "Influencer Smoothie Trend",
//       0.9,
//       600_000,
//       0.005,
//       0.08,
//       "Hype",
//       1_800_000,
//       affected_Markets,
//     ),
//   ],
//   Panic: [
//     new Event(
//       "Potassium Overdose Scare",
//       -0.95,
//       900_000,
//       0.008,
//       0.01,
//       "Panic",
//       21_600_000,
//       affected_Markets,
//     ),
//   ],
//   OVERVALUED: [
//     new Event(
//       "Retail Euphoria",
//       -0.2,
//       2_400_000,
//       0.000_1,
//       0.2,
//       "OVERVALUED",
//       3_600_000,
//       affected_Markets,
//     ),
//   ],
//   UNDERVALUED: [
//     new Event(
//       "Deep Value Discovery",
//       0.4,
//       3_600_000,
//       0.000_01,
//       0.1,
//       "UNDERVALUED",
//       7_200_000,
//       affected_Markets,
//     ),
//   ],
//   TREND_BOOST: [
//     new Event(
//       "Smoothie Season Arrival",
//       0.2,
//       7_200_000,
//       0.000_000_1,
//       0.3,
//       "TREND_BOOST",
//       0,
//       affected_Markets,
//     ),
//   ],
//   TREND_EXHAUSTION: [
//     new Event(
//       "Banana Saturation",
//       -0.1,
//       1_800_000,
//       0.000_1,
//       0.4,
//       "TREND_EXHAUSTION",
//       0,
//       affected_Markets,
//     ),
//   ],
// };

// Tracks cooldown expiry times per event name
// const eventCooldowns = new Map<string, number>();

// function maybeFireEvents() {
//   const now = Date.now();
//   for (const events of Object.values(all_availableEvents)) {
//     for (const event of events) {
//       // Skip if on cooldown
//       const cooldownUntil = eventCooldowns.get(event.name) ?? 0;
//       if (now < cooldownUntil) continue;
//       // Skip if already active in the system
//       if (eventSystem.active_Events.some((e) => e.name === event.name))
//         continue;
//       // Roll against weight
//       if (Math.random() < event.weight_of_occuring) {
//         const fresh = new Event(
//           event.name,
//           event.dreadness,
//           event.tick_duration,
//           event.decayRate,
//           event.weight_of_occuring,
//           event.category,
//           event.coolDown,
//           affected_Markets,
//         );
//         eventSystem.addEvent(fresh);
//         eventCooldowns.set(event.name, now + event.coolDown);
//         console.log(`[EVENT] ${event.name} fired | dread=${event.dreadness}`);
//       }
//     }
//   }
// }

// ============================================================
// Trader Firing — sentiment-scaled
// ============================================================


// ============================================================
// Canvas Setup
// ============================================================

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
// Order Book UI
// ============================================================

function renderOrderBook(
  buyMap: Map<number, number>,
  sellMap: Map<number, number>,
) {
  const buyContainer = document.getElementById("buyOrders");
  const sellContainer = document.getElementById("sellOrders");
  if (!buyContainer || !sellContainer) {
    console.log("no buycontainer");
    return;
  }

  buyContainer.innerHTML = Array.from(buyMap.entries())
    .map(
      ([p, q]) =>
        `<div class="order-row buy-row" style="position:relative;"><span>${p}</span><span class="order-qty; color='#';">${q}</span></div>`,
    )
    .join("");

  sellContainer.innerHTML = Array.from(sellMap.entries())
    .map(
      ([p, q]) =>
        `<div class="order-row sell-row" style="position:relative;"><span>${p}</span><span class="order-qty; color='#';">${q}</span></div>`,
    )
    .join("");
}

// ── LIVE CLOCK ──────────────────────────────────────────────
// function updateClock() {
//   const now = new Date();
//   const s = now.toUTCString().slice(17,25) + ' UTC';
//   document.getElementById('clock-hud')!.textContent = s;
//   document.getElementById('chart-time')!.textContent = s + ' · auto';
// }
// setInterval(updateClock, 1000);
// updateClock();

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

function drawPlayerOrderLine() {
  if (!activePlayerOrder) return;
  if (!playerHasOrderInBook(activePlayerOrder)) {
    activePlayerOrder = null;
    return;
  }

  const lineY = activePlayerOrder.AtPrice;
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = activePlayerOrder.OrderType === "Buy" ? "rgba(0,255,0,0.65)" : "rgba(255,0,0,0.65)";
  ctx.lineWidth = 2;
  ctx.moveTo(0, lineY);
  ctx.lineTo(tradeCanvas.width, lineY);
  ctx.stroke();
  ctx.restore();
}

function redrawCandles() {
  const start = Math.max(0, candles.length - 100);
  drawPlayerOrderLine();

  for (let i = start; i < candles.length; i++) {
    candles[i].draw();
    // Line following price candles
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
const CANDLE_WIDTH = 15;
const CANDLE_INTERVAL = 100; // ticks per candle

function gameLoop() {
  // 1. Tick event system — prune expired events
  // eventSystem.update();

  // 2. Maybe fire a new event this tick
  // maybeFireEvents();

  // 3. Get current sentiment and fire traders
  // const sentiment = eventSystem.getMarketSentiment();
  const sentiment = 0;
  tickTraders(sentiment);

  // 4. Update price display
  tick++;
  const price = Bananajs.Current_Market_SharePrice;
  const priceBtn = document.getElementById("price-btn");
  if (priceBtn) priceBtn.innerText = price.toFixed(2);

  // 5. Draw live price tick
  applyTransform();
  const liveCandle = new Candle(ctx, candleX, priceBefore, price);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, tradeCanvas.width, tradeCanvas.height);
  applyTransform();
  liveCandle.draw();

  // 6. Every CANDLE_INTERVAL ticks —> commit candle and update order book UI
  if (tick % CANDLE_INTERVAL === 0) {
    // 0. Player Balance update
    updatePlayerBal();

    const committed = new Candle(ctx, candleX, priceBefore, price);
    candles.push(committed);
    candleX += CANDLE_WIDTH;
    priceBefore = price;

    if (candleX > tradeCanvas.width / 2) {
      cameraOffset -= CANDLE_WIDTH;
    }
  }
  renderOrderBook(
    Bananajs.orderBookRecords().top20BuyOrders,
    Bananajs.orderBookRecords().top20SellOrders,
  );
  redrawCandles();

  // 7. Redraw all committed candles

  // 8. Stop after canvas fills up
  // if (tick > 3.5 * window.innerWidth) {
  //   const banana = Bananajs.toJSON();
  //   // Save — feels like storing the whole thing
  //   localStorage.setItem("banana", JSON.stringify(banana));

  //   clearInterval(loop);
  // }
}

// const loop = setInterval(gameLoop, 10);
setInterval(gameLoop, 10);

// ============================================================
// Drag to Scroll
// ============================================================

let dragStartX = 0;
// let dragStartY = 0;
let isDragging = false;

window.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  // dragStartY = e.clientY;
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

// ============================================================
// Zoom
// ============================================================
