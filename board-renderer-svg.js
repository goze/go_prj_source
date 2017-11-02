import _ from 'lodash';

/**
 * @class SVG based board renderer.
 */
class BoardRendererSVG {
  constructor(boardSize, player, crop) {
    console.log("zbg:BoardRendererSVG is constructed");
    this.boardSize = boardSize || 19;
    this.player = player;
    this.pointWidth = 0;
    this.pointHeight = 0;
    this.margin = 0;
  }

  renderMarker(pt, type) {
         if (this.renderCache.markers[pt.x][pt.y]) {
             var marker = document.getElementById(this.uniq + "marker-" + pt.x + "-" + pt.y);
             if (marker) {
                 marker.parentNode.removeChild(marker);
             }
         }
         if (type == "empty" || !type) {
             this.renderCache.markers[pt.x][pt.y] = 0;
             return null;
         }
         this.renderCache.markers[pt.x][pt.y] = 1;
         if (type) {
             var text = "";
             switch (type) {
                 case "triangle":
                 case "square":
                 case "circle":
                 case "ex":
                 case "territory-white":
                 case "territory-black":
                 case "dim":
                 case "current":
                     break;
                 default:
                     if (type.indexOf("var:") == 0) {
                         text = type.substring(4);
                         type = "variation";
                     } else {
                         text = type;
                         type = "label";
                     }
                     break;
             }
             var div = document.createElement("div");
             div.id = this.uniq + "marker-" + pt.x + "-" + pt.y;
             div.className = "point marker " + type;
             try {
                 div.style.left = (pt.x * this.pointWidth + this.margin - this.scrollX) + "px";
                 div.style.top = (pt.y * this.pointHeight + this.margin - this.scrollY) + "px";
             } catch (e) {}
             div.appendChild(document.createTextNode(text));
             this.domNode.appendChild(div);
             return div;
         }
         return null;
     }

  renderStone(pt, color) {
/*
      var stone = document.getElementById(this.uniq + "stone-" + pt.x + "-" + pt.y);
      if (stone) {
          stone.parentNode.removeChild(stone);
      }
      if (color != "empty") {
          var div = document.createElement("div");
          div.id = this.uniq + "stone-" + pt.x + "-" + pt.y;
          div.className = "point stone " + color;
          try {
              div.style.left = (pt.x * this.pointWidth + this.margin - this.scrollX) + "px";
              div.style.top = (pt.y * this.pointHeight + this.margin - this.scrollY) + "px";
          } catch (e) {}
          this.domNode.appendChild(div);
          return div;
      }
*/
      return null;
  }

  crop(crop) {
      //eidogo.util.addClass(this.domContainer, "shrunk");
      //this.domGutter.style.overflow = "hidden";
      var width = crop.width * this.pointWidth + (this.margin * 2);
      var height = crop.height * this.pointHeight + (this.margin * 2);
      //this.domGutter.style.width = width + "px";
      //this.domGutter.style.height = height + "px";
      //this.player.dom.player.style.width = width + "px";
      //this.domGutter.scrollLeft = crop.left * this.pointWidth;
      //this.domGutter.scrollTop = crop.top * this.pointHeight;
  }

  getXY(e) {
      //var clickXY = eidogo.util.getElClickXY(e, this.domNode);

      var m = this.margin;
      var pw = this.pointWidth;
      var ph = this.pointHeight;

      var x = Math.round((clickXY[0] - m - (pw / 2)) / pw);
      var y = Math.round((clickXY[1] - m - (ph / 2)) / ph);

      return [x, y, clickXY[0], clickXY[1]];
  }

  clear() {
      // this.domNode.innerHTML = "";
   }

}

 export default BoardRendererSVG;
