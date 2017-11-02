/**
 * @class GameCursor is used to navigate among the nodes of a game tree.
 */
class GameCursor {
  /**
 * @constructor
 * @param {GameNode} A node to start with
 */
  constructor(node) {
    this.node = node;
  }

  next(varNum) {
      if (!this.hasNext()) return false;
      varNum = (typeof varNum == "undefined" || varNum == null ?
          this.node._preferredChild : varNum);
      this.node._preferredChild = varNum;
      this.node = this.node._children[varNum];
      return true;
  }
  previous() {
      if (!this.hasPrevious()) return false;
      this.node = this.node._parent;
      return true;
  }
  hasNext() {
      return this.node && this.node._children.length;
  }
  hasPrevious() {
      // Checking _parent of _parent is to prevent returning to root
      return this.node && this.node._parent && this.node._parent._parent;
  }
  getNextMoves() {
      if (!this.hasNext()) return null;
      var moves = {};
      var i, node;
      for (i = 0; node = this.node._children[i]; i++)
          moves[node.getMove()] = i;
      return moves;
  }
  getNextColor() {
      if (!this.hasNext()) return null;
      var i, node;
      for (var i = 0; node = this.node._children[i]; i++)
          if (node.W || node.B)
              return node.W ? "W" : "B";
      return null;
  }
  getNextNodeWithVariations() {
      var node = this.node;
      while (node._children.length == 1)
          node = node._children[0];
      return node;
  }
  getPath() {
      var n = this.node,
          rpath = [],
          mn = 0;
      while (n && n._parent && n._parent._children.length == 1 && n._parent._parent) {
          mn++;
          n = n._parent;
      }
      rpath.push(mn);
      while (n) {
          if (n._parent && (n._parent._children.length > 1 || !n._parent._parent))
              rpath.push(n.getPosition() || 0);
          n = n._parent;
      }
      return rpath.reverse();
  }
  getPathMoves() {
      var path = [];
      var cur = new GameCursor(this.node);
      path.push(cur.node.getMove());
      while (cur.previous()) {
          var move = cur.node.getMove();
          if (move) path.push(move);
      }
      return path.reverse();
  }
  getMoveNumber() {
      var num = 0,
          node = this.node;
      while (node) {
          if (node.W || node.B) num++;
          node = node._parent;
      }
      return num;
  }
  getGameRoot() {
      if (!this.node) return null;
      var cur = new GameCursor(this.node);
      // If we're on the tree root, return the first game
      if (!this.node._parent && this.node._children.length)
          return this.node._children[0];
      while (cur.previous()) {};
      return cur.node;
  }

}

export default GameCursor;
