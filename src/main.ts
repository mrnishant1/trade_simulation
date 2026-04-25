//  (Flaw1.- I should Deduct the share in the first place when place order but for the I'll have to implement the cancelation feature as well for now I'm not doing that just deducting shares only on settlement)

type OrderType = "Buy" | "Sell";
type TraderType =
  | RandomTrader
  | TrendFollower
  | MarketCorrectionTrader
  | MarketMaker
| Player;

type asset = {
  asset: OrderBook;
  assetQuntity: number;
};

export class Order {
  OrderType: OrderType;
  ShareName: string;
  Quantity: number;
  AtPrice: number;
  time: string;
  OrderID: string;
  Order_PlacedBy: TraderType;
  constructor(
    OrderType: OrderType,
    ShareName: string,
    Quantity: number,
    AtPrice: number,
    Order_PlacedBy: TraderType,
  ) {
    this.OrderType = OrderType;
    this.ShareName = ShareName;
    this.Quantity = Quantity;
    this.AtPrice = AtPrice;
    this.time = new Date().toLocaleTimeString();
    this.OrderID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.Order_PlacedBy = Order_PlacedBy;
  }
}

export class Node {
  Order: Order;
  ChildrenSize: number; //Number of node appended + itself
  Next: Node | null;
  constructor(Order: Order) {
    this.Order = Order;
    this.Next = null;
    this.ChildrenSize = 0;
  }
}

export class LinkedList {
  head: Node | null;
  constructor() {
    this.head = null;
  }
  print() {
    if (!this.head) return null;
    let currentNode: Node | null = this.head;
    while (currentNode != null) {
      //console.log(currentNode.Order);
      currentNode = currentNode.Next;
    }
  }

  insert(Order: Order) {
    if (!this.head) {
      this.head = new Node(Order);
      this.head.ChildrenSize = this.head.Order.Quantity;
    } else {
      let currentNode: Node = this.head;
      while (currentNode.Next != null) {
        currentNode = currentNode.Next;
      }
      currentNode.Next = new Node(Order);
      this.head.ChildrenSize += this.head.Order.Quantity;
    }
  }

  deleteFirst() {
    if (!this.head) return;
    let currentNode: Node = this.head;
    this.head.ChildrenSize -= this.head.Order.Quantity;
    this.head = this.head.Next;
    return currentNode;
  }
}

export class Orders_Map {
  priceMap: Map<number, LinkedList>;

  constructor() {
    this.priceMap = new Map();
  }
  insert(Order: Order) {
    //@Cases- Order already exist or No order exist at that price

    //Case = I Already exsit
    if (this.priceMap.has(Order.AtPrice)) {
      const OrderList = this.priceMap.get(Order.AtPrice);
      OrderList?.insert(Order);
    }
    //Case - II No Price exist --> Creat new Linked list with Order,---> Set new entry in map= (Key: Price, value: LinkedList)
    else {
      const OrderList = new LinkedList();
      OrderList.insert(Order);
      this.priceMap.set(Order.AtPrice, OrderList);
    }
  }

  pop_order(price: number) {
    if (!this.priceMap.has(price)) {
      //console.log("no order with this price, failed delete");
      return;
    }
    return this.priceMap.get(price)!.deleteFirst();
  }
}

export class maxHeap {
  priceHeap: number[];
  All_BuyOrders_Map: Orders_Map;
  size = 0;
  constructor() {
    this.priceHeap = [];
    this.size = 0;
    this.All_BuyOrders_Map = new Orders_Map();
  }

  insert_newOrder(Order: Order) {
    const value = Order.AtPrice;
    // console.log("value------------", value);
    //Insert the order in Map for fast retrieval of all orders at same price
    //=====IMP=====Insert per price: insertion happen only on unique price not on repeated price
    //on repeated prices just insert into linked list
    const isThereOrderExist = this.All_BuyOrders_Map.priceMap.has(
      Order.AtPrice,
    );

    this.All_BuyOrders_Map.insert(Order); //Insertion in linked list without question
    if (!isThereOrderExist && value !== undefined) {
      this.priceHeap.push(value);
      // console.log("price heap ", this.priceHeap);
      this.size++;
      let i = this.priceHeap.length - 1;
      let parent = Math.floor((i - 1) / 2);
      if (parent < 0) {
        return;
      }
      let parentValue = this.priceHeap[parent];
      while (i > 0 && this.priceHeap[i] > parentValue) {
        //console.log("step12 3",value,parent,parentValue);

        this.#swapElements(this.priceHeap, i, parent);
        i = parent;
        parent = Math.floor((i - 1) / 2);
        if (parent < 0) {
          break;
        }
        parentValue = this.priceHeap[parent];
      }
      // //console.log(this.priceHeap);
    }
  }

