class Node {
  constructor() {
    this.children = new Map();
    this.isEow = false;
  }
}

class Trie {
  constructor() {
    this.root = new Node();
  }
  insert(word) {
    let node = this.root;
    
    for (let i of word) {
        console.log(i);
      if (!node.children.has(i)) {
        node.children.set(i, new Node());
      }
      node = node.children.get(i);
    }
    node.isEow = true;
  }
  check(word) {
    let node = this.root;
    for (let i of word) {
      if (!node.children.has(i)) {
        return false;
      }
      node = node.children.get(i);
    }

    return node.isEow;
  }
}
let a = new Trie();
a.insert("apd");
console.log(a.check("apppppp"));
