import { ChessBoardSquare } from "../ChessManager/types";
import { PieceSymbol, Color, Square } from "chess.js";
import { TeamGenerators } from '@pkmn/randoms';
import { PokemonSet } from "@pkmn/data";

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
  private _currentBattle: PokemonBattle = { onGoing: false };

  constructor(board: ChessBoardSquare[][]) {
    const generator = TeamGenerators.getTeamGenerator('gen9randombattle');
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

  public getPokemonFromSquare = (square: Square) => {
    return this._chessPieces.find((chessPiece) => chessPiece.square === square);
  }

  public movePokemonToSquare = (fromSquare: Square, toSquare: Square) => {
    const pokemonToMove = this._chessPieces.find((chessPiece) => chessPiece.square === fromSquare);

    const pokemonToRemove = this._chessPieces.find((chessPiece) => chessPiece.square === toSquare);
    if (pokemonToMove) {
      pokemonToMove.square = toSquare;
    }
    if (pokemonToRemove) {
      pokemonToRemove.square = null;
    }
    return pokemonToMove;
  }

  public getCurrentBattle = () => (this._currentBattle);
  
  public startBattle = (p1Pokemon: PokemonSet, p2Pokemon: PokemonSet) => {
    this._currentBattle.player1Pokemon = p1Pokemon;
    this._currentBattle.player2Pokemon = p2Pokemon;
    this._currentBattle.onGoing = true;
  }

  public finishBattle = () => {
    this._currentBattle = {
      onGoing: false,
    };
  }
}