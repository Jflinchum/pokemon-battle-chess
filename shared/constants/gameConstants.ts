/**
 * The distance probabilities of generating weather/terrain on the chess board. Based on the very center of the board.
 */
export const SQUARE_MOD_X_DISTANCE_PROBABILITIES = [
  { value: 0.5, weight: 0.4 },
  { value: 1.5, weight: 0.3 },
  { value: 2.5, weight: 0.2 },
  { value: 3.5, weight: 0.1 },
];
export const SQUARE_MOD_Y_DISTANCE_PROBABILITY = [
  { value: 0.5, weight: 0.6 },
  { value: 1.5, weight: 0.4 },
];

/**
 * Square modifier target is the weather/terrain that generates on the chess board.
 * We start off with an initial Target value that we default to, and then generate a new one
 * throughout the game between the low and high target.
 */
export const SQUARE_MODIFIER_TARGET = 10;
export const LOW_SQUARE_MODIFIER_TARGET = 5;
export const HIGH_SQUARE_MODIFIER_TARGET = 15;

export const LOW_SQUARE_MODIFIER_DURATION = 2;
export const HIGH_SQUARE_MODIFIER_DURATION = 5;

export const CHESS_MOVES_UNTIL_NEW_SQUARE_MODIFIER_TARGET = 10;
