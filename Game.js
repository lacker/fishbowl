class Game {
  // deck is a map from string to count
  // this starts a new game
  constructor(deck) {
    // this.deck is the actual shuffled deck
    // this.deck[0] is the top card
    this.deck = [];
    for (let card in deck) {
      let count = deck[card];
      for (let i = 0; i < count; i++) {
        this.deck.push(card);
      }
    }

    // TODO: shuffle
    // TODO: set up game state
  }

  // card is a string
  // this returns true or false for whether this is a valid move
  play(card) {
    // TODO: implement ritual, petal, contract, tendrils
  }
}