  delete_Order(AtPrice: number) {
    if (this.size === 0) return;
    //=====IMP=====Delete from MAP but from HEAP only when All_buyOrders at the price has been settled(deleted) in linked list =====IMP=====//
    //===========================================================================================================//
    const popped = this.All_BuyOrders_Map.pop_order(AtPrice); //pop the latest setteled order
    if (popped && popped.Next === null) {
      //===>when pop.next is null, means that was the last order at this price, now two tasks..
      //1. delete map key, 2. Delete entry from heap--> but on delete we need to [HEAPIFY]
      this.All_BuyOrders_Map.priceMap.delete(AtPrice);
      //if size ===1: [No need for heapify]
      if (this.size === 1) {
        this.priceHeap.pop(); //priceHeap not map
        this.size--;
        return;
      }
      // else [Heapify]
      this.priceHeap[0] = this.priceHeap.pop() as number;
      this.size--;

      let root = 0;

      while (true) {
        const left = 2 * root + 1;
        const right = 2 * root + 2;

        let largest = root;
        //case - I if left is larger than parent---> largest changes
        if (
          left < this.size &&
          this.priceHeap[left] > this.priceHeap[largest]
        ) {
          largest = left;
        }
        //case - II if right is larger than parent---> largest changes
        if (
          right < this.size &&
          this.priceHeap[right] > this.priceHeap[largest]
        ) {
          largest = right;
        }
        //case - III if nothing changes in largest-- Break
        if (largest === root) break;

        this.#swapElements(this.priceHeap, root, largest);
        root = largest;
      }
      // //console.log(this.priceHeap);
    }
    return popped;
  }

  peak() {
    // ✅ SAFETY: avoid undefined access
    if (this.size === 0) return undefined;

    const AtPrice: number = this.priceHeap[0];
    return this.All_BuyOrders_Map.priceMap.get(AtPrice)?.head;
  }

  #swapElements(priceHeap: number[], i1: number, i2: number) {
    [priceHeap[i1], priceHeap[i2]] = [priceHeap[i2], priceHeap[i1]];
    // //console.log('swapping', priceHeap[i1],priceHeap[i2]);
  }
}
export class minHeap {
  priceHeap: number[];
  All_SellOrders_Map: Orders_Map;
  size: number;
  constructor() {
    this.priceHeap = [];
    this.All_SellOrders_Map = new Orders_Map();
    this.size = 0;
  }
  insert_newOrder(Order: Order) {
    const value = Order.AtPrice;
    //console.log("step2 1");

    //Insert the order in Map for fast retrieval of all orders at same price
    //=====IMP=====Insert per price: insertion happen only on unique price not on repeated price
    //on repeated prices just insert into linked list
    const isThereOrderExist = this.All_SellOrders_Map.priceMap.has(
      Order.AtPrice,
    );

    this.All_SellOrders_Map.insert(Order); //Insertion in linked list without question
    if (!isThereOrderExist) {
      //console.log("step2 2");

      this.priceHeap.push(value);
      this.size++;
      let i = this.priceHeap.length - 1;
      let parent = Math.floor((i - 1) / 2);
      if (parent < 0) {
        return;
      }
      let parentValue = this.priceHeap[parent];
      while (value < parentValue) {
        //console.log("step2 3",value,parent,parentValue);

        this.#swapElements(this.priceHeap, i, parent);
        i = parent;
        parent = Math.floor((i - 1) / 2);
        if (parent < 0) {
          break;
        }
        parentValue = this.priceHeap[parent];
      }
      // ////console.log(this.priceHeap);
    }
  }

