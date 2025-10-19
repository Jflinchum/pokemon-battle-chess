import { Color, PieceSymbol, Square } from "chess.js";
import { ChessData } from "../../shared/types/Game";
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

export const createMockChessMove = (
  color: Color,
  san: string,
  failed?: boolean,
): ChessData => ({
  type: "chess",
  data: {
    color,
    san,
    failed,
  },
});

export const createMockPokemonPieces = (
  pieces?: { type: PieceSymbol; color: Color }[],
) => {
  const defaultPieces = [
    { type: "p" as PieceSymbol, color: "w" as Color },
    { type: "b" as PieceSymbol, color: "w" as Color },
  ];

  const mockPieces = pieces || defaultPieces;
  return mockPieces.map((piece, index) => ({
    type: piece.type,
    color: piece.color,
    pkmn: getMockPokemonSet(),
    index,
    square: null,
  }));
};
