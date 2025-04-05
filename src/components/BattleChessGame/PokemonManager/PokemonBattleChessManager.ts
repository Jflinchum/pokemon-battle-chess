import { ChessBoardSquare } from "../ChessManager/types";
import { PieceSymbol, Color, Square } from "chess.js";
import { TeamGenerators } from '@pkmn/randoms';
import { PokemonSet } from "@pkmn/data";
import { PRNGSeed } from '@pkmn/sim'
import { FormatID } from "../../../context/GameStateContext";

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
  public chessPieces: PokemonPiece[] = [];
  public board: ChessBoardSquare[][];
  public seed: PRNGSeed;
  public draftPieces: PokemonSet[] = [];
  public banPieces: PokemonSet[] = [];

  constructor(board: ChessBoardSquare[][], seed: PRNGSeed, format: FormatID) {
    this.board = board;
    this.seed = seed;
    
    if (format === 'random') {
      this.populateBoardWithRandomTeams();
    } else if (format ==='draft') {
      this.populateDraftWithRandomTeams();
    }
  }

  private *teamRandomGenerator(): Generator<PokemonSet> {
    const generator = TeamGenerators.getTeamGenerator('gen9randombattle', this.seed);
    let team = generator.getTeam();
    while (true) {
      if (team.length === 0) {
        team = generator.getTeam();
      }
      const pokemon = team.pop()!;
      // Ensure no duplicate species
      if (this.chessPieces.find((piece) => piece.pkmn.species === pokemon.species) || this.draftPieces.find((piece) => piece.species === pokemon.species)) {
        continue;
      }
      yield pokemon!;
    }
  }

  public populateBoardWithRandomTeams() {
    const teamGen = this.teamRandomGenerator();
    for (let row = 0; row < this.board.length; row++) {
      for (let col = 0; col < this.board[row].length; col++) {
        const sq = this.board[row][col];
        if (sq !== null) {
          this.chessPieces.push({ type: sq.type, square: sq.square, pkmn: teamGen.next().value, color: sq.color });
        }
      }
    }
  }

  public populateDraftWithRandomTeams() {
    const teamGen = this.teamRandomGenerator();
    for (let i = 0; i < 38; i++) {
      this.draftPieces.push(teamGen.next().value);
    }
  }

  public assignPokemonToSquare(index: number | null, square: Square, type: PieceSymbol, color: Color) {
    if (index !== null) {
      this.chessPieces.push({ type, square, color, pkmn: this.draftPieces.splice(index, 1)[0] })
    }
  }

  public banDraftPiece(index: number | null) {
    if (index !== null) {
      this.banPieces.push(this.draftPieces.splice(index, 1)[0]);
    }
  }

  public getChessPieces = () => (this.chessPieces);

  public getTakenChessPieces = (color: Color) => {
    return this.chessPieces.filter((piece) => piece.color === color && piece.square === null);
  }

  public getPokemonFromSquare = (square?: Square | null) => {
    if (!square) {
      return null;
    }
    return this.chessPieces.find((chessPiece) => chessPiece.square === square);
  }

  public getPlayer1PokemonFromMoveAndColor = (fromSquare?: Square, toSquare?: Square, color?: Color) => {
    if (!fromSquare || !toSquare || !color) {
      return null;
    }
    const fromSquarePiece = this.chessPieces.find((chessPiece) => chessPiece.square === fromSquare);
    const toSquarePiece = this.chessPieces.find((chessPiece) => chessPiece.square === toSquare);
    if (fromSquarePiece?.color === color) {
      return fromSquarePiece;
    } else {
      return toSquarePiece;
    }
  }

  public getPlayer2PokemonFromMoveAndColor = (fromSquare?: Square, toSquare?: Square, color?: Color) => {
    if (!fromSquare || !toSquare || !color) {
      return null;
    }
    const fromSquarePiece = this.chessPieces.find((chessPiece) => chessPiece.square === fromSquare);
    const toSquarePiece = this.chessPieces.find((chessPiece) => chessPiece.square === toSquare);
    if (fromSquarePiece?.color === color) {
      return toSquarePiece;
    } else {
      return fromSquarePiece;
    }
  }

  public movePokemonToSquare = (fromSquare: Square, toSquare: Square, promotion?: PieceSymbol) => {
    const pokemonToMove = this.chessPieces.find((chessPiece) => chessPiece.square === fromSquare);

    const pokemonToRemove = this.chessPieces.find((chessPiece) => chessPiece.square === toSquare);
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