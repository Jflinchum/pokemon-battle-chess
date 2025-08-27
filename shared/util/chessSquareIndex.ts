import { Square } from "chess.js";

export const getSquareIndexIn1DArray = (square: Square) => {
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1]);
  return col + row * 8;
};
