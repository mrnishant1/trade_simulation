// ── GLOBAL STATE ─────────────────────────────────────────────
export const GLOBALGameState = {
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
  
  // World
  
};
