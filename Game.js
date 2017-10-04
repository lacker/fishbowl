#!/usr/bin/env node

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    // Swap i with a random thing in [0, i]
    let j = Math.floor(Math.random() * (i + 1));
    let tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
}

class Game {
  // deck is a map from string to count
  // this starts a new game
  constructor(deck) {
    // this.deck is the actual shuffled deck
    // this.deck[this.deck.length - 1] is the top card
    this.deck = [];
    for (let card in deck) {
      let count = deck[card];
      for (let i = 0; i < count; i++) {
        this.deck.push(card);
      }
    }

    shuffle(this.deck);

    this.ourLife = 20;
    this.theirLife = 20;
    this.mana = 0;
    this.stormCount = 0;
    this.hand = [];
    this.verbose = true;
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  // Returns whether we could or not
  draw(number) {
    if (number === undefined) {
      number = 1;
    }
    for (let i = 0; i < number; i++) {
      if (this.deck.length === 0) {
        return false;
      }
      this.hand.push(this.deck.pop());
    }
    this.hand.sort();

    return true;
  }

  // card is a string
  // this returns true or false for whether this is a valid move
  // this does not remove the card from the hand
  // it does check for casting cost though
  enactEffect(card) {
    switch (card) {
      case 'mulligan':
        if (this.stormCount > 0) {
          return false;
        }
        let numCards = this.hand.length - 1;
        if (numCards < 0) {
          return false;
        }
        while (this.hand.length > 0) {
          this.deck.push(this.hand.pop());
        }
        shuffle(this.deck);
        this.draw(numCards);
        // TODO: scrying
        return true;

      case 'ritual':
        if (this.mana < 1) {
          return false;
        }
        this.mana += 2;
        this.stormCount += 1;
        return true;

      case 'petal':
        this.mana += 1;
        this.stormCount += 1;
        return true;

      case 'contract':
        if (this.ourLife < 2) {
          // Refuse to kill ourselves
          return false;
        }
        if (this.deck.length < 4) {
          // Refuse to deck ourselves
          return false;
        }
        if (this.mana < 3) {
          return false;
        }
        this.mana -= 3;
        this.ourLife = Math.floor(this.ourLife / 2);
        this.draw(4);
        this.stormCount += 1;
        return true;

      case 'tendrils':
        if (this.mana < 4) {
          return false;
        }
        this.mana -= 4;
        let replication = this.stormCount + 1;
        this.ourLife += 2 * replication;
        this.theirLife -= 2 * replication;
        this.stormCount += 1;
        return true;

      default:
        console.log('unimplemented card: ' + card);
        return false;
    }
  }

  // Returns whether we are holding one of the provided card
  holding(card) {
    return this.hand.indexOf(card) >= 0;
  }

  // this plays a card, including removing it from the hand
  // returns true or false for whether it was possible
  play(card) {
    let index = this.hand.indexOf(card);
    if (card !== 'mulligan' && index < 0) {
      return false;
    }
    if (!this.enactEffect(card)) {
      return false;
    }

    // Remove from the hand
    this.hand.splice(index, 1);
    this.log('played ' + card);
    // this.logInfo();
    return true;
  }

  logInfo() {
    this.log('life: ' + this.ourLife + ' - ' + this.theirLife);
    this.log(this.mana + ' mana, ' + this.stormCount + ' storm count');
    this.log('hand: ' + this.hand.join(','));
  }

  shouldMulligan() {
    if (this.hand.length === 0) {
      // We can't
      return false;
    }
    if (!this.holding('contract')) {
      // No way to get more cards
      return true;
    }
    if (!this.holding('petal')) {
      // No way to get initial mana
      return true;
    }

    let mana = 0;
    for (let card of this.hand) {
      if (card === 'petal') {
        mana += 1;
      } else if (card === 'ritual') {
        mana += 2;
      }
    }
    if (mana < 3) {
      // No way to get enough mana to contract
      return true;
    }

    // I guess just keep it
    return false;
  }

  // Simulates on-the-play
  // Returns whether we win the game
  autoplay() {
    this.draw(7);
    while (this.shouldMulligan()) {
      this.play('mulligan');
    }
    this.log('initial hand: ' + this.hand.join(','));
    while (this.theirLife > 0) {
      if (this.play('petal')) {
        continue;
      }
      if (this.play('ritual')) {
        continue;
      }
      if (this.stormCount >= 9 && this.play('tendrils')) {
        continue;
      }
      if (this.play('contract')) {
        continue;
      }
      if (this.play('tendrils')) {
        continue;
      }

      this.logInfo();
      this.log('We fizzled.');
      return false;
    }

    this.logInfo();
    this.log('We won.');
    return true;
  }
}

class Tester {
  constructor(config) {
    this.config = config;
    this.wins = 0;
    this.n = 0;
    this.emptyHand = 0;
    this.deadStart = 0;
    this.lowMana = 0;
    this.lowOnLife = 0;
    this.other = 0;
    this.verbose = true;
  }

