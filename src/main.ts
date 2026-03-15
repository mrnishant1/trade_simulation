type OrderType = "Buy" | "Sell";

export class Order {
  OrderType: OrderType;
  ShareName: string;
  Quantity: number;
  AtPrice: number;
  time: string;
  OrderID: string;
  constructor(
    OrderType: OrderType,
    ShareName: string,
    Quantity: number,
    AtPrice: number,
  ) {
    this.OrderType = OrderType;
    this.ShareName = ShareName;
    this.Quantity = Quantity;
    this.AtPrice = AtPrice;
    this.time = new Date().toLocaleTimeString();
    this.OrderID = this.time + ShareName + OrderType;
  }
}

export class Node {
  Order: Order;
  Next: Node | null;
  constructor(Order: Order) {
    this.Order = Order;
    this.Next = null;
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
    } else {
      let currentNode: Node = this.head;
      while (currentNode.Next != null) {
        currentNode = currentNode.Next;
      }
      currentNode.Next = new Node(Order);
    }
  }

  deleteFirst() {
    if (!this.head) return;
    let currentNode: Node = this.head;
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
    //Insert the order in Map for fast retrieval of all orders at same price
    //=====IMP=====Insert per price: insertion happen only on unique price not on repeated price
    //on repeated prices just insert into linked list
    const isThereOrderExist = this.All_BuyOrders_Map.priceMap.has(
      Order.AtPrice,
    );

    this.All_BuyOrders_Map.insert(Order); //Insertion in linked list without question
    if (!isThereOrderExist) {
      this.priceHeap.push(value);
      this.size++;
      let i = this.priceHeap.length - 1;
      let parent = Math.floor((i + 1) / 2) - 1;
      if (parent < 0) {
        return;
      }
      let parentValue = this.priceHeap[parent];
      while (value > parentValue) {
        //console.log("step12 3",value,parent,parentValue);

        this.#swapElements(this.priceHeap, i + 1, parent);
        i = parent;
        parent = Math.floor((i + 1) / 2) - 1;
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
      let parent = Math.floor((i + 1) / 2) - 1;
      if (parent < 0) {
        return;
      }
      let parentValue = this.priceHeap[parent];
      while (value < parentValue) {
        //console.log("step2 3",value,parent,parentValue);

        this.#swapElements(this.priceHeap, i, parent);
        i = parent;
        parent = Math.floor((i + 1) / 2) - 1;
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
  lastSettleMentPrice: number;
  index: number;
  slope: number;
  lastPrices: number[];
  averagePrice: number;

  constructor(ShareName: string, Starting_SharePrice: number) {
    this.ShareName = ShareName;
    this.SellOrders_Heap = new minHeap(); //Least sell price order on top
    this.BuyOrders_Heap = new maxHeap(); //Highest bid on top
    this.Current_Market_SharePrice = Starting_SharePrice; //some number //will change on matchOrder
    this.lastSettleMentPrice = Starting_SharePrice;
    this.index = 0;
    this.slope = 0;
    this.lastPrices = [];
    this.averagePrice = 0;
  }

  place_Order(
    OrderType: OrderType,
    AtPrice: number,
    Quantity: number,
    ShareName: string,
  ) {
    if (AtPrice < 0) return;
    const newOrder = new Order(OrderType, ShareName, Quantity, AtPrice);
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

        buyQty -= tradeQty;
        sellQty -= tradeQty;

        // console.log("setteling");

        //settel the market price here =======
        this.#calculate_Slope(50);
        this.Current_Market_SharePrice = newOrder.AtPrice;
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
      return this.Current_Market_SharePrice;
    }

    if (newOrder.OrderType === "Sell") {
      let sellQty = newOrder.Quantity;
      //console.log("step1");
      while (sellQty > 0 && this.BuyOrders_Heap.size > 0) {
        const bestBuy = this.BuyOrders_Heap.peak()?.Order;
        if (!bestBuy) break;
        if (newOrder.AtPrice > bestBuy.AtPrice) break;
        //console.log("step2");

        let buyQty = bestBuy.Quantity;
        const tradeQty = Math.min(sellQty, buyQty);

        sellQty -= tradeQty;
        buyQty -= tradeQty;

        // console.log("setteling");
        //settel the market price here =======
        this.#calculate_Slope(50);
        this.Current_Market_SharePrice = newOrder.AtPrice;
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

      return this.Current_Market_SharePrice;
    }
  }

  #calculate_Slope(Orders_toSee: number) {
    this.index++;

    // Average Price calculation for market correction Trader
    this.lastPrices.push(this.Current_Market_SharePrice);
    if (this.lastPrices.length > Orders_toSee) {
      this.lastPrices.shift();
      this.averagePrice = this.#sum(this.lastPrices);
   
    }
    this.averagePrice = Number((this.averagePrice / Orders_toSee).toFixed(3));

    //Market price tragetory of =======
    if (this.index % Orders_toSee === 0) {
      this.slope = Number(
        (
          (this.Current_Market_SharePrice - this.lastSettleMentPrice) /
          Orders_toSee
        ).toFixed(3),
      );
      this.lastSettleMentPrice = this.Current_Market_SharePrice;
      this.index = 0;
    }
  }

  #sum(lastPrices: number[]) {
    let total = 0;
    for (let i of lastPrices) {
      total += i;
    }
    return total;
  }
}

export class Traders {
  OrderBook: OrderBook;
  constructor(OrderBook: OrderBook) {
    this.OrderBook = OrderBook;
  }

  //Trader type(Momentum trader- keeps the market momentum) 1... (Random trader place order +-Volitility).....
  //This Trader's phelosopy- sell at market or more/ Buy at market or less....
  RandomTrader(OrderQuantity: number) {
    if (OrderQuantity < 0) return;
    const OrderType: OrderType = Math.random() < 0.7 ? "Sell" : "Buy";
    const currentMKP = this.OrderBook.Current_Market_SharePrice; //marketprice
    const volatilityRange = currentMKP * 0.1; // (≈ ±1%)  for now ------------------------------- Need Improvement


    const random = Math.random() - 0.5;
    const variation = random * volatilityRange;
  

    const newPrice = Number((currentMKP + variation).toFixed(2));
    // console.log("New price",newPrice);

    const order = this.OrderBook.place_Order(
      OrderType,
      newPrice,
      OrderQuantity,
      this.OrderBook.ShareName,
    );
    return order;
  }

  // Trader type(Momentum trader) 2... (TrendFollower, follows slope of last 100 orders, with their quantity matters...)
  TrendFollower(OrderQuantity: number) {
    const slope = this.OrderBook.slope;
    const threshold = 0.05;
    const probability_of_orderPlacing = 1;

    if (slope > threshold && Math.random() < probability_of_orderPlacing) {
      return this.OrderBook.place_Order(
        "Buy",
        this.OrderBook.Current_Market_SharePrice,
        OrderQuantity,
        this.OrderBook.ShareName,
      );
    } else if (
      slope < -threshold &&
      Math.random() < probability_of_orderPlacing + 0.1
    ) {
      return this.OrderBook.place_Order(
        "Sell",
        this.OrderBook.Current_Market_SharePrice,
        OrderQuantity,
        this.OrderBook.ShareName,
      );
    }
    // else{
    //   console.log("hi slope is between -0.05 to +0.05",slope);
    // }
  }
  //Trader type(Correction Goes opposite to momentum) // sell - if currentprice>avg price else //buy
  MarketCorrectionTrader(OrderQuantity: number) {
    //sell
    if (
      this.OrderBook.Current_Market_SharePrice >
      this.OrderBook.averagePrice * 1.01
    ) {
      console.log("marketcorrection sold");
      this.OrderBook.place_Order(
        "Sell",
        this.OrderBook.Current_Market_SharePrice,
        OrderQuantity,
        this.OrderBook.ShareName,
      );
    }
    //Buy
    else if (
      this.OrderBook.Current_Market_SharePrice <
      this.OrderBook.averagePrice * 0.99
    ) {
      console.log("marketcorrection bought");
      this.OrderBook.place_Order(
        "Buy",
        this.OrderBook.Current_Market_SharePrice,
        OrderQuantity,
        this.OrderBook.ShareName,
      );
      // } else {
      //   console.log(
      //     "hi: market correction",
      //     this.OrderBook.Current_Market_SharePrice,
      //     this.OrderBook.averagePrice,
      //   );
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
