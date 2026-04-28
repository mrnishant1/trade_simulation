// ── GLOBAL STATE ─────────────────────────────────────────────
export const GameState = {
  // Player
  player: {
    cashDeposite: 1000,
    xp: 0,
    streak: 0,
    assets: {},
  },

  // Market — one entry per tradeable asset
  markets: {
   
  },

  // Active events — things happening RIGHT NOW that affect prices
  activeEvents: [
    // { id, name, affectedStock, multiplier, turnsLeft }
  ],

  // Orderbook per asset — bids and asks
  orderbooks: {
     All_OrderBooks: [
      {
        OrderBookName: {
          LastMarketPrice: 0,
          LastSellOrders_Heap: [] as number[],
          LastBuyOrders_Heap: [] as number[],
        },
      },
    ],
  },

  // Agentic assets — AI/NPC traders acting independently
  agents: [
    {
      id: "whale_01",
      name: "The Whale",
      cash: 50000,
      holdings: {},
      strategy: "momentum",
    },
    {
      id: "bot_02",
      name: "ScalpBot",
      cash: 5000,
      holdings: {},
      strategy: "scalp",
    },
    {
      id: "fund_03",
      name: "HedgeFund",
      cash: 80000,
      holdings: {},
      strategy: "contrarian",
    },
  ],

  // World
  day: 1,
  maxDays: 30,
  targetAmount: 10000,
  scene: "house", // 'house' | 'city'
  phase: "playing", // 'playing' | 'paused' | 'won' | 'lost'
};