  delete_Order(AtPrice: number) {
    if (this.size === 0) return;
    //=====IMP=====Delete from MAP but from HEAP only when All_buyOrders at the price has been settled(deleted) in linked list =====IMP=====//
    //===========================================================================================================//
    const popped = this.All_SellOrders_Map.pop_order(AtPrice); //pop the latest setteled order
    if (popped && popped.Next === null) {
      // that was the last order at this price
      this.All_SellOrders_Map.priceMap.delete(AtPrice);
      //if size ===1: No need for heapify
      if (this.size === 1) {
        this.priceHeap.pop();
        this.size--;
        return;
      }
      this.priceHeap[0] = this.priceHeap.pop() as number;
      this.size--;

      let root = 0;

      while (true) {
        const left = 2 * root + 1;
        const right = 2 * root + 2;

        let largest = root;
        //case - I if left is larger than parent---> largest changes
        if (
          left < this.size &&
          this.priceHeap[left] < this.priceHeap[largest]
        ) {
          largest = left;
        }
        //case - II if right is larger than parent---> largest changes
        if (
          right < this.size &&
          this.priceHeap[right] < this.priceHeap[largest]
        ) {
          largest = right;
        }
        //case - III if nothing changes in largest-- Break
        if (largest === root) break;

        this.#swapElements(this.priceHeap, root, largest);
        root = largest;
      }
      // //console.log(this.priceHeap);
    }
    return popped;
  }
  peak() {
    //  SAFETY: avoid undefined access
    if (this.size === 0) return undefined;

    const AtPrice: number = this.priceHeap[0];
    if (!this.All_SellOrders_Map.priceMap.has(AtPrice)) return;
    else {
      return this.All_SellOrders_Map.priceMap.get(AtPrice)?.head;
    }
  }

  #swapElements(priceHeap: number[], i1: number, i2: number) {
    [priceHeap[i1], priceHeap[i2]] = [priceHeap[i2], priceHeap[i1]];
    // //console.log('swapping', priceHeap[i1],priceHeap[i2]);
  }
}

export class OrderBook {
  SellOrders_Heap: minHeap;
  BuyOrders_Heap: maxHeap;
  Current_Market_SharePrice: number;
  ShareName: string;
  lastPrices: number[];
  averagePrice: number;
  trendAvg: number;
  // All_Order_Map: Map<string, TraderType>;
  constructor(ShareName: string, Starting_SharePrice: number) {
    this.ShareName = ShareName;
    this.SellOrders_Heap = new minHeap(); //Least sell price order on top
    this.BuyOrders_Heap = new maxHeap(); //Highest bid on top
    this.Current_Market_SharePrice = Starting_SharePrice; //some number //will change on matchOrder
    this.trendAvg = 0;
    this.lastPrices = [];
    this.averagePrice = 0;
    // this.All_Order_Map = new Map();
  }

