import GameNode from './gamenode';
import GameCursor from './gamecursor';
import SgfParser from './sgf';
import Rules from './rules';
import BoardRendererSVG from './board-renderer-svg';
import Board from './board';

/**
 * @class Player is the overarching control structure that allows you to
 * load and replay games. It's a "player" in the sense of a DVD player, not
 * a person who plays a game.
 */
 class Player {
   constructor(cfg) {
     // handlers for the various types of GameNode properties
      this.propertyHandlers = {
          W:  this.playMove,
          B:  this.playMove,
          KO: this.playMove,
          MN: this.setMoveNumber,
          AW: this.addStone,
          AB: this.addStone,
          AE: this.addStone,
          CR: this.addMarker, // circle
          LB: this.addMarker, // label
          TR: this.addMarker, // triangle
          MA: this.addMarker, // X
          SQ: this.addMarker, // square
          TW: this.addMarker,
          TB: this.addMarker,
          DD: this.addMarker,
          PL: this.setColor,
          C:  this.showComments,
          N:  this.showAnnotation,
          GB: this.showAnnotation,
          GW: this.showAnnotation,
          DM: this.showAnnotation,
          HO: this.showAnnotation,
          UC: this.showAnnotation,
          V:  this.showAnnotation,
          BM: this.showAnnotation,
          DO: this.showAnnotation,
          IT: this.showAnnotation,
          TE: this.showAnnotation,
          BL: this.showTime,
          OB: this.showTime,
          WL: this.showTime,
          OW: this.showTime
      };

      this.infoLabels = {
          GN: 'game',
          PW: 'white',
          WR: 'white rank',
          WT: 'white team',
          PB: 'black',
          BR: 'black rank',
          BT: 'black team',
          HA: 'handicap',
          KM: 'komi',
          RE: 'result',
          DT: 'date',
          GC: 'info',
          PC: 'place',
          EV: 'event',
          RO: 'round',
          OT: 'overtime',
          ON: 'opening',
          RU: 'ruleset',
          AN: 'annotator',
          CP: 'copyright',
          SO: 'source',
          TM: 'time limit',
          US: 'transcriber',
          AP: 'created with'
          // FF, GM, TM
      };

      this.months = [
          'january',
          'february',
          'march',
          'april',
          'may',
          'june',
          'july',
          'august',
          'september',
          'october',
          'november',
          'december'
      ];

      // crop settings
      this.cropParams = null;
      this.shrinkToFit = cfg.shrinkToFit;
      if (this.shrinkToFit || cfg.cropWidth || cfg.cropHeight) {
          this.cropParams = {};
          this.cropParams.width = cfg.cropWidth;
          this.cropParams.height = cfg.cropHeight;
          this.cropParams.left = cfg.cropLeft;
          this.cropParams.top = cfg.cropTop;
          this.cropParams.padding = cfg.cropPadding || 1;
      }

      this.renderer = null;
      this.loadSgf(cfg);
   }

   loadSgf(cfg){
      this.reset();

      // raw SGF data
      var sgf = new SgfParser(cfg.sgf);
      this.load(sgf.root);

   }

   /**
    * Loads game data into a given target. If no target is given, creates
    * a new gameRoot and initializes the game.
   **/
   load(data){
      target = new GameNode();
      this.collectionRoot = target;

      target.loadJson(data);
      target._cached = true;

      this.initGame(target._children[0]);

   }

//************************************
   initGame(gameRoot) {
      gameRoot = gameRoot || {};

      var size = gameRoot.SZ || 19;
      // Only three sizes supported for now
      if (size != 7 && size != 9 && size != 13 && size != 19)
          size = 19;
      if (this.shrinkToFit)
          this.calcShrinkToFit(gameRoot, size);
      else if (this.problemMode && !this.cropParams) {
          this.cropParams = {
              width: size,
              height: size,
              top: 0,
              left: 0,
              padding: 1};
      }
      console.log("zbg:this.board1")
      if (!this.board) {
          console.log("zbg:!this.board" + this.board )
          // first time
          this.createBoard(size);
          this.rules = new Rules(this.board);
      }
      console.log("zbg:this.board3")
      //this.unsavedChanges = false;
      this.resetCursor(true);
      this.totalMoves = 0;
      var moveCursor = new GameCursor(this.cursor.node);
      while (moveCursor.next()) { this.totalMoves++; }
      this.totalMoves--;
      this.showGameInfo(gameRoot);
      this.enableNavSlider();
      this.selectTool(this.mode == "view" ? "view" : "play");
      this.hook("initGame");

   }

   /**
    * Delegate to a hook handler. 'this' will be bound to the Player
    * instance
   **/
   hook(hook, params) {
       if (hook in this.hooks) {
           return this.hooks[hook].bind(this)(params);
       }
   }

   /**
    * Handle tool switching
   **/
   selectTool(tool) {
       var cursor;
       hide(this.dom.scoreEst);
       hide(this.dom.labelInput);
       if (tool == "region") {
           cursor = "crosshair";
       } else if (tool == "comment") {
           this.startEditComment();
       } else if (tool == "gameinfo") {
           this.startEditGameInfo();
       } else if (tool == "label") {
           show(this.dom.labelInput, "inline");
           this.dom.labelInput.focus();
       } else {
           cursor = "default";
           this.regionBegun = false;
           this.hideRegion();
           hide(this.dom.searchButton);
           hide(this.dom.searchAlgo);
           if (this.searchUrl)
               show(this.dom.scoreEst, "inline");
       }
       this.board.renderer.setCursor(cursor);
       this.mode = tool;
       this.dom.toolsSelect.value = tool;
   }

   enableNavSlider() {
          // don't use slider for progressively-loaded games
          if (this.progressiveLoad) {
              hide(this.dom.navSliderThumb);
              return;
          }

          this.dom.navSlider.style.cursor = "pointer";

          var sliding = false;
          var timeout = null;

          addEvent(this.dom.navSlider, "mousedown", function(e) {
              sliding = true;
              stopEvent(e);
          }, this, true);

          addEvent(document, "mousemove", function(e) {
              if (!sliding) return;
              var xy = getElClickXY(e, this.dom.navSlider);
              clearTimeout(timeout);
              timeout = setTimeout(function() {
                  this.updateNavSlider(xy[0]);
              }.bind(this), 10);
              stopEvent(e);
          }, this, true);

          addEvent(document, "mouseup", function(e) {
              if (!sliding) return true;
              sliding = false;
              var xy = getElClickXY(e, this.dom.navSlider);
              this.updateNavSlider(xy[0]);
              return true;
          }, this, true);
      }
   /**
    * Parse and display the game's info
   **/
   showGameInfo(gameInfo) {
       this.hook("showGameInfo", gameInfo);
       if (!gameInfo) return;
       this.dom.infoGame.innerHTML = "";
       this.dom.whiteName.innerHTML = "";
       this.dom.blackName.innerHTML = "";
       var dl = document.createElement('dl'), val;
       for (var propName in this.infoLabels) {
           if (gameInfo[propName] instanceof Array) {
               gameInfo[propName] = gameInfo[propName][0];
           }
           if (gameInfo[propName]) {
               if (propName == "PW") {
                   this.dom.whiteName.innerHTML = gameInfo[propName] +
                       (gameInfo['WR'] ? ", " + gameInfo['WR'] : "");
                   continue;
               } else if (propName == "PB") {
                   this.dom.blackName.innerHTML = gameInfo[propName] +
                       (gameInfo['BR'] ? ", " + gameInfo['BR'] : "");
                   continue;
               }
               if (propName == "WR" || propName == "BR") {
                   continue;
               }
               val = gameInfo[propName];
               if (propName == "DT") {
                   var dateParts = gameInfo[propName].split(/[\.-]/);
                   if (dateParts.length == 3) {
                       val = dateParts[2].replace(/^0+/, "") + " "
                           + this.months[dateParts[1]-1] + " " + dateParts[0];
                   }
               }
               var dt = document.createElement('dt');
               dt.innerHTML = this.infoLabels[propName] + ':';
               var dd = document.createElement('dd');
               dd.innerHTML = val;
               dl.appendChild(dt);
               dl.appendChild(dd);
           }
       }
       this.dom.infoGame.appendChild(dl);
   }
   /**
    * Create our board. This can be called multiple times.
   **/
   createBoard(size) {
       size = size || 19;
    //   if (this.board && this.board.renderer && this.board.boardSize == size) return;

       var renderer = new BoardRendererSVG(size, this, this.cropParams);
       console.log("zbg:renderer" + renderer);
       this.board = new Board(renderer, size);

   }

   /**
    * Calculates the crop area to use based on the widest distance between
    * stones and markers in the given game. We're conservative with respect
    * to checking markers: only labels for now.
   **/
   calcShrinkToFit(gameRoot, size) {
       // leftmost, topmost, rightmost, bottommost
       var l = null, t = null, r = null, b = null;
       var points = {};
       var me = this;
       // find all points occupied by stones or labels
       gameRoot.walk(function(node) {
           var prop, i, coord;
           for (prop in node) {
               if (/^(W|B|AW|AB|LB)$/.test(prop)) {
                   coord = node[prop];
                   if (!(coord instanceof Array)) coord = [coord];
                   if (prop != 'LB') coord = me.expandCompressedPoints(coord);
                   else coord = [coord[0].split(/:/)[0]];
                   for (i = 0; i < coord.length; i++)
                       points[coord[i]] = "";
               }
           }
       });
       // nab the outermost points
       for (var key in points) {
           var pt = this.sgfCoordToPoint(key);
           if (l == null || pt.x < l) l = pt.x;
           if (r == null || pt.x > r) r = pt.x;
           if (t == null || pt.y < t) t = pt.y;
           if (b == null || pt.y > b) b = pt.y;
       }
       this.cropParams.width = r - l + 1;
       this.cropParams.height = b - t + 1;
       this.cropParams.left = l;
       this.cropParams.top = t;
       // add padding
       var pad = this.cropParams.padding;
       for (var lpad = pad; l - lpad < 0; lpad--) {};
       if (lpad) { this.cropParams.width += lpad; this.cropParams.left -= lpad; }
       for (var tpad = pad; t - tpad < 0; tpad--) {};
       if (tpad) { this.cropParams.height += tpad; this.cropParams.top -= tpad; }
       for (var rpad = pad; r + rpad > size; rpad--) {};
       if (rpad) { this.cropParams.width += rpad; }
       for (var bpad = pad; b + bpad > size; bpad--) {};
       if (bpad) { this.cropParams.height += bpad; }
   }

   sgfCoordToPoint(coord) {
       if (!coord || coord == "tt") return {x: null, y: null};
       var sgfCoords = {
           a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8, j: 9,
           k: 10,l: 11, m: 12, n: 13, o: 14, p: 15, q: 16, r: 17, s: 18
       };
       return {
           x: sgfCoords[coord.charAt(0)],
           y: sgfCoords[coord.charAt(1)]
       };
   }

   pointToSgfCoord(pt) {
       if (!pt || (this.board && !this.boundsCheck(pt.x, pt.y, [0, this.board.boardSize-1]))) {
           return null;
       }
       var pts = {
           0: 'a', 1: 'b', 2: 'c', 3: 'd', 4: 'e', 5: 'f', 6: 'g', 7: 'h',
           8: 'i', 9: 'j', 10: 'k', 11: 'l', 12: 'm', 13: 'n', 14: 'o',
           15: 'p', 16: 'q', 17: 'r', 18: 's'
       };
       return pts[pt.x] + pts[pt.y];
   }

    /**
     * Check whether a point falls within a given region (left, top, right,
     * bottom)
    **/
    boundsCheck(x, y, region) {
        if (region.length == 2) {
            region[3] = region[2] = region[1];
            region[1] = region[0];
        }
        return (x >= region[0] && y >= region[1] &&
            x <= region[2] && y <= region[3]);
    }

   expandCompressedPoints(coords) {
       var bounds;
       var ul, lr;
       var x, y;
       var newCoords = [];
       var hits = [];
       for (var i = 0; i < coords.length; i++) {
           bounds = coords[i].split(/:/);
           if (bounds.length > 1) {
               ul = this.sgfCoordToPoint(bounds[0]);
               lr = this.sgfCoordToPoint(bounds[1]);
               for (x = ul.x; x <= lr.x; x++) {
                  for (y = ul.y; y <= lr.y; y++) {
                      newCoords.push(this.pointToSgfCoord({x:x,y:y}));
                  }
               }
               hits.push(i);
           }
      }
      coords = coords.concat(newCoords);
      return coords;
   }

   /**
    * Refresh the current node (and wait until progressive loading is
    * finished before doing so)
   **/
   refresh(noRender) {
       if (this.progressiveLoads > 0) {
           var me = this;
           setTimeout(function() { me.refresh.call(me); }, 10);
           return;
       }
       this.board.revert(1);
       this.execNode(noRender);
   }

   /**
    * Delegates the work of putting down stones etc to various handler
    * functions. Also resets some settings and makes sure the interface
    * gets updated.
    * @param {Boolean} noRender If true, don't render the board
    * @param {Boolean} ignoreProgressive Ignores progressive loading
    *      considerations.
    */
   execNode(noRender, ignoreProgressive) {
       // don't execute a node while it's being loaded
       if (!ignoreProgressive && this.progressiveLoads > 0) {
           var me = this;
           setTimeout(function() { me.execNode.call(me, noRender); }, 10);
           return;
       }

       if (!this.cursor.node) return;

       if (!noRender) {
           this.dom.comments.innerHTML = "";
           this.board.clearMarkers();
           this.moveNumber = this.cursor.getMoveNumber();
       }

       if (this.moveNumber < 1) {
           this.resetCurrentColor();
       }

       // execute handlers for the appropriate properties
       var props = this.cursor.node.getProperties();
       for (var propName in props) {
           if (this.propertyHandlers[propName]) {
               (this.propertyHandlers[propName]).apply(
                   this,
                   [this.cursor.node[propName], propName, noRender]
               );
           }
       }

       if (noRender) {
           this.board.commit();
       } else {
           // let the opponent move
           if (this.opponentUrl && this.opponentColor == this.currentColor
               && this.moveNumber == this.totalMoves) {
               this.fetchOpponentMove();
           }
           this.findVariations();
           this.updateControls();
           this.board.commit();
           this.board.render();
       }

       // progressive loading?
       if (!ignoreProgressive && this.progressiveUrl)
           this.fetchProgressiveData();

       // play a reponse in problem-solving mode, unless we just navigated backwards
       if (this.problemMode && this.currentColor && this.currentColor != this.problemColor && !this.goingBack)
           this.playProblemResponse(noRender);

       this.goingBack = false;
   }

   /**
    * Respond to a move made in problem-solving mode
   **/
   playProblemResponse(noRender) {
       // short delay before playing
       setTimeout(function() {
           this.variation(null, noRender);
           if (this.hooks.playProblemResponse) {
               this.hook("playProblemResponse");
           } else if (!this.cursor.hasNext()) {
               // not sure if it's safe to say "WRONG" -- that would work for
               // goproblems.com SGFs but I don't know about others
               this.prependComment(t['end of variation']);
           }
       }.bind(this), 200);
   }

   fetchProgressiveData(completeFn) {
       var loadNode = this.cursor.node || null;
       if (loadNode && loadNode._cached) return;
       if (this.progressiveMode == "pattern") {
           if (loadNode && !loadNode._parent._parent) return; // special case
           this.fetchProgressiveContinuations(completeFn);
       } else {
           var loadId = (loadNode && loadNode._id) || 0;
           this.nowLoading();
           this.progressiveLoads++;
           // Show pro game search after second move
           var completeFnWrap = function() {
               var moveNum = this.cursor.getMoveNumber();
               if (moveNum > 1)
                   this.cursor.node.C = "<a id='cont-search' href='#'>" +
                       t['show games'] + "</a>" + (this.cursor.node.C || "");
               this.refresh();
               if (completeFn && typeof completeFn == "function")
                   completeFn();
               addEvent(byId("cont-search"), "click", function(e) {
                   var size = 8;
                   var region = this.board.getRegion(0, 19 - size, size, size);
                   var pattern = this.convertRegionPattern(region);
                   this.loadSearch("ne", size + "x" + size, this.compressPattern(pattern));
                   stopEvent(e);
               }.bind(this));
           }.bind(this);
           var url = this.progressiveUrl + "?" +
               eidogo.util.makeQueryString({id: loadId, pid: this.uniq});
           this.remoteLoad(url, loadNode, false, null, completeFnWrap);
       }
   }

   /**
    * Update all our UI elements to reflect the current game state
   **/
   updateControls() {
       // move number
       this.dom.moveNumber.innerHTML = (this.moveNumber ?
           (t['move'] + " " + this.moveNumber) :
           (this.permalinkable ? "permalink" : ""));

       // captures
       this.dom.whiteCaptures.innerHTML = t['captures'] +
           ": <span>" + this.board.captures.W + "</span>";
       this.dom.blackCaptures.innerHTML = t['captures'] +
           ": <span>" + this.board.captures.B + "</span>";

       // time
       this.dom.whiteTime.innerHTML = t['time left'] + ": <span>" +
           (this.timeW ? this.timeW : "--") + "</span>";
       this.dom.blackTime.innerHTML = t['time left'] + ": <span>" +
           (this.timeB ? this.timeB : "--") + "</span>";

       removeClass(this.dom.controlPass, "pass-on");

       // variations?
       this.dom.variations.innerHTML = "";
       for (var i = 0; i < this.variations.length; i++) {
           var varLabel = i + 1;
           var overlapped = false;
           if (!this.variations[i].move || this.variations[i].move == "tt") {
               // 'pass' variation
               addClass(this.dom.controlPass, "pass-on");
           } else if (this.prefs.markNext || this.variations.length > 1) {
               // show clickable variation on the board
               var varPt = this.sgfCoordToPoint(this.variations[i].move);
               if (this.board.getMarker(varPt) != this.board.EMPTY) {
                   var marker = this.board.getMarker(varPt);
                   if (marker.indexOf("var:") !== 0) {
                       varLabel = marker;
                   } else {
                       // More than one variation on the same point
                       overlapped = true;
                   }
               }
               if (this.prefs.markVariations && !overlapped) {
                   this.board.addMarker(varPt, "var:" + varLabel);
               }
           }
           // show variation under controls
           var varNav = document.createElement("div");
           varNav.className = "variation-nav";
           varNav.innerHTML = varLabel;
           addEvent(
               varNav,
               "click",
               function(e, arg) { arg.me.variation(arg.varNum); },
               {me: this, varNum: this.variations[i].varNum}
           );
           this.dom.variations.appendChild(varNav);
       }
       if (this.variations.length < 2) {
           this.dom.variations.innerHTML = "<div class='variation-nav none'>" +
               t['no variations'] + "</div>";
       }

       // nav buttons
       if (this.cursor.hasNext()) {
           addClass(this.dom.controlForward, "forward-on");
           addClass(this.dom.controlLast, "last-on");
       } else {
           removeClass(this.dom.controlForward, "forward-on");
           removeClass(this.dom.controlLast, "last-on");
       }
       if (this.cursor.hasPrevious()) {
           addClass(this.dom.controlBack, "back-on");
           addClass(this.dom.controlFirst, "first-on");
       } else {
           removeClass(this.dom.controlBack, "back-on");
           removeClass(this.dom.controlFirst, "first-on");
           var info = "";
           if (!this.prefs.showPlayerInfo)
               info += this.getGameDescription(true);
           if (!this.prefs.showGameInfo)
               info += this.dom.infoGame.innerHTML;
           if (info.length && this.theme != "problem")
               this.prependComment(info, "comment-info");
       }

       // nav slider & nav tree
       if (!this.progressiveLoad)
           this.updateNavSlider();
       if (this.prefs.showNavTree)
           this.updateNavTree();

       // multiple games per sgf
       var node = this.cursor.node, pos, html, js;
       if (node._parent && !node._parent._parent && node._parent._children.length > 1) {
           pos = node.getPosition();
           html = t['multi-game sgf'];
           js = "javascript:eidogo.delegate(" + this.uniq + ", \"goTo\", [";
           if (pos)
               html += "<a href='" + js + (pos - 1) + ",0])'>" + t['previous game'] + "</a>";
           if (node._parent._children[pos + 1])
               html += (pos ? " | " : "") +
                       "<a href='" + js + (pos + 1) + ",0])'>" + t['next game'] + "</a>";
           this.prependComment(html, "comment-info");
       }
   }

   getVariations() {
       var vars = [],
           kids = this.cursor.node._children;
       for (var i = 0; i < kids.length; i++) {
           vars.push({move: kids[i].getMove(), varNum: i});
       }
       return vars;
   }

   /**
    * Locates any variations within the current node and makes note of their
    * move and index position
    */
   findVariations() {
       this.variations = this.getVariations();
   }

   /**
    * Fetches a move from an external opponent -- e.g., GnuGo. Provides
    * serialized game data as SGF, the color to move as, and the size of
    * the board. Expects the response to be the SGF coordinate of the
    * move to play.
   **/
   fetchOpponentMove() {
       this.nowLoading(t['gnugo thinking']);
       var success = function(req) {
           this.doneLoading();
           this.createMove(req.responseText);
       }
       var failure = function(req) {
           this.croak(t['error retrieving']);
       }
       var root = this.cursor.getGameRoot();
       var params = {
           sgf: root.toSgf(),
           move: this.currentColor,
           size: root.SZ,
           level: this.opponentLevel
       };
       ajax('post', this.opponentUrl, params, success, failure, this, 45000);
   }

   /**
    * Resets the current color as appropriate
   **/
   resetCurrentColor() {
       this.currentColor = (this.problemMode ? this.problemColor : "B");
       var root = this.cursor.getGameRoot();
       if (root && root.HA > 1)
           this.currentColor = 'W';
   }

   addStone(coord, color) {
       if (!(coord instanceof Array)) {
           coord = [coord];
       }
       coord = this.expandCompressedPoints(coord);
       for (var i = 0; i < coord.length; i++) {
           this.board.addStone(
               this.sgfCoordToPoint(coord[i]),
               color == "AW" ? this.board.WHITE :
               color == "AB" ? this.board.BLACK : this.board.EMPTY
           );
       }
   }

   addMarker(coord, type) {
       if (!(coord instanceof Array)) {
           coord = [coord];
       }
       coord = this.expandCompressedPoints(coord);
       var label;
       for (var i = 0; i < coord.length; i++) {
           switch (type) {
               case "TR": label = "triangle"; break;
               case "SQ": label = "square"; break;
               case "CR": label = "circle"; break;
               case "MA": label = "ex"; break;
               case "TW": label = "territory-white"; break;
               case "TB": label = "territory-black"; break;
               case "DD": label = "dim"; break;
               case "LB": label = (coord[i].split(":"))[1]; break;
               default: label = type; break;
           }
           this.board.addMarker(
               this.sgfCoordToPoint((coord[i].split(":"))[0]),
               label
           );
       }
   }

   showTime(value, type) {
       var tp = (type == "BL" || type == "OB" ? "timeB" : "timeW");
       if (type == "BL" || type == "WL") {
           var mins = Math.floor(value / 60);
           var secs = (value % 60).toFixed(0);
           secs = (secs < 10 ? "0" : "") + secs;
           this[tp] = mins + ":" + secs;
       } else {
           this[tp] += " (" + value + ")";
       }
   }

   /**
    * Good move, bad move, etc
   **/
   showAnnotation(value, type) {
       var msg;
       switch (type) {
           case 'N':  msg = value; break;
           case 'GB': msg = (value > 1 ? t['vgb'] : t['gb']); break;
           case 'GW': msg = (value > 1 ? t['vgw'] : t['gw']); break;
           case 'DM': msg = (value > 1 ? t['dmj'] : t['dm']); break;
           case 'UC': msg = t['uc']; break;
           case 'TE': msg = t['te']; break;
           case 'BM': msg = (value > 1 ? t['vbm'] : t['bm']); break;
           case 'DO': msg = t['do']; break;
           case 'IT': msg = t['it']; break;
           case 'HO': msg = t['ho']; break;
       }
       this.prependComment(msg);
   }

   showComments(comments, junk, noRender) {
       if (!comments || noRender) return;
       this.dom.comments.innerHTML += comments.replace(/^(\n|\r|\t|\s)+/, "").replace(/\n/g, "<br />");
   }

   /**
    * For special notices
   **/
   prependComment(content, cls) {
       cls = cls || "comment-status";
       this.dom.comments.innerHTML = "<div class='" + cls + "'>" +
           content + "</div>" + this.dom.comments.innerHTML;
   }

   setColor(color) {
       this.prependComment(color == "B" ? t['black to play'] :
           t['white to play']);
       this.currentColor = this.problemColor = color;
   }

   setMoveNumber(num) {
        this.moveNumber = num;
    }

   /**
    * Play a move on the board and apply rules to it. This is different from
    * merely adding a stone.
   **/
   playMove(coord, color, noRender) {
       color = color || this.currentColor;
       this.currentColor = (color == "B" ? "W" : "B");
       color = color == "W" ? this.board.WHITE : this.board.BLACK;
       var pt = this.sgfCoordToPoint(coord);
       if ((!coord || coord == "tt" || coord == "") && !noRender) {
           this.prependComment((color == this.board.WHITE ?
               t['white'] : t['black']) + " " + t['passed'], "comment-pass");
       } else if (coord == "resign") {
           this.prependComment((color == this.board.WHITE ?
               t['white'] : t['black']) + " " + t['resigned'], "comment-resign");
       } else if (coord && coord != "tt") {
           this.board.addStone(pt, color);
           this.rules.apply(pt, color);
           if (this.prefs.markCurrent && !noRender) {
               this.addMarker(coord, "current");
           }
       }
   }

   /**
    * Resets the game cursor to the first node
   **/
   resetCursor(noRender, toGameRoot) {
       this.board.reset();
       this.resetCurrentColor();
       if (toGameRoot) {
           this.cursor.node = this.cursor.getGameRoot();
       } else {
           this.cursor.node = this.collectionRoot;
       }
       this.refresh(noRender);
   }

   reset() {
      this.collectionRoot = new GameNode();
      this.cursor = new GameCursor();

      // these are populated after load
      this.board = null;
      this.rules = null;
      this.currentColor = null;
      this.moveNumber = null;
      this.totalMoves = null;
      this.variations = null;
      this.timeB = "";
      this.timeW = "";
   }


 }

 export default Player;
