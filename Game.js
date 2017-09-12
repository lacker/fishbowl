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

    return true;
  }

  // card is a string
  // this returns true or false for whether this is a valid move
  play(card) {
    // TODO: implement ritual, petal, contract, tendrils
  }
}
