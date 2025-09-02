import { PieceSymbol, Color, Square, SQUARES } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import { PRNG, PRNGSeed } from "@pkmn/sim";
import { Dex } from "@pkmn/dex";
import { PokeSimRandomGen } from "./PokeSimRandomGen.js";
import { WeatherId, TerrainId } from "../types/PokemonTypes.js";
import { ChessBoardSquare } from "../types/ChessBoardSquare.js";
import { getWeightedRandom } from "../util/getWeightedRandom.js";
import { getSquareIndexIn1DArray } from "../util/chessSquareIndex.js";
import {
  HIGH_SQUARE_MODIFIER_DURATION,
  HIGH_SQUARE_MODIFIER_TARGET,
  LOW_SQUARE_MODIFIER_DURATION,
  LOW_SQUARE_MODIFIER_TARGET,
  SQUARE_MOD_X_DISTANCE_PROBABILITIES,
  SQUARE_MOD_Y_DISTANCE_PROBABILITY,
} from "../constants/gameConstants.js";

export const WeatherNames: WeatherId[] = [
  "sandstorm",
  "sunnyday",
  "raindance",
  "snowscape",
];

export const TerrainNames: TerrainId[] = [
  "electricterrain",
  "grassyterrain",
  "psychicterrain",
  "mistyterrain",
];

export type FormatID = "random" | "draft";

export interface PokemonPiece {
  index: number;
  type: PieceSymbol;
  square: Square | null;
  pkmn: PokemonSet;
  color: Color;
}

export interface PokemonBattle {
  player1Pokemon?: PokemonSet;
  player2Pokemon?: PokemonSet;
  onGoing: boolean;
}
export interface SquareModifier {
  square: Square;
  modifiers: {
    weather?: {
      id: WeatherId;
      duration: number;
    };
    terrain?: {
      id: TerrainId;
      duration: number;
    };
  };
}

export class PokemonBattleChessManager {
  public chessPieces: PokemonPiece[] = [];
  public seed?: PRNGSeed;
  public prng: PRNG;
  public draftPieces: { set: PokemonSet; index: number }[] = [];
  public banPieces: { set: PokemonSet; index: number }[] = [];
  public squareModifiers: SquareModifier[] = [];

  private pokeSimRandomGen: PokeSimRandomGen;
  private format?: string;
  private weatherWars?: boolean;