  place_Order(
    OrderType: OrderType,
    AtPrice: number,
    Quantity: number,
    ShareName: string,
    Order_PlacedBy: TraderType,
  ) {
    if (AtPrice < 0 || Quantity <= 0) return;
    const newOrder = new Order(
      OrderType,
      ShareName,
      Math.floor(Quantity),
      Number(AtPrice.toFixed(2)),
      Order_PlacedBy,
    );
    //===================================================before Insert
    //======= check if order already satisfies any order in sell minHeap=====
    if (newOrder.OrderType === "Buy") {
      let buyQty = newOrder.Quantity;

      //This is process of setteling Only when conditions match-
      while (buyQty > 0 && this.SellOrders_Heap.size > 0) {
        const bestSell = this.SellOrders_Heap.peak()?.Order;
        if (!bestSell) break;
        if (newOrder.AtPrice < bestSell.AtPrice) break;

        let sellQty = bestSell.Quantity;
        const tradeQty = Math.min(buyQty, sellQty);

        //Settlement
        buyQty -= tradeQty;
        sellQty -= tradeQty;

        //In here Seller- Gets Money & Deduction of Shares happens now (flaw1 ......)
        //Buyer- Gets Shares & Deduction of Money= Order.Atprice*tradeQty
        const settlementMoney = newOrder.AtPrice * tradeQty;
        const settlementShares = tradeQty;

        const Buyer = newOrder.Order_PlacedBy;
        const Seller = bestSell.Order_PlacedBy;

        Buyer.cashDeposit -= settlementMoney;
        if (!Buyer.assetInventory[ShareName]) {
          Buyer.assetInventory[ShareName] = {
            asset: Buyer.all_OrderBooks[ShareName],
            assetQuntity: settlementShares,
          };
        } else {
          Buyer.assetInventory[ShareName].assetQuntity += settlementShares;
        }

        Seller.cashDeposit += settlementMoney;
        if (!Seller.assetInventory[ShareName]) {
          Seller.assetInventory[ShareName] = {
            asset: Seller.all_OrderBooks[ShareName],
            assetQuntity: settlementShares,
          };
        } else {
          Seller.assetInventory[ShareName].assetQuntity -= settlementShares;
        }

        // console.log("setteling");

        //settel the market price here =======
        this.#calculate_Avg(50); //Every time price changes I need to calculate the price
        this.Current_Market_SharePrice = Number(newOrder.AtPrice.toFixed(3));
        //settel the market price here =======

        if (sellQty === 0) {
          this.SellOrders_Heap.delete_Order(bestSell.AtPrice);
        } else {
          bestSell.Quantity = sellQty;
        }
      }
      newOrder.Quantity = buyQty;
      if (newOrder.Quantity > 0) {
        this.BuyOrders_Heap.insert_newOrder(newOrder);
      }
      return newOrder;
    }

    if (newOrder.OrderType === "Sell") {
      let sellQty = newOrder.Quantity;
      //console.log("step1");
      while (sellQty > 0 && this.BuyOrders_Heap.size > 0) {
        // console.log("sold settle");
        const bestBuy = this.BuyOrders_Heap.peak()?.Order;
        if (!bestBuy) break;
        if (newOrder.AtPrice > bestBuy.AtPrice) break;
        //console.log("step2");

        let buyQty = bestBuy.Quantity;
        const tradeQty = Math.min(sellQty, buyQty);

        sellQty -= tradeQty;
        buyQty -= tradeQty;

        //In here Seller- Gets Money & Deduction of Shares happens now (flaw1 ......)
        //Buyer- Gets Shares & Deduction of Money= Order.Atprice*tradeQty
        const settlementMoney = newOrder.AtPrice * tradeQty;
        const settlementShares = tradeQty;

        const Seller = newOrder.Order_PlacedBy;
        const Buyer = bestBuy.Order_PlacedBy;

        Buyer.cashDeposit -= settlementMoney;
        if (!Buyer.assetInventory[ShareName]) {
          Buyer.assetInventory[ShareName] = {
            asset: Buyer.all_OrderBooks[ShareName],
            assetQuntity: settlementShares,
          };
        } else {
          Buyer.assetInventory[ShareName].assetQuntity += settlementShares;
        }

        Seller.cashDeposit += settlementMoney;
        if (!Seller.assetInventory[ShareName]) {
          Seller.assetInventory[ShareName] = {
            asset: Seller.all_OrderBooks[ShareName],
            assetQuntity: settlementShares,
          };
        } else {
          Seller.assetInventory[ShareName].assetQuntity -= settlementShares;
        }

        // console.log("setteling");
        //settel the market price here =======
        this.#calculate_Avg(50);
        this.Current_Market_SharePrice = Number(newOrder.AtPrice.toFixed(3));
        //settel the market price here =======

        if (buyQty === 0) {
          //console.log("step4");
          this.BuyOrders_Heap.delete_Order(bestBuy.AtPrice);
          //console.log("step5");
        } else {
          bestBuy.Quantity = buyQty;
          //console.log("step6");
        }
      }

      //console.log("step final");

      newOrder.Quantity = sellQty;

      if (newOrder.Quantity > 0) {
        //console.log("step final2");
        this.SellOrders_Heap.insert_newOrder(newOrder);
      }

      return newOrder;
    }
  }

