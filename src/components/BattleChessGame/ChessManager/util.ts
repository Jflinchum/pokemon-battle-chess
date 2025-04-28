import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { ChessBoardSquare, PokemonChessBoardSquare } from "./types";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";

export const getSquareColor = (rowIndex: number, columnIndex: number): 'white' | 'black' => {
  return rowIndex % 2 ? columnIndex % 2 ? 'white' : 'black' : columnIndex % 2 ? 'black' : 'white';
}

export const getSquareFromIndices = (rowIndex: number, columnIndex: number): Square => {
  return String.fromCharCode(97 + columnIndex) + (8 - rowIndex) as Square;
}

export const getCastledRookSquare = (color: Color, isKingsideCastle: boolean): { from: Square, to: Square } => {
  return {
    from: `${isKingsideCastle ? 'h' : 'a'}${color === 'w' ? '1' : '8'}`,
    to: `${isKingsideCastle ? 'f' : 'd'}${color === 'w' ? '1' : '8'}`,
  };
}

export const getVerboseChessMove = (fromSquare: Square, toSquare: Square, chessManager: Chess, promotion?: PieceSymbol) => {
  return chessManager
    .moves({ square: fromSquare, piece: chessManager.get(fromSquare)?.type, verbose: true, continueOnCheck: true })
    .find((move) => {
      if (promotion) {
        return move.to === toSquare && move.promotion === promotion
      }
      return move.to === toSquare;
    });
}

export const getVerboseSanChessMove = (sanMove: string, chessManager: Chess) => {
  return chessManager.moves({ verbose: true, continueOnCheck: true }).find((move) => move.san === sanMove);
}

export const mergeBoardAndPokemonState = (chessBoard: ChessBoardSquare[][], pokemonManager: PokemonBattleChessManager): PokemonChessBoardSquare[][] => {
  return chessBoard.map((boardRow, rowIndex) => 
    boardRow.map((boardColSquare, colIndex) => {
      let pokemonPiece = pokemonManager.getPokemonFromSquare(boardColSquare?.square)!;
      const square = getSquareFromIndices(rowIndex, colIndex);
      return {
        ...(boardColSquare || {}),
        square,
        pokemon: pokemonPiece?.pkmn,
        modifier: pokemonManager.squareModifiers.find((sqMod) => sqMod.square === square)?.modifier
      };
    })
  );
}

export const speciesOverride = (species: string) => {
  // Greninja bond sprite is broken. Just get greninja for now
  if (species === 'Greninja-Bond') {
    return 'Greninja';
  }
  return species;
}