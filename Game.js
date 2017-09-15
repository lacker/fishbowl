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
    if (index < 0) {
      return false;
    }
    if (!this.enactEffect(card)) {
      return false;
    }

    // Remove from the hand
    this.hand.splice(index, 1);
    console.log('played ' + card);
    // this.log();
    return true;
  }

  log() {
    console.log('life: ' + this.ourLife + ' - ' + this.theirLife);
    console.log(this.mana + ' mana, ' + this.stormCount + ' storm count');
    console.log('hand: ' + this.hand.join(','));
  }

  // Simulates on-the-play
  // Returns whether we win the game
  autoplay() {
    this.draw(7);
    console.log('initial hand: ' + this.hand.join(','));
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

      this.log();
      console.log('We fizzled.');
      return false;
    }

    this.log();
    console.log('We won.');
    return true;
  }
}

// Calculates a win rate.
// radius is the radius of the confidence interval of 2 std devs.
// std dev = root ( p * (1-p) / n )
function winrate(config, radius) {
  let wins = 0;
  let n = 0;
  let emptyHand = 0;
  let deadStart = 0;
  let lowMana = 0;
  let lowOnLife = 1;
  let other = 0;
  while (true) {
    let game = new Game(config);
    if (game.autoplay()) {
      wins += 1;
    } else {
      // Count why we lose
      if (game.hand.length === 0) {
        emptyHand += 1;
      } else if (game.stormCount === 0) {
        deadStart += 1;
      } else if (game.mana < 3) {
        lowMana += 1;
      } else if (game.ourLife === 1) {
        lowOnLife += 1;
      } else {
        // This seems to be stuck on 3 mana with only tendrils
        other += 1;
      }
    }
    n += 1;

    let p = wins / n;
    let stdDev = Math.sqrt(p * (1 - p) / n);
    console.log('wins: ' + wins + ' / ' + n);
    console.log('p = ' + p);
    console.log('std dev: ' + stdDev);
    if (stdDev > 0 && stdDev * 2 < radius) {
      console.log(config);
      console.log('winning it: ' + (wins / n));
      console.log('empty hand: ' + (emptyHand / n));
      console.log('dead start: ' + (deadStart / n));
      console.log('lacks mana: ' + (lowMana / n));
      console.log('lacks life: ' + (lowOnLife / n));
      console.log('dunno what: ' + (other / n));
      return p;
    }
  }
}

winrate({
  'petal': 15,
  'ritual': 20,
  'contract': 20,
  'tendrils': 5,
}, 0.002);
