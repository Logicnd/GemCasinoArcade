import { randomInt } from './rng-service';

export type Card = number; // 1-13 where 1 = Ace, 11 = J, 12 = Q, 13 = K

export interface BlackjackState {
  deck: Card[];
  player: Card[];
  dealer: Card[];
  status: 'ACTIVE' | 'PLAYER_BUST' | 'DEALER_BUST' | 'PLAYER_WIN' | 'DEALER_WIN' | 'PUSH' | 'BLACKJACK';
}

function cardValue(card: Card) {
  if (card === 1) return 11; // Ace high by default
  if (card >= 10) return 10;
  return card;
}

export function handValue(hand: Card[]) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c === 1) {
      aces += 1;
      total += 11;
    } else {
      total += cardValue(c);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function createDeck() {
  const deck: Card[] = [];
  for (let i = 0; i < 4; i++) {
    for (let v = 1; v <= 13; v++) deck.push(v as Card);
  }
  return deck;
}

export function shuffle(deck: Card[]) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function draw(deck: Card[]) {
  const card = deck.pop();
  if (card === undefined) throw new Error('Deck exhausted');
  return card;
}

export function startBlackjack(): BlackjackState {
  const deck = shuffle(createDeck());
  const player = [draw(deck), draw(deck)];
  const dealer = [draw(deck), draw(deck)];
  const playerVal = handValue(player).total;
  const dealerVal = handValue(dealer).total;
  const status = playerVal === 21 ? 'BLACKJACK' : 'ACTIVE';
  return { deck, player, dealer, status };
}

export function hit(state: BlackjackState, target: 'player' | 'dealer') {
  const card = draw(state.deck);
  state[target].push(card);
  const { total } = handValue(state[target]);
  if (target === 'player' && total > 21) state.status = 'PLAYER_BUST';
  if (target === 'dealer' && total > 21) state.status = 'DEALER_BUST';
  return state;
}

export function stand(state: BlackjackState) {
  // Dealer plays to 17 (soft 17 stands)
  let dealerVal = handValue(state.dealer);
  while (dealerVal.total < 17) {
    hit(state, 'dealer');
    dealerVal = handValue(state.dealer);
  }
  const playerTotal = handValue(state.player).total;
  const dealerTotal = dealerVal.total;
  if (dealerTotal > 21) state.status = 'DEALER_BUST';
  else if (playerTotal > dealerTotal) state.status = 'PLAYER_WIN';
  else if (playerTotal < dealerTotal) state.status = 'DEALER_WIN';
  else state.status = 'PUSH';
  return state;
}

export function settle(state: BlackjackState, bet: number) {
  const playerVal = handValue(state.player).total;
  const dealerVal = handValue(state.dealer).total;

  if (state.status === 'BLACKJACK') return Math.floor(bet * 2.5);
  if (state.status === 'PLAYER_BUST') return 0;
  if (state.status === 'DEALER_BUST') return bet * 2;
  if (state.status === 'PLAYER_WIN') return bet * 2;
  if (state.status === 'DEALER_WIN') return 0;
  if (state.status === 'PUSH') return bet;

  // If not settled, fall back to comparing
  if (playerVal > 21) return 0;
  if (dealerVal > 21) return bet * 2;
  if (playerVal > dealerVal) return bet * 2;
  if (playerVal < dealerVal) return 0;
  return bet;
}
