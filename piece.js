import React, { Component } from 'react';
import { Svg } from 'expo';
const {
  Circle,
} = Svg;

class Piece extends Component {
  render() {
    console.log('piece X: ' + this.props.x+ ' piece2: ' + this.props.y + 'color:' + this.props.color )
    return (
      <Circle cx={`${this.props.x}`} cy={`${this.props.y}`} r={this.props.sPad}
      className="piece" fill={`${this.props.color}`} strokeWidth={0.2} stroke="black" opacity="5"
      />
    );
  }
}

export default Piece;
