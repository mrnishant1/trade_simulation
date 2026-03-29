import {
  Candle,
  OrderBook,
  RandomTrader,
  TrendFollower,
  MarketCorrectionTrader,
  MarketMaker,
} from "./main";

let scale = 1;
let GlobalHeight = scale * window.innerHeight;
let GlobalWidth = scale * window.innerWidth;

//canvas:1 of================trade candles=================
const canvas = document.getElementById("monkey_trade") as HTMLCanvasElement;
if (!canvas) throw new Error("Canvas not found");
canvas.width = GlobalWidth;
canvas.height = GlobalHeight;
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas context missing");

//canvas:2 of================price axis===================
const priceCanvas = document.getElementById("price-axis") as HTMLCanvasElement;
const priceContext = priceCanvas.getContext("2d");
if (!priceCanvas) throw new Error("Canvas not found");
priceCanvas.width = 200;
priceCanvas.height = GlobalHeight;
priceContext!.translate(0, priceCanvas.height);
priceContext?.scale(1, -1);
function renderPriceAxis() {
  priceContext!.clearRect(0, 0, priceCanvas.width, priceCanvas.height);
  for (let i = 0; i < priceCanvas.height; i += 100) {
    let yPos = priceCanvas.height - i;
    // Save context state before drawing text
    // priceContext!.save();
    // Reset transform so text is not inverted
    priceContext!.setTransform(1, 0, 0, 1, 0, 0);
    // --- Draw the Label ---
    priceContext!.font = "25px Arial"; // 25px might be too big for tight steps
    priceContext!.fillStyle = "white";
    priceContext!.textAlign = "left";
    priceContext!.textBaseline = "middle"; // Centers text vertically on the line
    priceContext!.fillText(i.toString(), 100, yPos);
    // Restore context state to continue drawing with scale
    // priceContext!.restore();

    priceContext?.fillRect(0, yPos, priceCanvas.width - 90, 1 * scale);
    priceContext!.fillStyle = "white";
  }
}
renderPriceAxis();

//===================Canvas Scaler================================
const range = document.getElementById("zoom-range") as HTMLInputElement;
if (range) {
  range.addEventListener("input", () => {
    const percent = Number(range.value) / 100 + 0.1;
    scale = 10 * percent;
    console.log(scale);
    GlobalHeight = scale * window.innerHeight;
    GlobalWidth = scale * window.innerWidth;
    canvas.width = GlobalWidth; //canvas 1
    canvas.height = GlobalHeight;
    priceCanvas.height = GlobalHeight; //canvas 2
    // console.log(GlobalHeight, GlobalWidth);
    renderPriceAxis();
    render();
  });
} else {
  console.log("no range");
}

//====================First Order Book=====================
const Starting_SharePrice = 500;
const orderBook = new OrderBook("Bananajs", Starting_SharePrice);
const randomTrader = new RandomTrader(1000, 100000, orderBook);
const marketMaker = new MarketMaker(100000, 100000000, orderBook);
  // marketMaker.placeOrder(1, marketMaker,100000,"Sell");

const trendFollower = new TrendFollower(1000, 100000, orderBook);
const marketCorrectionTrader = new MarketCorrectionTrader(
  1000,
  100000,
  orderBook,
);

//====================Trader Selector======================
function randomSelector() {
  const quantity = 10;

  randomTrader.placeOrder(quantity, randomTrader);
  // marketMaker.placeOrder(quantity, marketMaker);
  // console.log("shares",randomTrader.assetInventory,randomTrader.cashDeposit);
  trendFollower.placeOrder(quantity, trendFollower);
  marketCorrectionTrader.placeOrder(marketCorrectionTrader);
}

let tick = 0;
let candleX = 0;

const candles: Candle[] = [];
let priceBefore = orderBook.Current_Market_SharePrice;
let cameraOffset = 0;

//===================OrderBook Renderor=============================
function renderOrderBook(
  buyMap: Map<Number, Number>,
  sellMap: Map<Number, Number>,
) {
  const buyContainer = document.getElementById("buyOrders");
  const sellContainer = document.getElementById("sellOrders");

  buyContainer!.innerHTML = "";
  sellContainer!.innerHTML = "";

  // BUY (descending)
  Array.from(buyMap.entries()).forEach(([price, qty]) => {
    buyContainer!.innerHTML += `
        <div class="row buy">
          <span>${price}</span>
          <span>${qty}</span>
        </div>`;
  });

  // SELL (ascending)
  Array.from(sellMap.entries()).forEach(([price, qty]) => {
    sellContainer!.innerHTML += `
        <div class="row sell">
          <span>${price}</span>
          <span>${qty}</span>
        </div>`;
  });
}
//====================Renderor ============================
function updateMarket() {
  if (!ctx) return;
  randomSelector();
  tick++;
  const price = orderBook.Current_Market_SharePrice;
  const btn = document.getElementById("price-btn");
  btn!.innerText = price.toString();

  //live price candle------
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(cameraOffset, canvas.height);
  ctx.fillStyle = "red";
  ctx.scale(1, -1);
  // ctx.fillRect(100, 100, 50, 50);
  const candle = new Candle(ctx, candleX, priceBefore, price);
  candle.draw();

  // price candle every second
  if (tick % 10 === 0) {
    renderOrderBook(
      orderBook.orderBookRecords().top20BuyOrders,
      orderBook.orderBookRecords().top20SellOrders,
    );
    const candle = new Candle(ctx, candleX, priceBefore, price);
    candles.push(candle);
    candleX += 15;
    priceBefore = price;
    if (candleX > canvas.width / 2) {
      cameraOffset -= 15;
    }
  }
}

function render() {
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(cameraOffset, canvas.height);
  ctx.scale(1, -1);
  // candles.forEach((c) => c.draw());
  for (
    let i = candles.length >= 100 ? candles.length - 100 : 0;
    i < candles.length;
    i++
  ) {
    candles[i].draw();
    // Draw line connecting previous candle's close to current candle's close
    if (i > 0) {
      let candle0 = candles[i - 1];
      let candle = candles[i];
      ctx.beginPath();
      ctx.moveTo(candle0.posX, candle0.close + 0);
      ctx.lineTo(candle.posX, candle.close + 0);
      ctx.strokeStyle = "blue"; // Color for the close price line
      ctx.stroke();
    }
  }
}

//====================Drag ================================
let startX = 0;
let isMouseDown = false;

window.addEventListener("mousedown", (e) => {
  isMouseDown = true;
  startX = e.clientX;
});

window.addEventListener("mousemove", (e) => {
  if (!isMouseDown || !ctx) return;

  const dx = e.clientX - startX;
  const currentOffset = cameraOffset + dx;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  console.log(currentOffset);
  ctx.translate(currentOffset, canvas.height);
  ctx.scale(1, -1);

  let select_candles_to_render = Math.max(
    candles.length - 100 - Math.floor(Math.max(dx, 0)),
    0,
  );

  for (let i = select_candles_to_render; i < candles.length; i++) {
    candles[i].draw();
  }
});

window.addEventListener("mouseup", (e) => {
  if (!isMouseDown) return;

  cameraOffset += e.clientX - startX;
  isMouseDown = false;
});

function gameLoop() {
  updateMarket();
  render();

  if (tick > 1.5 * window.innerWidth) {
    clearInterval(loop);
  }
}

const loop = setInterval(gameLoop, 10);
