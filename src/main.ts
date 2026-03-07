type OrderType = "Buy" | "Sell";

class Order {
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

class Node {
  Order: Order;
  Next: Node | null;
  constructor(Order: Order) {
    this.Order = Order;
    this.Next = null;
  }
}

class LinkedList {
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

class Orders_Map {
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

class maxHeap {
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
class minHeap {
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

class OrderBook {
  SellOrders_Heap: minHeap;
  BuyOrders_Heap: maxHeap;
  Current_Market_SharePrice: number;
  constructor() {
    this.SellOrders_Heap = new minHeap(); //Least sell price order on top
    this.BuyOrders_Heap = new maxHeap(); //Highest bid on top
    this.Current_Market_SharePrice = 0; //some number //will change on matchOrder
  }

  place_Order(
    OrderType: OrderType,
    AtPrice: number,
    Quantity: number,
    ShareName: string,
  ) {
    const newOrder = new Order(OrderType, ShareName, Quantity, AtPrice);
    //===================================================before Insert
    //======= check if order already satisfies any order in sell minHeap=====
    if (newOrder.OrderType === "Buy") {
      let buyQty = newOrder.Quantity;

      while (buyQty > 0 && this.SellOrders_Heap.size > 0) {
        const bestSell = this.SellOrders_Heap.peak()?.Order;
        if (!bestSell) break;
        if (newOrder.AtPrice < bestSell.AtPrice) break;

        let sellQty = bestSell.Quantity;
        const tradeQty = Math.min(buyQty, sellQty);

        buyQty -= tradeQty;
        sellQty -= tradeQty;

        console.log("setteling");
        //settel the market price here =======
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

        console.log("setteling");
        //settel the market price here =======
        this.Current_Market_SharePrice = bestBuy.AtPrice;
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

  // Check_For_Settle(){

  // }
}

const FirstOrderBook = new OrderBook();
FirstOrderBook.Current_Market_SharePrice = 100;
let currentSeller:number|null = null
// let lastSeller:number|null = null
let marketSentiment:number|null=null;

  
function RandomMaker() {
  //will make sell offer to current market price in +-1%
  const currentMKP = FirstOrderBook.Current_Market_SharePrice; //marketprice
  const tickSize = 14; // Or whatever your base unit is
  const variation = (Math.random() - 0.5) * (tickSize * 2);
  const newMKP = Number((currentMKP + variation).toFixed(2));
  currentSeller = newMKP;
  console.log(newMKP);
  const order = FirstOrderBook.place_Order("Sell", newMKP, 1, "bananajs");
  return order;
}

function RandomTaker() {
  //will make sell offer to current market price in +-1%
  const currentMKP = FirstOrderBook.Current_Market_SharePrice; //marketprice
  const tickSize = 14; // Or whatever your base unit is
  if(currentSeller){
    marketSentiment = currentMKP - currentSeller 
    console.log(marketSentiment<0?"negative":"positive");
  }

  //Introduction of bias...... in random trader as per market sentiments
  const variation = (Math.random() - ((marketSentiment ?? 0)<0?0.7:0.5)) * (tickSize * 2);
  const newMKP = Number((currentMKP + variation).toFixed(2));
  console.log(newMKP);
  const order = FirstOrderBook.place_Order("Buy", newMKP, 1, "bananajs");
  return order;
}

class Traders{
  constructor(){}

}

const canvas = document.getElementById(
  "monkey_trade",
) as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error("Canvas not found");
}
canvas.width = 2*window.innerWidth;
canvas.height = 600;

const ctx = canvas.getContext("2d");
ctx?.translate(canvas.width / 2, canvas.height / 2);


const maker = [RandomMaker, RandomTaker];

function randomSelector() {
  // 60% chance for a Seller (index 0), 40% for a Buyer (index 1)
  return Math.random() < 0.5 ? maker[0] : maker[1];
}

let i= -window.innerWidth
setInterval(() => {
  const fn = randomSelector();
  fn();
  // ctx?.translate(window.innerHeight/2-i,0)
  // ctx?.save()
  i++ 


  // ctx?.clearRect(0, 0, canvas!.width, canvas!.height);

  const price = FirstOrderBook.Current_Market_SharePrice;
  ctx?.fillRect(i, 300, 10, -price);
}, 10);