  orderBookRecords() {
    let buyOrderCopy = [...this.BuyOrders_Heap.priceHeap];
    let sellOrderCopy = [...this.SellOrders_Heap.priceHeap];

    // if (buyOrderCopy.length < 20 || sellOrderCopy.length < 20) {
    //   return {0,0};
    // }

    const top20BuyOrders = new Map<number, number>();
    const top20SellOrders = new Map<number, number>();

    for (let i = 0; i < 20 && buyOrderCopy.length > 0; i++) {
      const top = this.#deleteMax(buyOrderCopy);
      if (top) {
        top20BuyOrders.set(
          top,
          this.BuyOrders_Heap.All_BuyOrders_Map.priceMap.get(top)?.head
            ?.ChildrenSize || -1,
        );
      }
    }

    for (let i = 0; i < 20 && sellOrderCopy.length > 0; i++) {
      const top = this.#deleteMin(sellOrderCopy);
      if (top) {
        top20SellOrders.set(
          top,
          this.SellOrders_Heap.All_SellOrders_Map.priceMap.get(top)?.head
            ?.ChildrenSize || -1,
        );
      }
    }

    return { top20BuyOrders, top20SellOrders };
  }

  #deleteMax(heap: number[]) {
    if (heap.length === 0) return null;
    if (heap.length === 1) return heap.pop() as number;

    const top = heap[0];
    heap[0] = heap.pop() as number;

    let i = 0;
    const n = heap.length;

    while (true) {
      let left = 2 * i + 1;
      let right = 2 * i + 2;
      let largest = i;

      if (left < n && heap[left] > heap[largest]) largest = left;
      if (right < n && heap[right] > heap[largest]) largest = right;

      if (largest === i) break;
      [heap[i], heap[largest]] = [heap[largest], heap[i]];
      i = largest;
    }

    return top;
  }
  #deleteMin(heap: number[]) {
    if (heap.length === 0) return null;
    if (heap.length === 1) return heap.pop() as number;

    const top = heap[0];
    heap[0] = heap.pop() as number;

    let i = 0;
    const n = heap.length;

    while (true) {
      let left = 2 * i + 1;
      let right = 2 * i + 2;
      let largest = i;

      if (left < n && heap[left] < heap[largest]) largest = left;
      if (right < n && heap[right] < heap[largest]) largest = right;

      if (largest === i) break;
      [heap[i], heap[largest]] = [heap[largest], heap[i]];
      i = largest;
    }

    return top;
  }

  #calculate_Avg(Orders_toSee: number) {
    // Average Price calculation for market correction Trader
    this.lastPrices.push(this.Current_Market_SharePrice);
    if (this.lastPrices.length > Orders_toSee) {
      this.lastPrices.shift();
      this.averagePrice = this.#sum(this.lastPrices, Orders_toSee);
      this.trendAvg = this.#sum(this.lastPrices, Math.floor(Orders_toSee / 4));
    }
    this.averagePrice = Number((this.averagePrice / Orders_toSee).toFixed(3));
    this.trendAvg = Number(
      (this.trendAvg / Math.floor(Orders_toSee / 4)).toFixed(3),
    );
  }

  #sum(lastPrices: number[], sum_of: number) {
    let total = 0;
    for (let i = lastPrices.length - 1; i >= lastPrices.length - sum_of; i--) {
      total += lastPrices[i];
    }
    return total;
  }
}

//==============================Candle=========================================
export class Candle {
  ctx: CanvasRenderingContext2D | null;
  posX: number;
  open: number;
  close: number;

  width: number;
  scale: number;

  constructor(
    ctx: CanvasRenderingContext2D | null,
    posX: number,
    open: number,
    close: number,
  ) {
    this.ctx = ctx;
    this.posX = posX;
    this.open = open;
    this.close = close;

    this.width = 12;
    this.scale = 1;
  }

  draw() {
    // console.log("Draw called");

    if (!this.ctx) return;

    const ctx = this.ctx;

    const openY = this.open * this.scale;
    const closeY = this.close * this.scale;

    const color = this.close > this.open ? "green" : "red";

    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    const highY = Math.max(this.open, this.close) - 20;
    const lowY = Math.min(this.open, this.close) + 20;

    // ctx.scale(1,-1)

    // wick
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.posX, highY * this.scale);
    ctx.lineTo(this.posX, lowY * this.scale);
    ctx.stroke();

    // body
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(openY - closeY);

    ctx.fillRect(
      this.posX - this.width / 2,
      bodyTop,
      this.width,
      bodyHeight || 1,
    );
  }
}

