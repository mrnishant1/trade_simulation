export type PlayerAssetState = Record<
  string,
  {
    quantity: number;
    marketPrice: number;
    marketValue: number;
  }
>;

export type PlayerState = {
  cashDeposit: number;
  xp: number;
  streak: number;
  netWorth: number;
  assets: PlayerAssetState;
  lastUpdated: number;
};

export type OrderSnapshot = {
  orderBookName: string;
  marketPrice: number;
  lastBuyOrder: {
    price: number;
    quantity: number;
    time: string;
    trader: string;
  } | null;
  lastSellOrder: {
    price: number;
    quantity: number;
    time: string;
    trader: string;
  } | null;
};

export const GLOBALGameState = {
  player: {
    cashDeposit: 1000,
    xp: 0,
    streak: 0,
    netWorth: 1000,
    assets: {} as PlayerAssetState,
    lastUpdated: Date.now(),
  } as PlayerState,

  orderbooks: [] as OrderSnapshot[],
};
