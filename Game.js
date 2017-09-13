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
    this.log();
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

      console.log('We fizzled.');
      return false;
    }

    console.log('We won.');
    return true;
  }
}

let game = new Game({
  'petal': 15,
  'ritual': 20,
  'contract': 15,
  'tendrils': 10,
});
game.autoplay();
