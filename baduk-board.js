import React, { Component } from 'react';
import _ from 'lodash';

import PropTypes from 'prop-types';
import { View } from 'react-native';

import { Svg } from 'expo';
const {
  Text,
  Rect,
  Circle,
  G,
  Line,
} = Svg;

const PIECE_RADIUS = 0.48;

class BadukBoard extends Component {
  constructor(props) {
      super(props);
      const { width, height, size } = this.props;
      this.props.player.renderer  =  this;
      this.props.player.board
  }

  getLabels() {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const numbers = _.range(1, 27);
    const xLabelSet = _.get({
      number: numbers,
      hybrid: letters,
      letter: letters,
    }, this.props.labelStyle, null);
    const yLabelSet = _.get({
      number: numbers,
      hybrid: numbers,
      letter: letters,
    }, this.props.labelStyle, null);

    const labelsFor = (labelSet, direction) => {
      if (!labelSet) return [];
      let tx; let ty; let labelClass;
      if (direction === 'x') {
        tx = i => `${this.props.size - 1 - i}`;
        ty = () => '-1';
        labelClass = 'label x-label';
      } else {
        tx = () => `${this.props.size}`;
        ty = i => `${i}`;
        labelClass = 'label y-label';
      }
      return _.range(this.props.size).map(i =>
        <Text textAnchor="middle"
          key={`ll${i}${direction}`}
           x={tx(i)} y={ty(i)}
        >
          { labelSet[i] }
        </Text>
      );
    };

    return _.concat(
      labelsFor(xLabelSet, 'x'),
      labelsFor(yLabelSet, 'y'),
    );
  }
  getStarPoint(bWidth,sPad, x, y) {
    const STAR_POINT_RADIUS = 2;
    return (<Circle cx={`${((bWidth / 18) * x) + sPad}`} cy={`${((bWidth / 18) * y) + sPad}`} r={STAR_POINT_RADIUS}
      className="star-point" key={`sp${x}-${y}`}
    /> );
  }

  render() {
    const { width, height, size } = this.props;
    console.log('width: ' + width + ' size: ' + size )
    let sPad = (width / size) / 2;
    let sWidth  = width;
    let bWidth  = width - (sPad*2);
    const PIECE_RADIUS = sPad;

    return (
        <View style={{ marginTop: 40 }}>
        <Svg width={width} height={height}>
          <Rect x="0" y="0" width={`${sWidth}`} height={`${sWidth}`} fill="rgb(221, 180, 84)"/>
          { _.range(19).map(i =>
            <Line key={`lx${i}`} x1={`${((bWidth / 18) * i) + sPad}`} x2={`${((bWidth / 18) * i) + sPad}`} y1={`${((bWidth / 18) * 0) + sPad}`} y2={`${bWidth +sPad}`}  stroke="rgba(0, 0, 0, 0.8)"  stroke-width="0.05" stroke-linecap="square"/>
          )}
          { _.range(19).map(i =>
            <Line key={`ly${i}`} x1={`${((bWidth / 18) * 0) + sPad}`} x2={`${bWidth + sPad}`} y1={`${((bWidth / 18) * i) + sPad}`} y2={`${((bWidth / 18) * i) + sPad}`}  stroke="rgba(0, 0, 0, 0.8)"  stroke-width="0.05" stroke-linecap="square"/>
          )}
          <G className="star-points" fill="black" >
              { this.getStarPoint(bWidth,sPad, 3,3) }
              { this.getStarPoint(bWidth,sPad, 3,15) }
              { this.getStarPoint(bWidth,sPad, 15,3) }
              { this.getStarPoint(bWidth,sPad, 15,15) }

              { this.getStarPoint(bWidth,sPad, 9,9) }
              { this.getStarPoint(bWidth,sPad, 9,3) }
              { this.getStarPoint(bWidth,sPad, 3,9) }
              { this.getStarPoint(bWidth,sPad, 9,15) }
              { this.getStarPoint(bWidth,sPad, 15,9) }
          </G>
          <G className="empty-piece-targets"  >
            { _.range(19*19).map((i) => (
                <Circle cx={`${((bWidth / 18) * (i % size)) + sPad}`} cy={`${((bWidth / 18) * (Math.trunc(i / size))) + sPad}`} r={PIECE_RADIUS} key={`pt${i}`}
                        className="piece-target" fill="rgb(221, 180, 84)" strokeWidth={0.2} stroke="black" opacity="0.05" onPress={ () => this.props.onClickEmpty(i % size , Math.trunc(i / size) ) }
                />
              )
            )}
          </G>

          <G className="pieces">
            { this.props.children }
          </G>

         </Svg>
        </View>
    );
  }
}
BadukBoard.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

export default BadukBoard;
