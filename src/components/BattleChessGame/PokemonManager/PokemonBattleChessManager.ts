import { ChessBoardSquare } from "../ChessManager/types";
import { PieceSymbol, Color, Square } from "chess.js";
import { TeamGenerators } from '@pkmn/randoms';
import { PokemonSet } from "@pkmn/data";
import { PRNGSeed } from '@pkmn/sim'

export interface PokemonPiece {
  type: PieceSymbol
  square: Square | null
  pkmn: PokemonSet
  color: Color
}

export interface PokemonBattle {
  player1Pokemon?: PokemonSet,
  player2Pokemon?: PokemonSet,
  onGoing: boolean;
}

export class PokemonBattleChessManager {
  private _chessPieces: PokemonPiece[] = [];
  constructor(board: ChessBoardSquare[][], seed: PRNGSeed) {
    const generator = TeamGenerators.getTeamGenerator('gen9randombattle', seed);
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const sq = board[row][col];
        if (sq !== null) {
          this._chessPieces.push({ type: sq.type, square: sq.square, pkmn: generator.getTeam()[0], color: sq.color });
        }
      }
    }
  }

  public getChessPieces = () => (this._chessPieces);

  public getTakenChessPieces = (color: Color) => {
    return this._chessPieces.filter((piece) => piece.color === color && piece.square === null);
  }

  public getPokemonFromSquare = (square?: Square) => {
    if (!square) {
      return null;
    }
    return this._chessPieces.find((chessPiece) => chessPiece.square === square);
  }

  public movePokemonToSquare = (fromSquare: Square, toSquare: Square, promotion?: PieceSymbol) => {
    const pokemonToMove = this._chessPieces.find((chessPiece) => chessPiece.square === fromSquare);

    const pokemonToRemove = this._chessPieces.find((chessPiece) => chessPiece.square === toSquare);
    if (pokemonToMove) {
      pokemonToMove.square = toSquare;
      if (promotion) {
        pokemonToMove.type = promotion;
      }
    }
    if (pokemonToRemove) {
      pokemonToRemove.square = null;
    }
    return pokemonToMove;
  }
}