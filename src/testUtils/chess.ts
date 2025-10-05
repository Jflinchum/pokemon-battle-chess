import { Color, PieceSymbol, Square } from "chess.js";
import { PokemonChessBoardSquare } from "../types/chess/PokemonChessBoardSquare";
import { getMockPokemonSet } from "./pokemon";

export const getAllChessBoardSquares = (
  excludeSquare: Square[] = [],
): Square[] => {
  const squareArray: Square[] = [];

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

export const createMockPokemonChessBoardSquare = (
  square: Square,
  piece?: { type: PieceSymbol; color: Color },
): PokemonChessBoardSquare => ({
  square,
  ...(piece
    ? {
        type: piece.type,
        color: piece.color,
        pokemon: getMockPokemonSet(),
      }
    : {}),
});

export const createEmptyBoard = (): PokemonChessBoardSquare[][] => {
  const oneDimensionChessBoard = getAllChessBoardSquares().map((sq) =>
    createMockPokemonChessBoardSquare(sq),
  );
  const twoDimensionalChessBoard: PokemonChessBoardSquare[][] = [];

  for (let i = 0; i < oneDimensionChessBoard.length; i += 8) {
    twoDimensionalChessBoard.push(oneDimensionChessBoard.slice(i, i + 8));
  }

  return twoDimensionalChessBoard.reverse();
};
