import { Candle, OrderBook, Traders } from "./main";

const GlobalHeight = 1.5 * window.innerHeight;
const GlobalWeight = 1.5 * window.innerWidth;
const canvas = document.getElementById("monkey_trade") as HTMLCanvasElement;
if (!canvas) throw new Error("Canvas not found");
canvas.width = GlobalWeight;
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
for (let i = 0; i < priceCanvas.height; i += 100) {
  // Save context state before drawing text
  priceContext!.save();
  // Reset transform so text is not inverted
  priceContext!.setTransform(1, 0, 0, 1, 0, 0);
  priceContext!.font = "25px Arial";
  priceContext!.fillStyle = "white";
  priceContext!.fillText(i.toString(), 100, priceCanvas.height - i);
  // Restore context state to continue drawing with scale
  priceContext!.restore();

  priceContext?.fillRect(0, i, priceCanvas.width - 100, 1);
  priceContext!.fillStyle = "white";
}

//====================First Order Book=====================
const Starting_SharePrice = 100;
const orderBook = new OrderBook("Bananajs", Starting_SharePrice);
const trader = new Traders(orderBook);

//====================Trader Selector======================
function randomSelector() {
  const quantity = Math.floor(Math.random() * 10);

  trader.RandomTrader(quantity);
  trader.TrendFollower(quantity);
  trader.MarketCorrectionTrader(quantity);
}

let tick = 0;
let candleX = 0;

const candles: Candle[] = [];
let priceBefore = orderBook.Current_Market_SharePrice;
let cameraOffset = 0;

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

  for (
    let i = Math.max(candles.length - 100 - Math.floor(Math.max(dx, 0)), 0);
    i < candles.length;
    i++
  ) {
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

  if (tick > 3 * window.innerWidth) {
    clearInterval(loop);
  }
}

const loop = setInterval(gameLoop, 10);
