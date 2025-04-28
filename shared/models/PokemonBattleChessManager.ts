import { PieceSymbol, Color, Square, SQUARES } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import { PRNG, PRNGSeed } from '@pkmn/sim'
import { Dex } from "@pkmn/dex";
import { PokeSimRandomGen } from './PokeSimRandomGen';
import { WeatherId, TerrainId } from '../types/PokemonTypes';

const WeatherNames: WeatherId[] = [
 'sandstorm',
 'sunnyday',
 'raindance',
 'snowscape',
];

const TerrainNames: TerrainId[] = [
  'electricterrain',
  'grassyterrain',
  'psychicterrain',
  'mistyterrain'
];

export type FormatID = 'random' | 'draft';

export type ChessBoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;

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
export interface SquareModifier {
  square: Square,
  modifier: WeatherId | TerrainId
}

export class PokemonBattleChessManager {
  public chessPieces: PokemonPiece[] = [];
  public seed?: PRNGSeed;
  public prng: PRNG;
  public draftPieces: PokemonSet[] = [];
  public banPieces: PokemonSet[] = [];
  public squareModifiers: SquareModifier[] = [];

  private pokeSimRandomGen: PokeSimRandomGen;

  constructor({
    seed,
    format,
    weatherWars,
    chessPieces,
    squareModifiers
    }: { seed?: PRNGSeed, format?: FormatID, weatherWars?: boolean; chessPieces?: PokemonPiece[], squareModifiers?: SquareModifier[] }) {
    this.prng = new PRNG(seed);
    this.pokeSimRandomGen = new PokeSimRandomGen(this.prng);
    this.seed = seed;

    if (chessPieces) {
      this.chessPieces = chessPieces;
    } else {
      if (format === 'random') {
        this.populateBoardWithRandomTeams();
      } else if (format ==='draft') {
        this.populateDraftWithRandomTeams();
      }
    }
    
    if (squareModifiers) {
      this.squareModifiers = squareModifiers;
    } else {
      if (weatherWars) {
        this.populateSquareModifiers();
      }
    }
  }

  public populateBoardWithRandomTeams() {
    const bChessPieceArray = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r', ...Array(8).fill('p')];
    const wChessPieceArray = [...Array(8).fill('p'), 'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 16; i++) {
      this.chessPieces.push({
        type: bChessPieceArray[i],
        square: `${String.fromCharCode(97 + Math.floor(i % 8))}${8 - Math.floor(i / 8)}` as Square,
        pkmn: this.pokeSimRandomGen.buildRandomPokemon(this.getFilter(bChessPieceArray[i])),
        color: 'b'
      });
    }
    for (let i = 0; i < 16; i++) {
      this.chessPieces.push({
        type: wChessPieceArray[i],
        square: `${String.fromCharCode(97 + Math.floor(i % 8))}${2 - Math.floor(i / 8)}` as Square,
        pkmn: this.pokeSimRandomGen.buildRandomPokemon(this.getFilter(wChessPieceArray[i])),
        color: 'w'
      });
    }
  }

  public populateDraftWithRandomTeams() {
    for (let i = 0; i < 38; i++) {
      this.draftPieces.push(this.pokeSimRandomGen.buildRandomPokemon());
    }
  }

  public populateSquareModifiers() {
    const modifiers = [...WeatherNames, ...TerrainNames];
    for (let i = 0; i < 64; i++) {
      if (this.prng.randomChance(1, 8)) {
        this.squareModifiers.push({ square: SQUARES[i], modifier: this.prng.sample(modifiers) })
      }
    }
  }

  private getFilter(type: PieceSymbol) {
    switch (type) {
      case 'p':
        return this.pawnFilter;
      case 'b':
      case 'n':
        return this.bishopAndKnightFilter;
      case 'r':
        return this.rookFilter;
      case 'q':
      case 'k':
        return this.kingAndQueenFilter;
    }
  }

  private pawnFilter(pokemon: string) {
    const pokemonDex = Dex.species.get(pokemon);
    return pokemonDex.bst < 530;
  }

  private bishopAndKnightFilter(pokemon: string) {
    const pokemonDex = Dex.species.get(pokemon);
    return pokemonDex.bst > 500 && pokemonDex.bst < 580;
  }

  private rookFilter(pokemon: string) {
    const pokemonDex = Dex.species.get(pokemon);
    return pokemonDex.bst > 530 && pokemonDex.bst < 600;
  }

  private kingAndQueenFilter(pokemon: string) {
    const pokemonDex = Dex.species.get(pokemon);
    return pokemonDex.bst > 600;
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

  public setChessPieces = (chessPieces: PokemonPiece[]) => {
    this.chessPieces = chessPieces;
  };

  public getTakenChessPieces = (color?: Color) => {
    return this.chessPieces.filter((piece) => color ? (piece.color === color && piece.square === null) : true);
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
  };
}
