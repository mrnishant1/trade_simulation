class Node:
    def __init__(self):
        self.children = dict()
        self.isEow = False

class Trie:
    def __init__(self):
        self.root = Node()

    def insert(self, word):
        node = self.root
        for i in word:
            if(not node.children.get(i)):
                node.children[i]=Node()
            node = node.children.get(i)
        node.isEow = True
        
    def search(self, word):
        node = self.root
        for i in word:
            if(not node.children.get(i)):
                return False
            node = node.children.get(i)
        return node.isEow
    def startsWith(self, prefix):
        node = self.root
        for i in prefix:
            if(not node.children.get(i)):
                return False
            node = node.children.get(i)
        return True
    
a = Trie()
print(a.insert("app"))
print(a.search("app"))
print(a.startsWith("ap"))

        