  constructor({
    seed,
    format,
    weatherWars,
    chessPieces,
    chessBoard,
    pokemonPieceIndices,
    pokemonBannedIndices,
    squareModifiers,
  }: {
    seed?: PRNGSeed;
    format?: FormatID;
    weatherWars?: boolean;
    chessPieces?: PokemonPiece[];
    chessBoard?: ChessBoardSquare[][];
    pokemonPieceIndices?: number[];
    pokemonBannedIndices?: number[];
    squareModifiers?: SquareModifier[];
  }) {
    this.prng = new PRNG(seed);
    this.pokeSimRandomGen = new PokeSimRandomGen(this.prng);
    this.seed = seed;
    this.format = format;
    this.weatherWars = weatherWars;

    if (chessPieces) {
      this.chessPieces = chessPieces;
    } else {
      if (format === "random") {
        this.populateBoardWithRandomTeams(chessBoard, pokemonPieceIndices);
      } else if (format === "draft") {
        this.populateDraftWithRandomTeams(
          chessBoard,
          pokemonPieceIndices,
          pokemonBannedIndices,
        );
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
    if (this.format === "random") {
      this.populateBoardWithRandomTeams();
    } else if (this.format === "draft") {
      this.populateDraftWithRandomTeams();
    }
    if (this.weatherWars) {
      this.populateSquareModifiers();
    }
  }

  public populateBoardWithRandomTeams(
    cachedChessBoard?: ChessBoardSquare[][],
    cachedChessPieceIndices?: number[],
  ) {
    const bChessPieceArray = [
      "r",
      "n",
      "b",
      "q",
      "k",
      "b",
      "n",
      "r",
      ...Array(8).fill("p"),
    ];
    const wChessPieceArray = [
      ...Array(8).fill("p"),
      "r",
      "n",
      "b",
      "q",
      "k",
      "b",
      "n",
      "r",
    ];
    for (let i = 0; i < 16; i++) {
      if (cachedChessBoard && cachedChessPieceIndices) {
        const square =
          this.getChessPieceFromCachedBoardAndIndices(
            i,
            cachedChessBoard,
            cachedChessPieceIndices,
          )?.square || null;
        this.chessPieces.push({
          index: i,
          type: bChessPieceArray[i],
          square,
          pkmn: this.pokeSimRandomGen.buildRandomPokemon(
            this.getFilter(bChessPieceArray[i]),
          ),
          color: "b",
        });
      } else {
        this.chessPieces.push({
          index: i,
          type: bChessPieceArray[i],
          square:
            `${String.fromCharCode(97 + Math.floor(i % 8))}${8 - Math.floor(i / 8)}` as Square,
          pkmn: this.pokeSimRandomGen.buildRandomPokemon(
            this.getFilter(bChessPieceArray[i]),
          ),
          color: "b",
        });
      }
    }
    for (let i = 0; i < 16; i++) {
      if (cachedChessBoard && cachedChessPieceIndices) {
        const square =
          this.getChessPieceFromCachedBoardAndIndices(
            i + 16,
            cachedChessBoard,
            cachedChessPieceIndices,
          )?.square || null;
        this.chessPieces.push({
          index: i + 16,
          type: wChessPieceArray[i],
          square,
          pkmn: this.pokeSimRandomGen.buildRandomPokemon(
            this.getFilter(wChessPieceArray[i]),
          ),
          color: "w",
        });
      } else {
        this.chessPieces.push({
          index: i + 16,
          type: wChessPieceArray[i],
          square:
            `${String.fromCharCode(97 + Math.floor(i % 8))}${2 - Math.floor(i / 8)}` as Square,
          pkmn: this.pokeSimRandomGen.buildRandomPokemon(
            this.getFilter(wChessPieceArray[i]),
          ),
          color: "w",
        });
      }
    }
  }

  public populateDraftWithRandomTeams(
    cachedChessBoard?: ChessBoardSquare[][],
    cachedChessPieceIndices?: number[],
    cachedBannedPokemonPieces?: number[],
  ) {
    if (
      cachedChessBoard &&
      cachedChessPieceIndices &&
      cachedBannedPokemonPieces
    ) {
      for (let i = 0; i < 38; i++) {
        const cachedChessSquare = this.getChessPieceFromCachedBoardAndIndices(
          i,
          cachedChessBoard,
          cachedChessPieceIndices,
        );
        if (cachedChessSquare) {
          this.chessPieces.push({
            index: i,
            type: cachedChessSquare.type,
            square: cachedChessSquare.square,
            pkmn: this.pokeSimRandomGen.buildRandomPokemon(),
            color: cachedChessSquare.color,
          });
        } else {
          if (cachedBannedPokemonPieces.includes(i)) {
            this.banPieces.push({
              set: this.pokeSimRandomGen.buildRandomPokemon(),
              index: i,
            });
          } else {
            this.draftPieces.push({
              set: this.pokeSimRandomGen.buildRandomPokemon(),
              index: i,
            });
          }
        }
      }
    } else {
      for (let i = 0; i < 38; i++) {
        this.draftPieces.push({
          set: this.pokeSimRandomGen.buildRandomPokemon(),
          index: i,
        });
      }
    }
  }

  private getChessPieceFromCachedBoardAndIndices(
    currentIndex: number,
    cachedChessBoard?: ChessBoardSquare[][],
    cachedChessPieceIndices?: number[],
  ) {
    if (!cachedChessBoard || !cachedChessPieceIndices) {
      return;
    }
    const chessBoardIndex = cachedChessPieceIndices.findIndex(
      (i) => i === currentIndex,
    );
    if (chessBoardIndex >= 0) {
      return cachedChessBoard[Math.floor(chessBoardIndex / 8)][
        chessBoardIndex % 8
      ];
    } else {
      return null;
    }
  }

  /**
   * Initially populated via public room seed and then appended to with a secret internal seed as the game progresses
   */
  public populateSquareModifiers() {
    const maxSquare = this.prng.random(
      LOW_SQUARE_MODIFIER_TARGET,
      HIGH_SQUARE_MODIFIER_TARGET,
    );
    this.generateSquareModifiers(maxSquare);
  }

  /**
   * Generates n square modifiers and pushes them onto this.squareModifiers.
   * @param numSquares Number of squares to generate
   * @returns The new squares generated, or previously generated squares with new modifiers
   */
  private generateSquareModifiers(numSquares: number) {
    const generatedSquares: SquareModifier[] = [];
    let i = 0;
    while (i < numSquares) {
      const x =
        3.5 +
        (this.prng.random() < 0.5 ? 1 : -1) *
          getWeightedRandom(SQUARE_MOD_X_DISTANCE_PROBABILITIES, this.prng);
      const y =
        3.5 +
        (this.prng.random() < 0.5 ? 1 : -1) *
          getWeightedRandom(SQUARE_MOD_Y_DISTANCE_PROBABILITY, this.prng);
      const square = SQUARES[y * 8 + x];
      const currentSquareWeather = this.getModifiersFromSquare(square);

      /**
       * If we detect weather on the square already, we need to push the new modifier onto it instead of adding a duplicate square onto the array
       */
      if (currentSquareWeather) {
        /**
         * If the current square position has too many modifiers, skip it.
         * We could get around this extra generation by keeping track of a map of possible squares
         * and removing them from the pool if they have too many modifiers
         */
        if (
          currentSquareWeather.modifiers.terrain &&
          currentSquareWeather.modifiers.weather
        ) {
          continue;
        }

        /**
         * Generate terrain if we have weather, otherwise generate weather
         */
        if (currentSquareWeather.modifiers.terrain) {
          currentSquareWeather.modifiers.weather = {
            id: this.prng.sample(WeatherNames),
            duration: this.prng.random(
              LOW_SQUARE_MODIFIER_DURATION,
              HIGH_SQUARE_MODIFIER_DURATION,
            ),
          };
        } else {
          currentSquareWeather.modifiers.terrain = {
            id: this.prng.sample(TerrainNames),
            duration: this.prng.random(
              LOW_SQUARE_MODIFIER_DURATION,
              HIGH_SQUARE_MODIFIER_DURATION,
            ),
          };
        }
        generatedSquares.push(currentSquareWeather);
      } else {
        const isTerrainModifier = this.prng.random() > 0.5;
        let newSquareModifier;
        if (isTerrainModifier) {
          newSquareModifier = {
            square,
            modifiers: {
              terrain: {
                id: this.prng.sample(TerrainNames),
                duration: this.prng.random(
                  LOW_SQUARE_MODIFIER_DURATION,
                  HIGH_SQUARE_MODIFIER_DURATION,
                ),
              },
            },
          };
        } else {
          newSquareModifier = {
            square,
            modifiers: {
              weather: {
                id: this.prng.sample(WeatherNames),
                duration: this.prng.random(
                  LOW_SQUARE_MODIFIER_DURATION,
                  HIGH_SQUARE_MODIFIER_DURATION,
                ),
              },
            },
          };
        }
        this.squareModifiers.push(newSquareModifier);
        generatedSquares.push(newSquareModifier);
      }
      i++;
    }
    return generatedSquares;
  }

  public tickSquareModifiers(square: Square) {
    const squareMod = this.squareModifiers.find(
      (squareMod) => squareMod.square === square,
    );
    if (!squareMod) {
      return;
    }

    if (squareMod.modifiers.weather) {
      squareMod.modifiers.weather.duration--;
      if (squareMod.modifiers.weather.duration <= 0) {
        delete squareMod.modifiers.weather;
      }
    }
    if (squareMod.modifiers.terrain) {
      squareMod.modifiers.terrain.duration--;
      if (squareMod.modifiers.terrain.duration <= 0) {
        delete squareMod.modifiers.terrain;
      }
    }

    this.squareModifiers = this.squareModifiers.filter(
      (squareMod) => squareMod.modifiers.terrain || squareMod.modifiers.weather,
    );
  }

  public tickAllSquareModifiers() {
    this.squareModifiers = this.squareModifiers
      .map((squareMod) => {
        if (squareMod.modifiers.weather) {
          squareMod.modifiers.weather.duration--;
          if (squareMod.modifiers.weather.duration <= 0) {
            delete squareMod.modifiers.weather;
          }
        }
        if (squareMod.modifiers.terrain) {
          squareMod.modifiers.terrain.duration--;
          if (squareMod.modifiers.terrain.duration <= 0) {
            delete squareMod.modifiers.terrain;
          }
        }
        return squareMod;
      })
      .filter(
        (squareMod) =>
          squareMod.modifiers.terrain || squareMod.modifiers.weather,
      );
  }

  public updateSquareWeather(square: Square, weather?: WeatherId | "unset") {
    if (weather === undefined) return;
    const squareMod = this.getModifiersFromSquare(square);

    if (weather === "unset") {
      if (squareMod?.modifiers.terrain) {
        delete squareMod.modifiers.weather;
      } else {
        this.squareModifiers = this.squareModifiers.filter(
          (sqMod) => sqMod.square !== square,
        );
      }
    } else {
      const newWeather = {
        id: weather,
        duration: this.prng.random(2, 5),
      };
      if (squareMod) {
        squareMod.modifiers.weather = newWeather;
      } else {
        this.squareModifiers.push({
          square,
          modifiers: {
            weather: newWeather,
          },
        });
      }
    }
  }

  public updateSquareTerrain(square: Square, terrain?: TerrainId | "unset") {
    if (terrain === undefined) return;
    const squareMod = this.getModifiersFromSquare(square);
    if (terrain === "unset") {
      if (squareMod?.modifiers.weather) {
        delete squareMod.modifiers.terrain;
      } else {
        this.squareModifiers = this.squareModifiers.filter(
          (sqMod) => sqMod.square !== square,
        );
      }
    } else {
      const newTerrain = {
        id: terrain,
        duration: this.prng.random(2, 5),
      };
      if (squareMod) {
        squareMod.modifiers.terrain = newTerrain;
      } else {
        this.squareModifiers.push({
          square,
          modifiers: {
            terrain: newTerrain,
          },
        });
      }
    }
  }

  public createNewSquareModifiers(target: number) {
    const prng = new PRNG();
    if (target <= this.squareModifiers.length) {
      return;
    }
    const shouldGenerateNewSquare = !prng.randomChance(
      1,
      target - this.squareModifiers.length,
    );
    if (!shouldGenerateNewSquare) {
      return;
    }
    const numSquares = prng.random(target - this.squareModifiers.length + 1);
    return this.generateSquareModifiers(numSquares);
  }

  public setSquareModifiers(newModifiers: SquareModifier[]) {
    this.squareModifiers = newModifiers;
  }

  public updateSquareModifiers(modifiers: SquareModifier[]) {
    modifiers.forEach((squareMod) => {
      const updatedSquare = this.squareModifiers.find(
        (currSquareMod) => currSquareMod.square === squareMod.square,
      );
      if (updatedSquare) {
        updatedSquare.modifiers = squareMod.modifiers;
      } else {
        this.squareModifiers.push(squareMod);
      }
    });
  }

  public removeSquareModifiers(squares: Square[]) {
    this.squareModifiers = this.squareModifiers.filter(
      (squareMod) => !squares.includes(squareMod.square),
    );
  }

  public getModifiersFromSquare(
    square?: Square | null,
    squareModifiers?: SquareModifier[],
  ) {
    if (squareModifiers) {
      return squareModifiers.find((modifier) => modifier.square === square);
    }
    return this.squareModifiers.find((modifier) => modifier.square === square);
  }

  public getPokemonIndexedBoardLocations(): number[] {
    const boardArray = new Array(64).fill(-1);
    this.chessPieces.forEach((piece) => {
      if (piece.square) {
        const boardArrayIndex = getSquareIndexIn1DArray(piece.square);
        boardArray[boardArrayIndex] = piece.index;
      }
    });
    return boardArray;
  }

  private getFilter(type: PieceSymbol) {
    switch (type) {
      case "p":
        return this.pawnFilter;
      case "b":
      case "n":
        return this.bishopAndKnightFilter;
      case "r":
        return this.rookFilter;
      case "q":
      case "k":
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

  public assignPokemonToSquare(
    index: number,
    square: Square,
    type: PieceSymbol,
    color: Color,
  ) {
    this.chessPieces.push({
      index,
      type,
      square,
      color,
      pkmn: this.draftPieces.splice(
        this.draftPieces.findIndex((piece) => piece.index === index),
        1,
      )[0].set,
    });
  }

  public banDraftPiece(index: number) {
    this.banPieces.push(
      this.draftPieces.splice(
        this.draftPieces.findIndex((piece) => piece.index === index),
        1,
      )[0],
    );
  }

  public getChessPieces = () => this.chessPieces;

  public setChessPieces = (chessPieces: PokemonPiece[]) => {
    this.chessPieces = chessPieces;
  };

  public getTakenChessPieces = (color?: Color) => {
    return this.chessPieces.filter((piece) =>
      color ? piece.color === color && piece.square === null : true,
    );
  };

  public getPokemonFromSquare = (square?: Square | null) => {
    if (!square) {
      return null;
    }
    return this.chessPieces.find((chessPiece) => chessPiece.square === square);
  };

  public getPlayer1PokemonFromMoveAndColor = (
    fromSquare?: Square,
    toSquare?: Square,
    color?: Color,
  ) => {
    if (!fromSquare || !toSquare || !color) {
      return null;
    }
    const fromSquarePiece = this.chessPieces.find(
      (chessPiece) => chessPiece.square === fromSquare,
    );
    const toSquarePiece = this.chessPieces.find(
      (chessPiece) => chessPiece.square === toSquare,
    );
    if (fromSquarePiece?.color === color) {
      return fromSquarePiece;
    } else {
      return toSquarePiece;
    }
  };

  public getPlayer2PokemonFromMoveAndColor = (
    fromSquare?: Square,
    toSquare?: Square,
    color?: Color,
  ) => {
    if (!fromSquare || !toSquare || !color) {
      return null;
    }
    const fromSquarePiece = this.chessPieces.find(
      (chessPiece) => chessPiece.square === fromSquare,
    );
    const toSquarePiece = this.chessPieces.find(
      (chessPiece) => chessPiece.square === toSquare,
    );
    if (fromSquarePiece?.color === color) {
      return toSquarePiece;
    } else {
      return fromSquarePiece;
    }
  };

  public movePokemonToSquare = (
    fromSquare: Square,
    toSquare: Square,
    promotion?: PieceSymbol,
  ) => {
    const pokemonToMove = this.chessPieces.find(
      (chessPiece) => chessPiece.square === fromSquare,
    );

    const pokemonToRemove = this.chessPieces.find(
      (chessPiece) => chessPiece.square === toSquare,
    );
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
