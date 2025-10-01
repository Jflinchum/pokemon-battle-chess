import { Chess, Piece, PieceSymbol, Square } from "chess.js";
import { PokemonChessBoardSquare } from "../../../types/chess/PokemonChessBoardSquare";
import { ChessBoardSquare } from "../../../../shared/types/ChessBoardSquare";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";

export const getSquareColor = (
  rowIndex: number,
  columnIndex: number,
): "white" | "black" => {
  return rowIndex % 2
    ? columnIndex % 2
      ? "white"
      : "black"
    : columnIndex % 2
      ? "black"
      : "white";
};

export const getSquareFromIndices = (
  rowIndex: number,
  columnIndex: number,
): Square => {
  return (String.fromCharCode(97 + columnIndex) + (8 - rowIndex)) as Square;
};

export const getNumberFromSquareLetter = (letter: string): number => {
  return letter.charCodeAt(0) - 97;
};

export const getVerboseChessMove = (
  fromSquare: Square,
  toSquare: Square,
  chessManager: Chess,
  promotion?: PieceSymbol,
) => {
  return chessManager
    .moves({
      square: fromSquare,
      piece: chessManager.get(fromSquare)?.type,
      verbose: true,
      continueOnCheck: true,
    })
    .find((move) => {
      if (promotion) {
        return move.to === toSquare && move.promotion === promotion;
      }
      return move.to === toSquare;
    });
};

export const getVerboseSanChessMove = (
  sanMove: string,
  chessManager: Chess,
) => {
  return chessManager
    .moves({ verbose: true, continueOnCheck: true })
    .find((move) => move.san === sanMove);
};

export const mergeBoardAndPokemonState = (
  chessBoard: ChessBoardSquare[][],
  pokemonManager: PokemonBattleChessManager,
): PokemonChessBoardSquare[][] => {
  return chessBoard.map((boardRow, rowIndex) =>
    boardRow.map((boardColSquare, colIndex) => {
      const pokemonPiece = pokemonManager.getPokemonFromSquare(
        boardColSquare?.square,
      )!;
      const square = getSquareFromIndices(rowIndex, colIndex);
      return {
        ...(boardColSquare || {}),
        square,
        pokemon: pokemonPiece?.pkmn,
        modifiers: pokemonManager.squareModifiers.find(
          (sqMod) => sqMod.square === square,
        )?.modifiers,
      };
    }),
  );
};

export const speciesOverride = (species: string) => {
  // TODO fix - Greninja bond sprite is broken. Just get greninja for now
  if (species === "Greninja-Bond") {
    return "Greninja";
  }
  return species;
};

/**
 * Our chess library infers castling by moving the king to the square before the rook.
 * To make it easier on the user, we also support it if they move the king over the rook.
 */
export const userAttemptingCastle = (fromPiece?: Piece, toPiece?: Piece) => {
  return (
    fromPiece?.color === toPiece?.color &&
    fromPiece?.type === "k" &&
    toPiece?.type === "r"
  );
};

export const getCastlingSquareFromCornerSquares = (
  toSquare: Square,
): Square | undefined => {
  const castleMapping: Partial<Record<Square, Square>> = {
    h1: "g1",
    a1: "c1",
    h8: "g8",
    a8: "c8",
  };

  return castleMapping[toSquare];
};