//==============================Traders======================================

export class RandomTrader {
  assetInventory: Record<string, asset>;
  cashDeposit: number;
  all_OrderBooks: Record<string, OrderBook>;

  // OrderQuantity: number;
  constructor(
    assetInventory: Record<string, asset>,
    cashDeposit: number,
    all_OrderBooks: Record<string, OrderBook>,
  ) {
    this.assetInventory = assetInventory;
    this.cashDeposit = cashDeposit;
    this.all_OrderBooks = all_OrderBooks;

    // this.OrderQuantity = 0;
  }
  #randn() {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return (
      Number(Math.sqrt(-2 * Number(Math.log(u).toFixed(2))).toFixed(2)) *
      Math.cos(2 * Math.PI * v)
    );
  }

  placeOrder(
    OrderQuantity: number,
    TraderInstance: TraderType,
    sentiment: number,
    orderBook: OrderBook,
  ) {
    // console.log(this.assetInventory);
    if (OrderQuantity < 0) return;
    const OrderBook = orderBook;
    const currentMKP = OrderBook.Current_Market_SharePrice;
    //deciding knobs---> 1. sentiment-> buyprobability 2. variation 3. volitility range
    //=============

    const volatilityRange = 0.004;
    const drift = currentMKP * sentiment * 0.001; // small bias
    const variation = currentMKP * volatilityRange * this.#randn();
    const buyProbability = 0.5 + sentiment * 0.45;
    const newPrice = Number((currentMKP + drift + variation).toFixed(2));

    //=============

    // const newPrice = Number((currentMKP + variation).toFixed(2));
    const OrderType: OrderType =
      Math.random() < buyProbability ? "Buy" : "Sell";

    // console.log(OrderType);
    //Random trader can only trade when--- money>price || shares>0
    // if (OrderType === "Sell" && this.assetInventory < OrderQuantity) {
    //   // console.log("Failed1");
    //   return;
    // }
    // if (OrderType === "Buy" && this.cashDeposit < OrderQuantity * newPrice) {
    //   return;
    // }
    // console.log(
    //   "placing random ",
    //   OrderType,
    //   this.assetInventory,
    //   this.cashDeposit,
    // );

    return OrderBook.place_Order(
      OrderType,
      newPrice,
      OrderQuantity,
      OrderBook.ShareName,
      TraderInstance,
    );
  }
}

export class TrendFollower {
  assetInventory: Record<string, asset>;
  cashDeposit: number;
  all_OrderBooks: Record<string, OrderBook>;
  // OrderQuantity: number;
  constructor(
    assetInventory: Record<string, asset>,
    cashDeposit: number,
    All_OrderBook: Record<string, OrderBook>,
  ) {
    this.assetInventory = assetInventory;
    this.cashDeposit = cashDeposit;
    this.all_OrderBooks = All_OrderBook;

    // this.OrderQuantity = 0;
  }
  placeOrder(
    OrderQuantity: number,
    TraderInstance: TraderType,
    sentiment: number,
    OrderBook: OrderBook,
  ) {
    const orderBook = OrderBook;
    if (OrderQuantity < 0) return;
    const current = orderBook.Current_Market_SharePrice;
    const trend = orderBook.trendAvg - orderBook.averagePrice;
    //deciding knobs---> 1.sentiment 2. threshold 3. volitility range
    //=======================
    const threshold = 0.01 * orderBook.averagePrice; //1% of what old 50th order was
    let strength = trend / threshold; //strength = trend + news(sentiment)
    strength *= 1 + sentiment * 0.8;
    const volatilityRange = 0.002 * (1 + Math.abs(sentiment) * 2);
    let price =
      strength > 0
        ? current * (1 + Math.abs(Math.random()) * volatilityRange)
        : current * (1 - Math.abs(Math.random()) * volatilityRange);

    let OrderType = strength > 0 ? "Buy" : "Sell";
    const Quantity = OrderQuantity * Math.min(Math.abs(strength), 2);

    const prob = Math.min(1, Math.abs(strength));
    if (Math.random() > prob) return;

    // Random trader can only trade when--- money>price || shares>0
    // if (OrderType === "Sell" && this.assetInventory < Quantity) {
    //   return;
    // } else if (OrderType === "Buy" && this.cashDeposit < Quantity * price) {
    //   return;
    // }
    // console.log(
    //   "placing trendfollower ",
    //   OrderType,
    //   this.assetInventory,
    //   this.cashDeposit,
    // );

    return orderBook.place_Order(
      OrderType as "Buy" | "Sell",
      price,
      Quantity,
      orderBook.ShareName,
      TraderInstance,
    );
  }
}

