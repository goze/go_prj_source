class GameNode {
  /**
 * @constructor
 * @param {GameNode} parent Parent of the node
 * @param {Object} properties SGF-like JSON object to load into the node
 */
  constructor(parent, properties, id) {
    this._id = (typeof id != "undefined" ? id : this.gameNodeIdCounter++);
    this._parent = parent || null;
    this._children = [];
    this._preferredChild = 0;
    if (properties)
        this.loadJson(properties);
  }

  /**
   * Adds a property to this node without replacing existing values. If
   * the given property already exists, it will make the value an array
   * containing the given value and any existing values.
  **/
  pushProperty(prop, value) {
      if (this[prop]) {
          if (!(this[prop] instanceof Array))
              this[prop] = [this[prop]];
          if (!this[prop].contains(value))
              this[prop].push(value);
      } else {
          this[prop] = value;
      }
  }
  /**
   * Check whether this node contains the given property with the given
   * value
  **/
  hasPropertyValue(prop, value) {
      if (!this[prop]) return false;
      var values = (this[prop] instanceof Array ? this[prop] : [this[prop]]);
      return values.contains(value);
  }
  /**
   * Removes a value from property or properties. If the value is the only
   * one for the property, removes the property also. Value can be a RegExp
   * or a string
  **/
  deletePropertyValue(prop, value) {
      var test = (value instanceof RegExp) ?
          function(v) { return value.test(v); } :
          function(v) { return value == v; };
      var props = (prop instanceof Array ? prop : [prop]);
      for (var i = 0; prop = props[i]; i++) {
          if (this[prop] instanceof Array) {
              this[prop] = this[prop].filter(function(v) { return !test(v); });
              if (!this[prop].length) delete this[prop];
          } else if (test(this.prop)) {
              delete this[prop];
          }
      }
  }
  /**
   * Loads SGF-like data given in JSON format:
   *      {PROP1: VALUE, PROP2: VALUE, _children: [...]}
   * Node properties will be overwritten if they exist or created if they
   * don't.
   *
   * We use a stack instead of recursion to avoid recursion limits.
  **/
  loadJson(data) {
      var jsonStack = [data], gameStack = [this];
      var jsonNode, gameNode;
      var i, len;
      while (jsonStack.length) {
          jsonNode = jsonStack.pop();
          gameNode = gameStack.pop();
          gameNode.loadJsonNode(jsonNode);
          len = (jsonNode._children ? jsonNode._children.length : 0);
          for (i = 0; i < len; i++) {
              jsonStack.push(jsonNode._children[i]);
              if (!gameNode._children[i])
                  gameNode._children[i] = new GameNode(gameNode);
              gameStack.push(gameNode._children[i]);
          }
      }
  }
  /**
   * Adds properties to the current node from a JSON object
  **/
  loadJsonNode(data) {
      for (var prop in data) {
          if (prop == "_id") {
              this[prop] = data[prop].toString();
              this.gameNodeIdCounter = Math.max(this.gameNodeIdCounter,
                                                  parseInt(data[prop], 10));
              continue;
          }
          if (prop.charAt(0) != "_")
              this[prop] = data[prop];
      }
  }
  /**
   * Add a new child (variation)
  **/
  appendChild(node) {
      node._parent = this;
      this._children.push(node);
  }
  /**
   * Returns all the properties for this node
  **/
  getProperties() {
      var properties = {}, propName, isReserved, isString, isArray;
      for (propName in this) {
          isPrivate = (propName.charAt(0) == "_");
          isString = (typeof this[propName] == "string");
          isArray = (this[propName] instanceof Array);
          if (!isPrivate && (isString || isArray))
              properties[propName] = this[propName];
      }
      return properties;
  }
  /**
   * Applies a function to this node and all its children, recursively
   * (although we use a stack instead of actual recursion)
  **/
  walk(fn, thisObj) {
      var stack = [this];
      var node;
      var i, len;
      while (stack.length) {
          node = stack.pop();
          fn.call(thisObj || this, node);
          len = (node._children ? node._children.length : 0);
          for (i = 0; i < len; i++)
              stack.push(node._children[i]);
      }
  }
  /**
   * Get the current black or white move as a raw SGF coordinate
  **/
  getMove() {
      if (typeof this.W != "undefined")
          return this.W;
      else if (typeof this.B != "undefined")
          return this.B;
      return null;
  }
  /**
   * Empty the current node of any black or white stones (played or added)
  **/
  emptyPoint(coord) {
      var props = this.getProperties();
      var deleted = null;
      for (var propName in props) {
          if (propName == "AW" || propName == "AB" || propName == "AE") {
              if (!(this[propName] instanceof Array))
                  this[propName] = [this[propName]];
              this[propName] = this[propName].filter(function(val) {
                  if (val == coord) {
                      deleted = val;
                      return false;
                  }
                  return true;
              });
              if (!this[propName].length)
                  delete this[propName];
          } else if ((propName == "B" || propName == "W") && this[propName] == coord) {
              deleted = this[propName];
              delete this[propName];
          }
      }
      return deleted;
  }
  /**
   * Returns the node's position in its parent's _children array
  **/
  getPosition() {
      if (!this._parent) return null;
      var siblings = this._parent._children;
      for (var i = 0; i < siblings.length; i++)
          if (siblings[i]._id == this._id) {
              return i;
          }
      return null;
  }
  /**
   * Converts this node and all children to SGF
  **/
  toSgf() {
      var sgf = (this._parent ? "(" : "");
      var node = this;

      function propsToSgf(props) {
          if (!props) return "";
          var sgf = ";", key, val;
          for (key in props) {
              if (props[key] instanceof Array) {
                  val = props[key].map(function (val) {
                      return val.toString().replace(/\]/g, "\\]");
                  }).join("][");
              } else {
                  val = props[key].toString().replace(/\]/g, "\\]");
              }
              sgf += key + "[" + val  + "]";
          }
          return sgf;
      }

      sgf += propsToSgf(node.getProperties());

      // Follow main line until we get to a node with multiple variations
      while (node._children.length == 1) {
          node = node._children[0];
          sgf += propsToSgf(node.getProperties());
      }

      // Variations
      for (var i = 0; i < node._children.length; i++) {
          sgf += node._children[i].toSgf();
      }

      sgf += (this._parent ? ")" : "");

      return sgf;
  }
}

export default GameNode;
