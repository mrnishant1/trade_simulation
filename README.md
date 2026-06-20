# 🍌 Bananajs — Browser-Based Stock Market Simulator

A real-time, single-asset stock market simulator running entirely in the browser. Built from scratch with a custom order book engine, algorithmic bot traders, a candlestick chart renderer, and an event system that drives market sentiment.

---

## What It Does

You trade a single fictional stock — **Bananajs** — against a live market driven by autonomous bot traders. The price is not scripted; it emerges from actual order matching between buyers and sellers in real time.

---

## Architecture

### Order Book Engine
Built from scratch using:
- **Max-heap** for buy orders (highest bid on top)
- **Min-heap** for sell orders (lowest ask on top)
- **HashMap + LinkedList** per price level for O(1) order lookup and FIFO settlement

Orders are matched and settled on every tick. Cash and asset balances update in real time on trade execution.

### Bot Traders
Three autonomous traders run on every tick:

| Trader | Behavior |
|---|---|
| `RandomTrader` | Noise — places random buy/sell orders near market price |
| `TrendFollower` | Momentum — buys into uptrends, sells into downtrends |
| `MarketCorrectionTrader` | Mean-reversion — bets against deviation from rolling average |

Each trader's behavior scales with market **sentiment** (a `[-1, 1]` value driven by the event system).

### Event System
Events are categorized as `Bullish`, `Bearish`, `Hype`, `Panic`, `OVERVALUED`, `UNDERVALUED`, `TREND_BOOST`, or `TREND_EXHAUSTION`. Each event carries:
- `dreadness` — magnitude and direction of influence
- `tick_duration` — how long it stays active
- `decayRate` — exponential decay of influence over time
- `coolDown` — refractory period before the same event can fire again

Active events are summed and clamped to produce a single `sentiment` scalar that scales all trader behavior.

### Candlestick Chart
Custom canvas renderer with:
- Live price tick drawn on every game loop iteration
- Committed candles every N ticks
- Camera auto-scrolls as candles fill the canvas
- Drag-to-pan for historical view

---

## Player
- Start with `$2000` cash
- Buy/sell at current market price
- HUD shows: cash balance, total worth, and live PnL

---

## Tech Stack

- **TypeScript** — entire codebase
- **HTML5 Canvas** — chart rendering
- **Vanilla browser APIs** — no frameworks, no dependencies
- **localStorage** — optional session persistence

---

## Running Locally

```bash
git clone https://github.com/your-username/bananajs
cd bananajs
npm install
npm run dev
```

> Requires a bundler like Vite or esbuild to handle TypeScript imports.

---

## Status

| System | Status |
|---|---|
| Order Book | ✅ Complete |
| Bot Traders | ✅ Complete |
| Candlestick Chart | ✅ Complete |
| Player Trading | ✅ Complete |
| Event System | 🚧 In Progress |

---

## What's Next

- Wire event system into the game loop (sentiment → trader behavior)
- Deck-of-cards style event scheduling (no repeats until pool exhausts)
- UI overlays showing active events during gameplay
