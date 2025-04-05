import { Chess, Color, Square } from "chess.js";
import { ChessBoardSquare, PokemonChessBoardSquare } from "./types";
import { PokemonBattleChessManager } from "../PokemonManager/PokemonBattleChessManager";

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

export const getVerboseChessMove = (fromSquare: Square, toSquare: Square, chessManager: Chess) => {
  return chessManager.moves({ square: fromSquare, piece: chessManager.get(fromSquare)?.type, verbose: true }).find((move) => move.to === toSquare);
}

export const mergeBoardAndPokemonState = (chessBoard: ChessBoardSquare[][], pokemonManager: PokemonBattleChessManager): PokemonChessBoardSquare[][] => {
  return chessBoard.map((boardColumn) => 
    boardColumn.map((boardRowSquare) => {
      let pokemonPiece = pokemonManager.getPokemonFromSquare(boardRowSquare?.square)!;
      if (boardRowSquare) {
        return { ...boardRowSquare, pokemon: pokemonPiece?.pkmn };
      }
      return boardRowSquare;
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