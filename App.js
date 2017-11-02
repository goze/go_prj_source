import React, { Component } from 'react';
import { View } from 'react-native';

import Baduk from './baduk';

export default class SvgExample extends Component {
  render() {
    var cfg = {};
    cfg.sgf ="(;GM[1]FF[4]CA[UTF-8]AP[CGoban:3]ST[2]" +
    "RU[Japanese]SZ[19]KM[0.00]" +
    "PW[White]PB[Black]AW[ed][hd][eg][hg]AB[fe][ge][ff][gf]" +
    ";B[eg]" +
    "(;W[ab]" +
    ";B[ba]" +
    ";W[bb]CR[eg][eh][ei]LB[ca:B][da:A][ef:1][ff:2][gf:3]TR[hd][id][jd][je]SQ[cd][dd][ed]C[what to do?]" +
    "(;B[da]C[jump!]" +
    "(;W[ca]TR[da]C[marked stone is stupid])" +
    "(;W[cb]" +
    ";B[ea]" +
    ";W[ca]))" +
    ";W[cb]" +
    "(;B[ca]C[run!]" +
    ";B[ea]" +
    ";W[da])" +
    "(;B[]C[give up!]" +
    ";W[ca]))" +
    "(;AE[ed][hd][fe][ge][ff][gf][eg][hg]))";

    console.log("sgf is created!")
    return (
      <Baduk size={19} cfg={cfg}/>
    );
  }
}
