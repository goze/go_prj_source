import _ from 'lodash';

// this class contains all the logic of the game itself
class BadukGame {
  // stone values are null, 'black', and 'white'
  constructor(size, mode) {
    this.mode = mode || 'freeplay';
    this.size = size;
    this.moves = [];

    // rewinding has the effect of cleaning up and populating
    // the rest of the initial state
    this.rewindToStart();
  }
  isMoveLegal(x, y) {
    // we have to check the liberties of the played piece after captures, check
    // remanining stones, check occupancy, and compare the board to the history for ko
    const groupsForPlayer = this.toPlay === 'black' ? this.blackGroups : this.whiteGroups;
    if (this.board[x][y]) return false;
    if (this.toPlay === 'black' ? !this.blackStonesRemaining : !this.whiteStonesRemaining) {
      return false;
    }

    // this is not very efficient: we shouldn't need to peek the next state often
    // because we only need to reject the move when it attempts to play against ko
    let legal = true;
    this.move(x, y, false);
    if (this.positions.has(this.koString())) {
      // illegal for reasons of ko
      legal = false;
    }
    if (this.groupHasNoLiberties(groupsForPlayer[this.hashLocation(x, y)])) {
      // you cannot play into a dead shape
      legal = false;
    }
    this.rewind();
    this.moves.pop(); // flush the fake move
    return legal;
  }
  koString() {
    // gets the current state of the board as a string
    return _.flatten(this.board).map(p => _.head(String(p))).join('');
  }
  mergeGroupsWithPiece(allGroups, toMerge, x, y) {
    const hash = this.hashLocation(x, y);
    let group;
    if (toMerge.length === 0) {
      group = new Set();
    } else if (toMerge.length === 1) {
      group = toMerge[0];
    } else {
      // we actually have groups to merge
      // we will keep the first one
      const [first, ...rest] = toMerge;
      group = first;
      _.each(rest, g => {
        g.map(h => {
          allGroups[h] = group; // eslint-disable-line no-param-reassign
          group.add(h);
        });
      });
    }
    group.add(hash);
    allGroups[hash] = group; // eslint-disable-line no-param-reassign
  }
  adjacentLocations(x, y) {
    return [
      [x, y + 1],
      [x, y - 1],
      [x + 1, y],
      [x - 1, y],
    ].filter(loc => _.every(loc, i => i >= 0 && i < this.size));
  }
  hashLocation(x, y) {
    return `${x}.${y}`;
  }
  dehashLocation(hash) {
    return hash.split('.').map(_.parseInt);
  }
  pieceHasLiberties(x, y) {
    return _.some(this.adjacentLocations(x, y), ([px, py]) => !(this.board[px][py]));
  }
  groupHasNoLiberties(group) {
    // not a very efficient implementation: a better option might be to cache
    // liberties on each group; such a strategy would also complicate merging
    return !_.some(_.toArray(group), hash =>
      this.pieceHasLiberties(...this.dehashLocation(hash))
    );
  }
  move(x, y, checkLegal = true) {

    if (checkLegal && !this.isMoveLegal(x, y)) {
      throw new Error(`Illegal move attempt at ${x} ${y}`);
    }

    this.board[x][y] = this.toPlay;

    // once the piece has been played, we must merge any groups of the side that
    // played, or else create a new group for the played piece
    const adjacentPieces = this.adjacentLocations(x, y);

    const allFriendlyGroups = this.toPlay === 'black' ? this.blackGroups : this.whiteGroups;
    const allEnemyGroups = this.toPlay === 'black' ? this.whiteGroups : this.blackGroups;

    const groupsContainingPieces = (groups, pieces) => new Set(_.filter(
      pieces.map(loc => groups[this.hashLocation(...loc)]),  g => g)
    );

    const adjacentFriendlyGroups = groupsContainingPieces(allFriendlyGroups, adjacentPieces);
    // we did not really merge any groups if all we did was integrate one piece
    const joined = adjacentFriendlyGroups.size > 1 ?
      _.cloneDeep(_.toArray(adjacentFriendlyGroups)) :
      [];

    this.mergeGroupsWithPiece(allFriendlyGroups, _.toArray(adjacentFriendlyGroups), x, y);

    // then we must check for captures by seeing what groups were touched by the
    // played piece, and checking their liberties
    const adjacentEnemyGroups = groupsContainingPieces(allEnemyGroups, adjacentPieces);
    const captured = _.cloneDeep(_.toArray(adjacentEnemyGroups).filter(
      this.groupHasNoLiberties.bind(this)));
    _.each(captured, g => {
      if (this.toPlay === 'black') {
        this.capturedByBlack += g.size;
      } else {
        this.capturedByWhite += g.size;
      }
      for (const hash of g) {
        delete allEnemyGroups[hash];
        _.set(this.board, hash, null);
      }
    });

    // we log the move and cache any groups that might have been captured as a result
    const newMove = {
      joined, // we keep joined to make rewinding easier
      captured,
      location: [x, y],
    };
    if (this.moveCursor === this.moves.length) {
      // we are appending to the end of the moveset
      this.moves.push(newMove);
    } else {
      // we are overwriting or updating
      this.moves[this.moveCursor] = newMove;
    }
    this.moveCursor += 1;

    // we record the current state of the board for ko checking
    if (checkLegal) {
      this.positions.add(this.koString());
    }

    // finally we end the current color's turn
    if (this.toPlay === 'black') {
      this.toPlay = 'white';
      this.blackStonesRemaining -= 1;
    } else {
      this.toPlay = 'black';
      this.whiteStonesRemaining -= 1;
    }
  }
  pass() {
    this.moves.push({
      location: null,
    });
    this.moveCursor += 1;
  }
  rewindToStart() {
    // different behavior than rewind to start, just sets the move cursor to 0
    // and clears the internal board
    this.positions = new Set(); // used for checking ko
    this.whiteGroups = {};
    this.blackGroups = {};
    this.moveCursor = 0;
    this.capturedByWhite = 0;
    this.capturedByBlack = 0;
    this.whiteStonesRemaining = Math.trunc((this.size * this.size) / 2);
    this.blackStonesRemaining = this.size * this.size - this.whiteStonesRemaining;
    this.toPlay = 'black';
    this.board = _.range(this.size).map(() => _.range(this.size).map(() => null));
  }
  rewind(n) {
    const nRewinds = n || 1;
    if (nRewinds > this.moveCursor) {
      throw new Error('Cannot rewind past the beginning of the game');
    }
    _.times(nRewinds, () => {
      this.moveCursor -= 1;
      const move = this.moves[this.moveCursor];

      // revert the color, give a stone back
      const enemyColor = this.toPlay;
      const allEnemyGroups = enemyColor === 'black' ? this.blackGroups : this.whiteGroups;
      const allFriendlyGroups = enemyColor === 'black' ? this.whiteGroups : this.blackGroups;
      if (this.toPlay === 'white') {
        // it WAS black's turn
        this.blackStonesRemaining += 1;
        this.toPlay = 'black';
      } else {
        this.whiteStonesRemaining += 1;
        this.toPlay = 'white';
      }

      // restore any captured groups
      for (const group of move.captured) {
        for (const stone of group) {
          // put the stone back on the board
          const [x, y] = this.dehashLocation(stone);
          this.board[x][y] = enemyColor;
          allEnemyGroups[stone] = group;
        }
      }

      // unjoin any joined groups
      for (const group of move.joined) {
        for (const stone of group) {
          allFriendlyGroups[stone] = group;
        }
      }

      // remove the placed stone
      const [x, y] = move.location;
      this.board[x][y] = null;
      delete allFriendlyGroups[this.hashLocation(x, y)];
    });
  }
  fastForward(n) {
    const nFastForwards = n || 1;
    if (nFastForwards + this.moveCursor > this.moves.length) {
      throw new Error('Cannot fast forward past the present state of the game');
    }
    const that = this;
    _.times(nFastForwards, () => {
      const [x, y] = that.moves[that.currentMove].location;
      that.move(x, y, false); // in theory we are playing an already verified move
    });
  }
}

export default BadukGame;