  runOne() {
    let game = new Game(this.config);
    game.verbose = false;
    if (game.autoplay()) {
      this.wins += 1;
    } else {
      // Count why we lose
      if (game.hand.length === 0) {
        this.emptyHand += 1;
      } else if (game.stormCount === 0) {
        this.deadStart += 1;
      } else if (game.mana < 3) {
        this.lowMana += 1;
      } else if (game.ourLife === 1) {
        this.lowOnLife += 1;
      } else {
        // This seems to be stuck on 3 mana with only tendrils
        this.other += 1;
      }
    }
    this.n += 1;
  }

  // The win rate
  winRate() {
    return this.wins / this.n;
  }

  // The std deviation of the win rate
  stdDev() {
    if (this.n < 5) {
      // Don't believe the model
      return 1.0;
    }
    let p = this.winRate();
    return Math.sqrt(p * (1 - p) / this.n);
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  logInfo() {
    let p = this.winRate();
    let stdDev = this.stdDev();
    this.log(this.config);
    this.log('wins: ' + this.wins + ' / ' + this.n);
    this.log('p = ' + p);
    this.log('std dev: ' + stdDev);
    this.log('winning it: ' + (this.wins / this.n));
    this.log('empty hand: ' + (this.emptyHand / this.n));
    this.log('dead start: ' + (this.deadStart / this.n));
    this.log('lacks mana: ' + (this.lowMana / this.n));
    this.log('lacks life: ' + (this.lowOnLife / this.n));
    this.log('dunno what: ' + (this.other / this.n));
  }

  // Calculates a win rate.
  // radius is the radius of the confidence interval of 2 std devs.
  // std dev = root ( p * (1-p) / n )
  calculate(radius) {
    while (true) {
      this.runOne();

      let p = this.winRate();
      let stdDev = this.stdDev();
      if (stdDev > 0 && stdDev * 2 < radius) {
        this.logInfo();
        return p;
      }
    }
  }
}

// Returns -1 if config1 is better, 1 if config2 is
function compare(config1, config2) {
  let tester1 = new Tester(config1);
  let tester2 = new Tester(config2);
  while (true) {
    tester1.runOne();
    tester2.runOne();
    let s = tester1.stdDev() + tester2.stdDev();
    let diff = tester1.winRate() - tester2.winRate();
    if (Math.abs(diff) > 4 * s) {
      tester1.logInfo();
      tester2.logInfo();
      if (tester1.winRate() > tester2.winRate()) {
        console.log('winner: ' + JSON.stringify(config1));
        return -1;
      } else {
        console.log('winner: ' + JSON.stringify(config2));
        return 1;
      }
    }
    if (tester1.n % 100000 === 0) {
      console.log('****************** partway report:');
      console.log('old config:');
      tester1.logInfo();
      console.log('new config:');
      tester2.logInfo();
    }
  }
}

function mutate(map) {
  let keys = [];
  for (let key in map) {
    keys.push(key);
  }
  shuffle(keys);
  let key1 = keys[0];
  let key2 = keys[1];

  let answer = JSON.parse(JSON.stringify(map));
  answer[key1] -= 1;
  answer[key2] += 1;
  if (answer[key1] < 0) {
    // This one's invalid, try again
    return mutate(map);
  }
  return answer;
}

function evolve() {
  let config = {
    'petal': 17,
    'ritual': 21,
    'contract': 15,
    'tendrils': 7,
  };

  while (true) {
    newConfig = mutate(config);
    if (compare(config, newConfig) < 0) {
      // config is better
      console.log('keep the old config:');
    } else {
      console.log('use the new config:');
      config = newConfig;
    }
    console.log(config);
  }
}

evolve();
