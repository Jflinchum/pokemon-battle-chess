import { Move, Square } from "chess.js";

export const getSquareIndexIn1DArray = (square: Square) => {
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1]);
  return col + row * 8;
};

export const getCaptureSquare = (move: Move) => {
  let capturedPieceSquare: Square;
  if (move.isEnPassant()) {
    capturedPieceSquare =
      `${move.to[0] + (parseInt(move.to[1]) + (move.color === "w" ? -1 : 1))}` as Square;
  } else {
    capturedPieceSquare = move.to;
  }

  return capturedPieceSquare;
};
