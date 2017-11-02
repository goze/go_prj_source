import React, { Component } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { Constants } from 'expo';

import Sgf from './sgf';
import GameNode from './gamenode';
import GameCursor from './gamecursor';


//  import Baduk from './baduk';

export default class SvgExample extends Component {
  constructor(props) {
      super(props);
      this.sgfParser= new Sgf("(;GM[1]FF[4]CA[UTF-8]AP[CGoban:3]ST[2]" +
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
      "(;AE[ed][hd][fe][ge][ff][gf][eg][hg]))");
      this.gameTree= new GameNode();
      this.gameTree.loadJson(this.sgfParser.root);

      this.gameCursor = new GameCursor(this.gameTree);

      //this.gameCursor.node.
    //  this.gameCursor =  new GameCursor(this.gameTree);
    //  this.moves = this.gameTree._children[0].getProperties();
  }

  _nextButtonPress = () => {
    _gameCursor = null;
    if (this.gameCursor.node._children[0] != null) {
      _gameCursor = new GameCursor(this.gameCursor.node._children[0]);
      if (_gameCursor.getNextColor() != null) {
        this.gameCursor = _gameCursor;
        {console.log(this.gameCursor.getNextMoves())}
        {console.log(this.gameCursor.getNextColor())}
        Alert.alert(
          'nextMove:',
          'done!',
        );
      }
    }

    if (_gameCursor == null) {
     Alert.alert(
       'no more move:',
       'done!',
     );
   }

  };

  _prevButtonPress = () => {
    _gameCursor = null;
    if (this.gameCursor.node._parent != null ) {
      _gameCursor = new GameCursor(this.gameCursor.node._parent);
      if (_gameCursor.getNextColor() != null) {
        this.gameCursor = _gameCursor;
        {console.log(this.gameCursor.getNextMoves())}
        {console.log(this.gameCursor.getNextColor())}
        Alert.alert(
          'prevMove:' ,
          'done!',
        );
      } else {
        _gameCursor = null;
      }
    }

     if (_gameCursor == null) {
      Alert.alert(
        'no more move:',
        'done!',
      );
    }
  };

  render() {
    /*
    {console.log(this.gameCursor.getNextMoves())}
    {console.log(this.gameCursor.getNextColor())}

    this.gameCursor = new GameCursor(this.gameCursor.node._children[0]);
    {console.log(this.gameCursor.getNextMoves())}
    {console.log(this.gameCursor.getNextColor())}

    this.gameCursor = new GameCursor(this.gameCursor.node._children[0]);
    {console.log(this.gameCursor.getNextMoves())}
    {console.log(this.gameCursor.getNextColor())}

    this.gameCursor = new GameCursor(this.gameCursor.node._children[0]);
    {console.log(this.gameCursor.getNextMoves())}
    {console.log(this.gameCursor.getNextColor())}

    this.gameCursor = new GameCursor(this.gameCursor.node._children[0]);
    {console.log(this.gameCursor.getNextMoves())}
    {console.log(this.gameCursor.getNextColor())}
    */
    /*
    <Button
      title="<"
      onPress={this._prevButtonPress}
    />
    <Button
      title=">"
      onPress={this._nextButtonPress}
    />
    */
    return (
      <View style={styles.wrapper}>
      <View >
          <Text style={styles.paragraph}>
            Change code in the editor and watch it change on your phone!
            Save to get a shareable url.
          </Text>

      </View>
        <View style={styles.container}>
            <View>
              <Button
                title="<"
                onPress={this._prevButtonPress}
              />
            </View>
            <View>
              <Button
                title=">"
                onPress={this._nextButtonPress}
              />
            </View>
        </View>
      </View>
    );
  }

  forward(e, obj, noRender) {
      this.variation(null, noRender);
  }

  variation(varNum, noRender) {
    if (this.cursor.next(varNum)) {
        this.execNode(noRender);
        this.resetLastLabels();
        // Should we continue after loading finishes or just stop
        // like we do here?
        if (this.progressiveLoads > 0) return false;
        return true;
    }
    return false;
}

}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center', //replace with flex-end or center
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  container2: {
    flex: .5,
    flexDirection: 'row',
    alignItems: 'flex-start' //replace with flex-end or center
  },
  box: {
    width: 100,
    height: 100
  },
  box1: {
    backgroundColor: '#2196F3'
  },
  box2: {
    backgroundColor: '#8BC34A'
  },
  box3: {
    backgroundColor: '#e3aa1a'
  },
  paragraph: {
  margin: 24,
  fontSize: 18,
  fontWeight: 'bold',
  textAlign: 'center',
  color: '#34495e',
  },
});

/*
{console.log("GameTree:")}
{console.log(this.gameTree)}
{console.log("GameCursor:")}
{console.log(this.gameCursor)}
{console.log("Moves:")}
{console.log(this.moves)}
*/
