//  (Flaw1.- I should Deduct the share in the first place when place order but for the I'll have to implement the cancelation feature as well for now I'm not doing that just deducting shares only on settlement)

type OrderType = "Buy" | "Sell";
type TraderType = RandomTrader | TrendFollower | MarketCorrectionTrader;

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
        Buyer.cashDeposit -= settlementMoney;
        Buyer.assetInventory += settlementShares;
        const Seller = bestSell.Order_PlacedBy;
        Seller.cashDeposit += settlementMoney;
        Seller.assetInventory -= settlementShares;

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
        Seller.cashDeposit += settlementMoney;
        Seller.assetInventory -= settlementShares;

        const Buyer = bestBuy.Order_PlacedBy;
        Buyer.cashDeposit -= settlementMoney;
        Buyer.assetInventory += settlementShares;

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
        top20BuyOrders.set(top, this.BuyOrders_Heap.All_BuyOrders_Map.priceMap.get(top)?.head?.ChildrenSize||-1);
      }
    }

    for (let i = 0; i < 20 && sellOrderCopy.length > 0; i++) {
      const top = this.#deleteMin(sellOrderCopy);
      if (top) {
        top20SellOrders.set(top, this.SellOrders_Heap.All_SellOrders_Map.priceMap.get(top)?.head?.ChildrenSize||-1);
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

export class RandomTrader {
  assetInventory: number;
  cashDeposit: number;
  OrderBook: OrderBook;

  // OrderQuantity: number;
  constructor(
    assetInventory: number,
    cashDeposit: number,
    OrderBook: OrderBook,
  ) {
    this.assetInventory = assetInventory;
    this.cashDeposit = cashDeposit;
    this.OrderBook = OrderBook;

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

  placeOrder(OrderQuantity: number, TraderInstance: TraderType) {
    if (OrderQuantity < 0) return;
    const OrderType: OrderType = Math.random() < 0.5 ? "Sell" : "Buy";
    const currentMKP = this.OrderBook.Current_Market_SharePrice; //marketprice
    const volatilityRange = 0.003; //%
    let variation = currentMKP * volatilityRange * this.#randn(); //current*0.001 = 0.1% * (-3,+3) = +-0.3%
    // let variation = currentMKP * volatilityRange * (OrderType==="Sell"?Math.abs(this.#randn()):this.#randn());  //Just in case of panic
    // console.log("variation", (variation / currentMKP) * 100);

    const newPrice = Number((currentMKP + variation).toFixed(2));
   
    const order = this.OrderBook.place_Order(
      OrderType,
      newPrice,
      OrderQuantity,
      this.OrderBook.ShareName,
      TraderInstance,
    );
    return order;
  }
}

export class TrendFollower {
  assetInventory: number;
  cashDeposit: number;
  OrderBook: OrderBook;

  // OrderQuantity: number;
  constructor(
    assetInventory: number,
    cashDeposit: number,
    OrderBook: OrderBook,
  ) {
    this.assetInventory = assetInventory;
    this.cashDeposit = cashDeposit;
    this.OrderBook = OrderBook;
    // this.OrderQuantity = 0;
  }
  placeOrder(OrderQuantity: number, TraderInstance: TraderType) {
    const trend = this.OrderBook.trendAvg - this.OrderBook.averagePrice;
    const threshold = 0.01 * this.OrderBook.averagePrice; //1% of what old 50th order was
    const strength = trend / threshold;
    const prob = Math.min(1, Math.abs(strength));
    if (Math.random() > prob) return;

    const current = this.OrderBook.Current_Market_SharePrice;

    const price =
      strength > 0
        ? current * (1 + Math.random() * 0.002)
        : current * (1 - Math.random() * 0.002);

    return this.OrderBook.place_Order(
      strength > 0 ? "Buy" : "Sell",
      price,
      OrderQuantity * Math.abs(strength),
      this.OrderBook.ShareName,
      TraderInstance,
    );
  }
}

export class MarketCorrectionTrader {
  assetInventory: number;
  cashDeposit: number;
  OrderBook: OrderBook;
  // OrderQuantity: number;
  constructor(
    assetInventory: number,
    cashDeposit: number,
    OrderBook: OrderBook,
  ) {
    this.assetInventory = assetInventory;
    this.cashDeposit = cashDeposit;
    this.OrderBook = OrderBook;
    // this.OrderQuantity = 0;
  }
  placeOrder(TraderInstance: TraderType) {
    const current = this.OrderBook.Current_Market_SharePrice;
    const avg = this.OrderBook.averagePrice;
    const threshold = avg * 0.1; //10%
    if (threshold == 0) return;
    const deviation = current - avg; //Deviation directly proportional to DUMP/PUMP factor
    const strength = deviation / threshold; //

    // const probability = 1 - Math.exp(-Math.abs(strength));
    const probability = 0.6;
    const baseQty = 10;

    const price =
      strength > 0
        ? current * (1 + Math.random() * 0.002)
        : current * (1 - Math.random() * 0.002);
    // console.log("price",price);
    //strenght >0 devitation +ve sell//else buy
    if (Math.random() < probability) {
      return this.OrderBook.place_Order(
        strength > 0 ? "Sell" : "Buy",
        price,
        baseQty * Math.abs(strength),
        this.OrderBook.ShareName,
        TraderInstance,
      );
    }
  }
}

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
    // console.log(this.close);
    // console.log(this.posX,"hi");
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