export class MarketCorrectionTrader {
  assetInventory: Record<string, asset>;
  cashDeposit: number;
  all_OrderBooks: Record<string, OrderBook>;
  // OrderQuantity: number;
  constructor(
    assetInventory: Record<string, asset>,
    cashDeposit: number,
    all_OrderBooks: Record<string, OrderBook>,
  ) {
    this.assetInventory = assetInventory;
    this.cashDeposit = cashDeposit;
    this.all_OrderBooks = all_OrderBooks;

    // this.OrderQuantity = 0;
  }
  placeOrder(
    TraderInstance: TraderType,
    sentiment: number,
    OrderBook: OrderBook,
  ) {
    const orderBook = OrderBook;
    const current = orderBook.Current_Market_SharePrice;
    const avg = orderBook.averagePrice;
    const threshold = avg * 0.01; //1%
    if (threshold == 0) return;
    let strength = (current - avg) / threshold; //
    //deciding knobs---> 1. sentiment  2. OrderQuantity
    strength *= 1 + sentiment * 0.8;
    let OrderType = strength > 0 ? "Sell" : "Buy";
    const OrderQuantity = 10 * Math.abs(strength);

    // If sentiment agrees with the deviation (hype pushing price up further),
    // correction trader gets suppressed — market stays irrational longer
    const sentimentFightingCorrection =
      (strength > 0 && sentiment > 0.3) || (strength < 0 && sentiment < -0.3);

    const probability = sentimentFightingCorrection
      ? 0.15 // sentiment is overpowering — correction delayed
      : 0.6 + Math.min(0.3, Math.abs(strength) * 0.05); // correction more likely

    const variation = 0.002 * (1 + Math.abs(sentiment) * 2);
    const price =
      strength > 0
        ? current * (1 + Math.random() * variation)
        : current * (1 - Math.random() * variation);

    // //Random trader can only trade when--- money>price || shares>0
    // if (OrderType === "Sell" && this.assetInventory < OrderQuantity) {
    //   return;
    // }
    // if (OrderType === "Buy" && this.cashDeposit < OrderQuantity * price) {
    //   return;
    // }

    // console.log("price",price);
    //strenght >0 devitation +ve sell//else buy
    if (Math.random() < probability) {
      return orderBook.place_Order(
        OrderType as "Sell" | "Buy",
        price,
        OrderQuantity,
        orderBook.ShareName,
        TraderInstance,
      );
    }
  }
}

//Market maker should work when Random trader fails to provide the liquidity

export class MarketMaker {
  assetInventory: Record<string, asset>;
  cashDeposit: number;
  all_OrderBooks: Record<string, OrderBook>;

  constructor(
    assetInventory: Record<string, asset>,
    cashDeposit: number,
    all_OrderBooks: Record<string, OrderBook>,
  ) {
    this.assetInventory = assetInventory;
    this.cashDeposit = cashDeposit;
    this.all_OrderBooks = all_OrderBooks;
  }

  //Its just to provide Liquidity- Buy offer at just below MKP and sell just above MKP
  placeOrder(
    quantity: number,
    TraderInstance: TraderType,
    sentiment: number,
    OrderBook: OrderBook,
  ) {
    const orderBook = OrderBook;
    const current = orderBook.Current_Market_SharePrice;

    const spreadMultiplier = 1 + Math.abs(sentiment) * 3;
    const spread = current * 0.001 * spreadMultiplier;

    const buyPrice = current - spread;
    const sellPrice = current + spread;

    const skewedByFear = sentiment < -0.4;
    const buyQty = skewedByFear
      ? Math.max(1, Math.round(quantity * 0.4))
      : quantity;
    const sellQty =
      sentiment > 0.4 ? Math.max(1, Math.round(quantity * 0.4)) : quantity;

    // if (this.assetInventory < quantity) {
    //   return;
    // }
    // if (this.cashDeposit < quantity * buyPrice) {
    //   return;
    // }

    // place BOTH sides
    orderBook.place_Order(
      "Buy",
      buyPrice,
      buyQty,
      orderBook.ShareName,
      TraderInstance,
    );
    orderBook.place_Order(
      "Sell",
      sellPrice,
      sellQty,
      orderBook.ShareName,
      TraderInstance,
    );
  }
}

