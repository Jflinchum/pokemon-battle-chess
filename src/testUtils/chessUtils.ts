import { Square } from "chess.js";

export const getAllChessBoardSquares = (excludeSquare: Square[] = []) => {
  const squareArray = [];

  for (let i = 1; i <= 8; i++) {
    for (let j = 0; j <= 7; j++) {
      const square = `${String.fromCharCode(97 + j)}${i}` as Square;
      if (!excludeSquare.includes(square)) {
        squareArray.push(square);
      }
    }
  }

  return squareArray;
};
