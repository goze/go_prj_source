import React, { Component } from 'react';
import { Dimensions } from 'react-native';

import PropTypes from 'prop-types';
import BadukBoard from './baduk-board';
import Player from './player';
import Piece from './piece';
import { Svg } from 'expo';
const {
  Circle,
} = Svg;
class Baduk extends Component {
  constructor(props) {
      super(props);
      this.player= new Player(this.props.cfg);
      const { width, height } = Dimensions.get('window');
      const { size } = this.props;
      this.starPoints= true;
      this.komi= 6.5; // this would probably be superseded by rule variants if I add those
      this.width = width;
      this.height = height;

      this.sPad = (width / size) / 2;
      this.bWidth = width - (this.sPad*2);
  }
  componentWillMount() {
    this.setState({
      game: new BadukGame(this.props.size),
    });
  }

  getPieces() {
    const pieces = [];
    const { game } = this.state;
    if (game) {
      for (let x = 0; x < this.props.size; x++) {
        for (let y = 0; y < this.props.size; y++) {
          const color = game.board[x][y];
          if (color) {
            console.log('getPieces X: ' + x+ ' getPieces: ' + y + 'color:' + color + 'this.bWidth: ' + this.bWidth + ' this.sPad : ' + this.sPad)
            pieces.push(<Piece x={((this.bWidth / 18) * x ) + this.sPad} y={((this.bWidth / 18) * y ) +this.sPad} color={color} sPad={this.sPad} key={`p${x}-${y}`} />);
          }
        }
      }
    }
    return pieces;
  }
  playMove(x, y) {
    console.log('X2: ' + x + ' Y2: ' + y )
    this.state.game.move(x, y);
    this.forceUpdate();
  }
  render() {
    const playMove = this.playMove.bind(this);
    console.log('width: ' + this.width + ' height: ' + this.height );
    return (
        <BadukBoard size={this.props.size} player={this.player}
          onClickEmpty={playMove}  width={this.width} height={this.height}
        >
          { this.getPieces() }
        </BadukBoard>

    );
  }
}

export default Baduk;