export class Player {
  assetInventory: Record<string, asset>;
  totalAssetValue: number;
  all_OrderBooks: Record<string, OrderBook>;
  cashDeposit: number;
  constructor(
    assetInventory: Record<string, asset>,
    cashDeposit: number,
    all_OrderBooks: Record<string, OrderBook>,
  ) {
    this.cashDeposit = cashDeposit;
    this.assetInventory = assetInventory; //The different assets player going to have
    this.totalAssetValue = 0;
    this.all_OrderBooks = all_OrderBooks;
  }
  getPlayerWorth(){
    let playerworth = 0
    for (const asset in this.assetInventory ){
      playerworth+=this.assetInventory[asset].asset.Current_Market_SharePrice
    }
    return this.cashDeposit+playerworth;
  }
  placeOrder(
    OrderQuantity: number,
    TraderInstance: TraderType,
    OrderBook: OrderBook,
    OrderPrice: number,
    OrderType: OrderType,
  ) {
    if (OrderQuantity < 0) return;
    // if(!this.assetInventory[`${OrderBook.ShareName}`]){
    //   this.assetInventory[`${OrderBook.ShareName}`]
    // }

    return OrderBook.place_Order(
      OrderType,
      OrderPrice,
      OrderQuantity,
      OrderBook.ShareName,
      TraderInstance,
    );
  }
}

//==============================Event System Affecting traders===============

export class Event {
  name: string;
  dreadness: number; // [-1, 1] -1= negative news, 0= neutral, 1=positive news
  category: eventType;
  weight_of_occuring: number;
  // weight should be depend on randomness + cooldown + memory_of_prev event
  //if event A just occur--> it may affect other weight, tickduration, decayrate, cooldown time
  tick_duration: number;
  startTime: number;
  decayRate: number;
  affectedTraders: TraderType[] | null;
  coolDown: number;
  affectedMarkets: OrderBook[] | null;

  constructor(
    name: string,
    dreadness: number,
    tick_duration: number,
    decayRate: number,
    weight_of_occuring: number,
    category: eventType,
    coolDown: number,
    affectedMarket: OrderBook[], // one event can affect multiple markets
  ) {
    this.name = name;
    this.dreadness = dreadness;
    this.category = category;
    this.tick_duration = tick_duration;
    this.decayRate = decayRate;
    this.startTime = Date.now();
    this.affectedTraders = null;
    this.weight_of_occuring = weight_of_occuring;
    this.coolDown = coolDown;
    this.affectedMarkets = affectedMarket;
  }

  update_weight_of_occuring(updation: number) {
    this.weight_of_occuring += updation;
  }

  update_coolDown(updation: number) {
    this.coolDown += updation;
  }

  isActive() {
    return Date.now() - this.startTime < this.tick_duration;
  }

  getInfluence() {
    const elapsed = Date.now() - this.startTime;
    return this.dreadness * Math.exp(-this.decayRate * elapsed);
  }
}
export type eventType =
  | "Bullish"
  | "Bearish"
  | "Hype"
  | "Panic"
  | "OVERVALUED"
  | "UNDERVALUED"
  | "TREND_BOOST"
  | "TREND_EXHAUSTION";

export class EventSystem {
  active_Events: Event[] = [];

  addEvent(event: Event) {
    this.active_Events.push(event);
  }

  update() {
    // remove dead active_Events
    this.active_Events = this.active_Events.filter((e) => e.isActive());
  }

  getMarketSentiment(): number {
    let sentiment = 0;

    for (const e of this.active_Events) {
      sentiment += e.getInfluence();
    }

    // clamp to [-1, 1]
    return Math.max(-1, Math.min(1, sentiment));
  }
}
