import { Candle, OrderBook, Traders } from "./main";
const canvas = document.getElementById(
  "monkey_trade",
) as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error("Canvas not found");
}

canvas.width = 3 * window.innerWidth;
canvas.height = 600;

const ctx = canvas.getContext("2d");
ctx?.translate(0, canvas.height);

const Starting_SharePrice = 100;
const FirstOrderBook = new OrderBook("Bananajs", Starting_SharePrice);
const trader = new Traders(FirstOrderBook);

//Player Experimental
const playButton = document.getElementById("Short");
let targetPrice: number | null = null;
if (playButton !== null) {
  playButton.onclick = () => {
    targetPrice = FirstOrderBook.Current_Market_SharePrice - 50;
    console.log("Order placed");
  };
}

function randomSelector() {
  function fn(quantity: number) {
    const traderMethods = [
      () => trader.RandomTrader(quantity),
      () => trader.TrendFollower(quantity),
      () => trader.MarketCorrectionTrader(quantity),
    ];
    const selector = traderMethods[0];
    const selector2 = traderMethods[1];
    const selector3 = traderMethods[2];
    selector();
    selector2();
    selector3();
    // const method =
    //   traderMethods[Math.floor(Math.random() * traderMethods.length)];

    // method();
  }

  return Math.random() < 0.7
    ? fn(Math.floor(Math.random() * 10))
    : fn(Math.floor(Math.random() * 10));
}

let i = 0;
let j = 0;

const allCandles: Candle[] = [];
let lastPrice = FirstOrderBook.Current_Market_SharePrice;
let priceBeforSecond = lastPrice;

const intervalId = setInterval(() => {
  randomSelector();
  i += 1;
  const price = FirstOrderBook.Current_Market_SharePrice;

  //Experiment
  document.getElementById("currentPrice")!.innerText = price.toString();
  if (price <= targetPrice!) {
    alert("loose");
    clearInterval(intervalId);
  }
  if (!ctx) return;

  //   ctx!.lineWidth = 9;
  //   ctx!.beginPath();
  //   ctx!.strokeStyle = price - lastPrice > 0 ? "green" : "red";
  //   ctx!.moveTo(i, -lastPrice);
  //   ctx!.lineTo(i, -price);
  //   ctx!.stroke();
  //   ctx?.beginPath();
  //   ctx!.fillStyle = "black";

  //   //timed candle
  //   lastPrice = price;

  ctx!.fillStyle = "black";
  // Second candle
  if (i % 10 === 0) {
    let highY = Math.max(priceBeforSecond, price) - 30;
    let lowY = Math.min(priceBeforSecond, price) + 30;

    const candle = new Candle(ctx, j, priceBeforSecond, price, highY, lowY);
    allCandles.push(candle);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (i >= window.innerWidth / 2) {
      ctx.translate(-10, 0);
    }
    allCandles.forEach((item) => {
      item.draw();
    });

    j += 10;
    priceBeforSecond = FirstOrderBook.Current_Market_SharePrice;
  }

  if (i > 3 * window.innerWidth) {
    clearInterval(intervalId);
  }
}, 10);
