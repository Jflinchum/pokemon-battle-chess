import { PieceSymbol, Color, Square, SQUARES } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import { PRNG, PRNGSeed } from '@pkmn/sim'
import { Dex } from "@pkmn/dex";
import { PokeSimRandomGen } from './PokeSimRandomGen';
import { WeatherId, TerrainId } from '../types/PokemonTypes';
import { getWeightedRandom } from '../util';

export const WeatherNames: WeatherId[] = [
 'sandstorm',
 'sunnyday',
 'raindance',
 'snowscape',
];

export const TerrainNames: TerrainId[] = [
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
  modifiers: {
    weather?: {
      id: WeatherId,
      duration: number
    },
    terrain?: {
      id: TerrainId,
      duration: number
    }
  };
}

export class PokemonBattleChessManager {
  public chessPieces: PokemonPiece[] = [];
  public seed?: PRNGSeed;
  public prng: PRNG;
  public draftPieces: PokemonSet[] = [];
  public banPieces: PokemonSet[] = [];
  public squareModifiers: SquareModifier[] = [];

  private pokeSimRandomGen: PokeSimRandomGen;
  private format?: string;
  private weatherWars?: boolean;

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
    this.format = format;
    this.weatherWars = weatherWars;

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

  public reset() {
    this.chessPieces = [];
    this.draftPieces = [];
    this.banPieces = [];
    this.squareModifiers = [];
    this.prng = new PRNG(this.seed);
    this.pokeSimRandomGen = new PokeSimRandomGen(this.prng);
    if (this.format === 'random') {
      this.populateBoardWithRandomTeams();
    } else if (this.format ==='draft') {
      this.populateDraftWithRandomTeams();
    }
    if (this.weatherWars) {
      this.populateSquareModifiers();
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

  /**
   * Initially populated via public room seed and then appended to with a secret internal seed as the game progresses
   */
  public populateSquareModifiers() {
    const maxSquare = this.prng.random(10, 20);
    this.generateSquareModifiers(maxSquare);
  }

  /**
   * Generates n square modifiers and pushes them onto this.squareModifiers. 
   * @param numSquares Number of squares to generate
   */
  private generateSquareModifiers(numSquares: number) {
    const distanceProbabilities = [{ value: 0.5, weight: 0.4 }, { value: 1.5, weight: 0.3 }, { value: 2.5, weight: 0.2 }, { value: 3.5, weight: 0.1 }];
    let i = 0;
    while (i < numSquares) {
      const x = 3.5 + ((this.prng.random() < 0.5 ? 1 : -1) * getWeightedRandom(distanceProbabilities, this.prng));
      const y = 3.5 + ((this.prng.random() < 0.5 ? 1 : -1) * getWeightedRandom(distanceProbabilities, this.prng));
      const square = SQUARES[(x*8) + y];
      const currentSquareWeather = this.getWeatherFromSquare(square);

      /**
       * If we detect weather on the square already, we need to push the new modifier onto it instead of adding a duplicate square onto the array
       */
      if (currentSquareWeather) {
        /**
         * If the current square position has too many modifiers, skip it.
         * We could get around this extra generation by keeping track of a map of possible squares
         * and removing them from the pool if they have too many modifiers
         */
        if (currentSquareWeather.modifiers.terrain && currentSquareWeather.modifiers.weather) {
          continue;
        }

        /**
         * Generate terrain if we have weather, otherwise generate weather
         */
        if (currentSquareWeather.modifiers.terrain) {
          currentSquareWeather.modifiers.weather = {
            id: this.prng.sample(WeatherNames),
            duration: this.prng.random(5, 15)
          }
        } else {
          currentSquareWeather.modifiers.terrain = {
            id: this.prng.sample(TerrainNames),
            duration: this.prng.random(5, 15)
          }
        }
      } else {
        const isTerrainModifier = this.prng.random() > 0.5;
        let newSquareModifier;
        if (isTerrainModifier) {
          newSquareModifier = {
            square,
            modifiers: {
              terrain: {
                id: this.prng.sample(TerrainNames),
                duration: this.prng.random(5, 15),
              }
            },
          };
        } else {
          newSquareModifier = {
            square,
            modifiers: {
              weather: {
                id: this.prng.sample(WeatherNames),
                duration: this.prng.random(5, 15),
              }
            },
          };
        }
        this.squareModifiers.push(newSquareModifier)
      }
      i++;
    }
  };

  public tickSquareModifiers() {
    this.squareModifiers = this.squareModifiers.map((squareMod) => {
      if (squareMod.modifiers.weather) {
        squareMod.modifiers.weather.duration--;
        if (squareMod.modifiers.weather.duration === 0) {
          delete squareMod.modifiers.weather;
        }
      }
      if (squareMod.modifiers.terrain) {
        squareMod.modifiers.terrain.duration--;
        if (squareMod.modifiers.terrain.duration === 0) {
          delete squareMod.modifiers.terrain;
        }
      }
      return squareMod;
    }).filter((squareMod) => squareMod.modifiers.terrain || squareMod.modifiers.weather);
  }

  public updateSquareWeather(square: Square, weather?: WeatherId) {
    if (!weather) return;
    const squareMod = this.getWeatherFromSquare(square);
    const newWeather = {
      id: weather,
      duration: this.prng.random(5, 15),
    };
    if (squareMod) {
      squareMod.modifiers.weather = newWeather;
    } else {
      this.squareModifiers.push({
        square,
        modifiers: {
          weather: newWeather
        }
      })
    }
  }

  public updateSquareTerrain(square: Square, terrain?: TerrainId) {
    if (!terrain) return;
    const squareMod = this.getWeatherFromSquare(square);
    const newTerrain = {
      id: terrain,
      duration: this.prng.random(5, 15),
    };
    if (squareMod) {
      squareMod.modifiers.terrain = newTerrain;
    } else {
      this.squareModifiers.push({
        square,
        modifiers: {
          terrain: newTerrain
        }
      })
    }
  }

  public createNewSquareModifiers(target: number, secretPrng: PRNG) {
    if (target <= this.squareModifiers.length) {
      return;
    }
    const shouldGenerateNewSquare = !secretPrng.randomChance(1, target - this.squareModifiers.length);
    if (!shouldGenerateNewSquare) {
      return;
    }
    const numSquares = secretPrng.random(target - this.squareModifiers.length + 1)
    this.generateSquareModifiers(numSquares);
    return numSquares;
  }

  public setSquareModifiers(newModifiers: SquareModifier[]) {
    this.squareModifiers = newModifiers;
  }

  public getWeatherFromSquare(square?: Square | null, squareModifiers?: SquareModifier[]) {
    if (squareModifiers) {
      return squareModifiers.find((modifier) => modifier.square === square);
    }
    return this.squareModifiers.find((modifier) => modifier.square === square);
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
    return pokemonDex.bst <= 530;
  }

  private bishopAndKnightFilter(pokemon: string) {
    const pokemonDex = Dex.species.get(pokemon);
    return pokemonDex.bst > 520 && pokemonDex.bst < 550;
  }

  private rookFilter(pokemon: string) {
    const pokemonDex = Dex.species.get(pokemon);
    return pokemonDex.bst > 540 && pokemonDex.bst < 570;
  }

  private kingAndQueenFilter(pokemon: string) {
    const pokemonDex = Dex.species.get(pokemon);
    return pokemonDex.bst >= 570;
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
