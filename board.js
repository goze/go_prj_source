import _ from 'lodash';

/**
 * @class Keeps track of board state and passes off rendering to a renderer.
 * We can theoretically have any kind of renderer. The board state is
 * independent of its visual presentation.
 */
class Board {
    /**
     * @constructor
     * @param {Object} The renderer to use to draw the board. Renderers must
     * have at least three methods: clear(), renderStone(), and renderMarker()
     * @param {Number} Board size -- theoretically could be any size,
     * but there's currently only CSS for 9, 13, and 19
     */
    constructor(renderer, boardSize) {
        this.boardSize = boardSize;
        this.WHITE= 1;
        this.BLACK= -1;
        this.EMPTY= 0;
        this.init(renderer, this.boardSize);
    }

    init() {
      this.boardSize = this.boardSize || 19;
      this.stones = this.makeBoardArray(this.EMPTY);
      this.markers = this.makeBoardArray(this.EMPTY);
      this.captures = {};
      this.captures.W = 0;
      this.captures.B = 0;
      this.cache = [];
      this.renderer = renderer || new eidogo.BoardRendererHtml();
      this.lastRender = {
          stones: this.makeBoardArray(null),
          markers: this.makeBoardArray(null)
      };
    }

    reset() {
        this.init(this.renderer, this.boardSize);
    }

    clear() {
        this.clearStones();
        this.clearMarkers();
        this.clearCaptures();
    }

    clearStones() {
        // we could use makeBoardArray(), but this is more efficient
        for (var i = 0; i < this.stones.length; i++) {
            this.stones[i] = this.EMPTY;
        }
    }

    clearMarkers() {
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i] = this.EMPTY;
        }
    }

    clearCaptures() {
        this.captures.W = 0;
        this.captures.B = 0;
    }

    makeBoardArray(val) {
        // We could use a multi-dimensional array but doing this avoids
        // the need for deep copying during commit, which is very slow.
        //return [].setLength(this.boardSize * this.boardSize, val);
        return _.range(this.boardSize * this.boardSize).map(val);
    }
    /**
     * Save the current state. This allows us to revert back
     * to previous states for, say, navigating backwards in a game.
     */
    commit() {
        this.cache.push({
            stones: this.stones.concat(),
            captures: {W: this.captures.W, B: this.captures.B}
        });
    }

    /**
     * Undo any uncomitted changes.
     */
    rollback() {
        if (this.cache.last()) {
            this.stones = this.cache.last().stones.concat();
            this.captures.W = this.cache.last().captures.W;
            this.captures.B = this.cache.last().captures.B;
        } else {
            this.clear();
        }
    }

    /**
     * Revert to a previous state.
     */
    revert(steps) {
        steps = steps || 1;
        this.rollback();
        for (var i = 0; i < steps; i++) {
            this.cache.pop();
        }
        this.rollback();
    }

    addStone(pt, color) {
        this.stones[pt.y * this.boardSize + pt.x] = color;
    }

    getStone(pt) {
        return this.stones[pt.y * this.boardSize + pt.x];
    }

    getRegion(t, l, w, h) {
        var region = [].setLength(w * h, this.EMPTY);
        var offset;
        for (var y = t; y < t + h; y++) {
            for (var x = l; x < l + w; x++) {
                offset = (y - t) * w + (x - l);
                region[offset] = this.getStone({x:x, y:y});
            }
        }
        return region;
    }

    addMarker(pt, type) {
        this.markers[pt.y * this.boardSize + pt.x] = type;
    }
    getMarker(pt) {
        return this.markers[pt.y * this.boardSize + pt.x];
    }
    render(complete) {
        var stones = this.makeBoardArray(null);
        var markers = this.makeBoardArray(null);
        var color, type;
        var len;
        if (!complete && this.cache.last()) {
            var lastCache = this.cache.last();
            len = this.stones.length;
            // render only points that have changed since the last render
            for (var i = 0; i < len; i++) {
                if (lastCache.stones[i] != this.lastRender.stones[i]) {
                    stones[i] = lastCache.stones[i];
                }
            }
            markers = this.markers;
        } else {
            // render everything
            stones = this.stones;
            markers = this.markers;
        }
        var offset;
        for (var x = 0; x < this.boardSize; x++) {
            for (var y = 0; y < this.boardSize; y++) {
                offset = y * this.boardSize + x;
                if (markers[offset] != null) {
                    this.renderer.renderMarker({x: x, y: y}, markers[offset]);
                    this.lastRender.markers[offset] = markers[offset];
                }
                if (stones[offset] == null) {
                    continue;
                } else if (stones[offset] == this.EMPTY) {
                    color = "empty";
                } else {
                    color = (stones[offset] == this.WHITE ? "white" : "black");
                }
                this.renderer.renderStone({x: x, y: y}, color);
                this.lastRender.stones[offset] = stones[offset];
            }
        }
    }
}

export default Board;
