import { BoostID } from "@pkmn/data";
import { Protocol } from "@pkmn/protocol";
import { Battle, BattleStreams, Dex, PRNG, PRNGSeed, Teams } from "@pkmn/sim";
import { Chess, Color, Move, Square } from "chess.js";
import {
  CHESS_MOVES_UNTIL_NEW_SQUARE_MODIFIER_TARGET,
  HIGH_SQUARE_MODIFIER_TARGET,
  LOW_SQUARE_MODIFIER_TARGET,
} from "../constants/gameConstants.js";
import {
  PokemonBattleChessManager,
  TerrainNames,
  WeatherNames,
} from "../models/PokemonBattleChessManager.js";
import { MatchLog } from "../types/Game.js";
import { GameOptions } from "../types/GameOptions.js";
import { TerrainId, WeatherId } from "../types/PokemonTypes.js";
import { getCaptureSquare } from "../util/chessSquareIndex.js";

const POKE_SIMULATOR_TERMINATOR = "POKEMON_GAMBIT_END_OF_SIMULATION_TERMINATOR";

export const getChessMatchOutput = async ({
  sanMove,
  currentTurn,
  gameOptions,
  chessManager,
  pokemonManager,
  whitePlayerId,
  blackPlayerId,
  onPokemonBattleCreated = () => Promise.resolve(),
  onMoveChessPiece = () => Promise.resolve(),
  onGameEnd = () => Promise.resolve(),
  onRemoveChessPiece = () => Promise.resolve(),
  onSquareModifiersUpdate = () => Promise.resolve(),
}: {
  sanMove: string;
  currentTurn: Color;
  gameOptions: GameOptions;
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  whitePlayerId: string;
  blackPlayerId: string;
  onPokemonBattleCreated?: ({
    attemptedMove,
    battleSeed,
  }: {
    attemptedMove: { san: string; color: Color };
    battleSeed: PRNGSeed;
  }) => Promise<void>;
  onMoveChessPiece?: (move: Move) => Promise<void>;
  onGameEnd?: (winner: Color) => Promise<void>;
  onRemoveChessPiece?: () => Promise<void>;
  onSquareModifiersUpdate?: () => Promise<void>;
}) => {
  const whiteStreamOutput: MatchLog[] = [];
  const blackStreamOutput: MatchLog[] = [];

  const chessMove = chessManager
    .moves({ verbose: true, continueOnCheck: true })
    .find((move) => move.san === sanMove);
  if (!chessMove) {
    console.warn("Could not find chess move");
    return;
  }

  if (chessMove.isCapture() || chessMove.isEnPassant()) {
    const capturedPieceSquare = getCaptureSquare(chessMove);

    const p1Pokemon =
      currentTurn === "w"
        ? pokemonManager.getPokemonFromSquare(chessMove.from)
        : pokemonManager.getPokemonFromSquare(capturedPieceSquare);
    const p2Pokemon =
      currentTurn === "w"
        ? pokemonManager.getPokemonFromSquare(capturedPieceSquare)
        : pokemonManager.getPokemonFromSquare(chessMove.from);
    const attemptedMove = { san: sanMove, color: chessMove.color };

    if (!p1Pokemon || !p2Pokemon) {
      console.warn("Could not find pokemon to battle.");
      return;
    }

    const battleStartData: MatchLog = {
      type: "pokemon",
      data: {
        event: "battleStart",
        p1Pokemon: p1Pokemon.pkmn,
        p2Pokemon: p2Pokemon.pkmn,
        attemptedMove,
      },
    };
    const battleSeed = new PRNG().getSeed();
    await onPokemonBattleCreated({
      attemptedMove,
      battleSeed,
    });
    whiteStreamOutput.push(battleStartData);
    blackStreamOutput.push(battleStartData);

    const initialBattleOutput = await getPokemonBattleOutput({
      currentPokemonBattleStakes: {
        san: chessMove.san,
        color: chessMove.color,
      },
      moveHistory: [],
      seed: battleSeed,
      gameOptions,
      pokemonManager,
      whitePlayerId,
      blackPlayerId,
      advantageSide: currentTurn === "w" ? "p1" : "p2",
      chessManager,
      onMoveChessPiece,
      onGameEnd,
      onRemoveChessPiece,
      onSquareModifiersUpdate,
    });
    if (initialBattleOutput) {
      whiteStreamOutput.push(...initialBattleOutput.whiteStream);
      blackStreamOutput.push(...initialBattleOutput.blackStream);
    } else {
      console.warn("No initial battle output");
      return;
    }
  } else {
    await onMoveChessPiece(chessMove);
    const chessData: MatchLog = {
      type: "chess",
      data: { color: currentTurn, san: sanMove },
    };
    whiteStreamOutput.push(chessData);
    blackStreamOutput.push(chessData);
  }

  return { whiteStreamOutput, blackStreamOutput };
};

export const getNewSquareModTargetNumber = () => {
  return (
    Math.floor(
      Math.random() *
        (HIGH_SQUARE_MODIFIER_TARGET - LOW_SQUARE_MODIFIER_TARGET),
    ) + LOW_SQUARE_MODIFIER_TARGET
  );
};

export const getWeatherChangeOutput = ({
  gameOptions,
  currentTurn,
  chessManager,
  pokemonManager,
  squareModifierTarget,
}: {
  gameOptions: GameOptions;
  currentTurn: Color;
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  squareModifierTarget: number;
}): { newModifierTarget?: number; squareModifierLog: MatchLog } | undefined => {
  if (gameOptions.weatherWars && currentTurn === "w") {
    let newModifierTarget: number | undefined = undefined;
    if (
      chessManager.moveNumber() %
        CHESS_MOVES_UNTIL_NEW_SQUARE_MODIFIER_TARGET ===
      0
    ) {
      newModifierTarget = getNewSquareModTargetNumber();
    }
    const generatedSquares = pokemonManager.createNewSquareModifiers(
      newModifierTarget || squareModifierTarget,
    );
    if (generatedSquares && generatedSquares.length > 0) {
      const squareModifierLog: MatchLog = {
        type: "weather",
        data: {
          event: "weatherChange",
          modifier: {
            type: "modify",
            squareModifiers: generatedSquares,
          },
        },
      };
      return { newModifierTarget, squareModifierLog };
    }
  }
};

export const getPokemonBattleOutput = async ({
  p1PokemonMove,
  p2PokemonMove,
  moveHistory,
  currentPokemonBattleStakes,
  seed,
  whitePlayerId,
  blackPlayerId,
  advantageSide,
  gameOptions,
  pokemonManager,
  chessManager,
  onMoveChessPiece = () => Promise.resolve(),
  onGameEnd = () => Promise.resolve(),
  onRemoveChessPiece = () => Promise.resolve(),
  onSquareModifiersUpdate = () => Promise.resolve(),
}: {
  p1PokemonMove?: string;
  p2PokemonMove?: string;
  moveHistory: string[];
  currentPokemonBattleStakes: { san: string; color: Color } | null;
  seed: PRNGSeed;
  whitePlayerId: string;
  blackPlayerId: string;
  advantageSide: "p1" | "p2";
  gameOptions: GameOptions;
  pokemonManager: PokemonBattleChessManager;
  chessManager: Chess;
  onMoveChessPiece?: (move: Move) => Promise<void>;
  onGameEnd?: (winner: Color) => Promise<void>;
  onRemoveChessPiece?: (move: Move) => Promise<void>;
  onSquareModifiersUpdate?: () => Promise<void>;
}) => {
  const currentChessMove = chessManager
    .moves({ verbose: true, continueOnCheck: true })
    .find((move) => move.san === currentPokemonBattleStakes!.san);
  if (!currentChessMove) {
    console.error("Could not find chess move for pokemon battle stakes");
    return;
  }
  const capturedPieceSquare = getCaptureSquare(currentChessMove);

  const p1Pokemon =
    advantageSide === "p1"
      ? pokemonManager.getPokemonFromSquare(currentChessMove.from)
      : pokemonManager.getPokemonFromSquare(capturedPieceSquare);
  const p2Pokemon =
    advantageSide === "p1"
      ? pokemonManager.getPokemonFromSquare(capturedPieceSquare)
      : pokemonManager.getPokemonFromSquare(currentChessMove.from);

  if (!p1Pokemon || !p2Pokemon) {
    console.warn("Could not find pokemon for pokemon battle");
    return;
  }
  const squareModifier =
    pokemonManager.getModifiersFromSquare(capturedPieceSquare);

  const p1Spec = {
    name: whitePlayerId,
    team: Teams.pack([p1Pokemon.pkmn]),
  };
  const p2Spec = {
    name: blackPlayerId,
    team: Teams.pack([p2Pokemon.pkmn]),
  };

  const offenseAdvantage = gameOptions.offenseAdvantage;
  const modifiers = squareModifier?.modifiers;
  let addedModifiers = false;
  let weatherChanges: WeatherId | "unset";
  let terrainChanges: TerrainId | "unset";
  let currentPokemonBattle: Battle | undefined = undefined;

  const setCurrentPokemonBattle = (battle: Battle) => {
    currentPokemonBattle = battle;
  };

  const pokemonBattleChessMod = Dex.mod("pokemonbattlechess", {
    Formats: [
      {
        name: "pbc",
        mod: "gen9",
        onBegin() {
          setCurrentPokemonBattle(this);
        },
        onWeatherChange(target, _, sourceEffect) {
          if (
            sourceEffect.effectType === "Ability" ||
            sourceEffect.effectType === "Move"
          ) {
            if (
              target.battle.field.weather === "" ||
              WeatherNames.includes(target.battle.field.weather as WeatherId)
            ) {
              weatherChanges =
                (target.battle.field.weather as WeatherId) || "unset";
            }
          }
        },
        onTerrainChange(target, _, sourceEffect) {
          if (
            sourceEffect.effectType === "Ability" ||
            sourceEffect.effectType === "Move"
          ) {
            if (
              target.battle.field.terrain === "" ||
              TerrainNames.includes(target.battle.field.terrain as TerrainId)
            ) {
              terrainChanges =
                (target.battle.field.terrain as TerrainId) || "unset";
            }
          }
        },
        onSwitchIn(pokemon) {
          if (pokemon.side.id === advantageSide) {
            pokemon.boostBy(offenseAdvantage);
            for (const stat in offenseAdvantage) {
              if (offenseAdvantage[stat as BoostID]) {
                this.add(
                  "message",
                  `${pokemon.name} receives a stat boost from starting the battle!`,
                );
                this.add(
                  "-boost",
                  pokemon.fullname.replace(/(p[1-2])/g, "$1a"),
                  stat,
                  `${offenseAdvantage[stat as BoostID]}`,
                );
              }
            }
          }
          if (!addedModifiers) {
            if (modifiers?.weather) {
              this.field.setWeather(modifiers.weather.id, "debug");
            }
            if (modifiers?.terrain) {
              this.field.setTerrain(modifiers.terrain.id, "debug");
            }
            addedModifiers = true;
          }
        },
      },
    ],
  });
  const battleStream = BattleStreams.getPlayerStreams(
    new BattleStreams.BattleStream({}, pokemonBattleChessMod),
  );
  const spec = { formatid: "pbc", seed };
  battleStream.omniscient.write(`>start ${JSON.stringify(spec)}`);
  battleStream.omniscient.write(`>player p1 ${JSON.stringify(p1Spec)}`);
  battleStream.omniscient.write(`>player p2 ${JSON.stringify(p2Spec)}`);

  for (let i = 0; i < moveHistory.length; i++) {
    const player = moveHistory[i].substring(0, 3);
    if (player === ">p1") {
      battleStream.p1.write(moveHistory[i].substring(4));
    } else if (player === ">p2") {
      battleStream.p2.write(moveHistory[i].substring(4));
    }
  }

  battleStream.p1.write(POKE_SIMULATOR_TERMINATOR);
  battleStream.p2.write(POKE_SIMULATOR_TERMINATOR);

  if (p1PokemonMove && p2PokemonMove) {
    battleStream.p1.write(`move ${p1PokemonMove}`);
    battleStream.p2.write(`move ${p2PokemonMove}`);
  }
  if (p1PokemonMove === "forfeit" && currentPokemonBattle) {
    (currentPokemonBattle as unknown as Battle).add(
      "message",
      `${whitePlayerId} has forefeitted`,
    );
    // Custom forfeit command to reduce hp to 0 on client
    (currentPokemonBattle as unknown as Battle).add("-forfeit", "p1");
    (currentPokemonBattle as unknown as Battle).sendUpdates();
    battleStream.omniscient.write(">forcelose p1");
  } else if (p2PokemonMove === "forfeit" && currentPokemonBattle) {
    (currentPokemonBattle as unknown as Battle).add(
      "message",
      `${blackPlayerId} has forefeitted`,
    );
    // Custom forfeit command to reduce hp to 0 on client
    (currentPokemonBattle as unknown as Battle).add("-forfeit", "p2");
    (currentPokemonBattle as unknown as Battle).sendUpdates();
    battleStream.omniscient.write(">forcelose p2");
  }
  battleStream.p1.writeEnd();
  battleStream.p2.writeEnd();
  battleStream.omniscient.writeEnd();

  const whiteBattleStreamHandler = async () => {
    const whiteStreamOutput: MatchLog[] = [];
    for await (const chunk of battleStream.p1) {
      if (chunk.includes(POKE_SIMULATOR_TERMINATOR)) {
        if (p1PokemonMove || p2PokemonMove) {
          whiteStreamOutput.length = 0;
        }
      } else {
        const pokemonData: MatchLog = {
          type: "pokemon",
          data: { event: "streamOutput", chunk },
        };
        whiteStreamOutput.push(pokemonData);
      }
    }
    return whiteStreamOutput;
  };
  const blackBattleStreamHandler = async () => {
    const blackStreamOutput: MatchLog[] = [];
    for await (const chunk of battleStream.p2) {
      if (chunk.includes(POKE_SIMULATOR_TERMINATOR)) {
        if (p1PokemonMove || p2PokemonMove) {
          blackStreamOutput.length = 0;
        }
      } else {
        const pokemonData: MatchLog = {
          type: "pokemon",
          data: { event: "streamOutput", chunk },
        };
        blackStreamOutput.push(pokemonData);
      }
    }
    return blackStreamOutput;
  };
  const omniscientBattleStreamHandler = async () => {
    const omniscientStreamOutput: MatchLog[] = [];
    for await (const chunk of battleStream.omniscient) {
      for (const { args } of Protocol.parse(chunk)) {
        if (args[0] !== "win") {
          continue;
        }

        if (gameOptions.weatherWars) {
          const weatherTerrainUpdates = updateWeatherAndTerrainAfterBattle(
            capturedPieceSquare,
            weatherChanges,
            terrainChanges,
            pokemonManager,
          );
          omniscientStreamOutput.push(...weatherTerrainUpdates);
          await onSquareModifiersUpdate();
        }

        const attackerWon =
          (advantageSide === "p1" && args[1] === whitePlayerId) ||
          (advantageSide === "p2" && args[1] === blackPlayerId);

        const victorOutput = updateVictorAfterBattle(
          attackerWon,
          advantageSide,
        );
        omniscientStreamOutput.push(...victorOutput);

        const chessUpdates = await updateChessStakesAfterBattle({
          battleSquare: capturedPieceSquare,
          attackerWon,
          chessManager,
          currentPokemonBattleStakes,
          currentTurn: advantageSide === "p1" ? "w" : "b",
          onMoveChessPiece,
          onGameEnd,
          onRemoveChessPiece,
        });
        omniscientStreamOutput.push(...chessUpdates);
      }
    }
    return omniscientStreamOutput;
  };
  const [whiteStream, blackStream, omniscientStream] = await Promise.all([
    whiteBattleStreamHandler(),
    blackBattleStreamHandler(),
    omniscientBattleStreamHandler(),
  ]);
  return {
    whiteStream,
    blackStream,
    omniscientStream,
  };
};

const updateWeatherAndTerrainAfterBattle = (
  battleSquare: Square,
  weatherChanges: WeatherId | "unset",
  terrainChanges: TerrainId | "unset",
  pokemonManager: PokemonBattleChessManager,
): MatchLog[] => {
  const weatherTerrainOutput: MatchLog[] = [];
  pokemonManager.tickSquareModifiers(battleSquare);

  if (weatherChanges !== undefined || terrainChanges !== undefined) {
    pokemonManager.updateSquareWeather(battleSquare, weatherChanges);
    pokemonManager.updateSquareTerrain(battleSquare, terrainChanges);
  }
  const squareMod = pokemonManager.getModifiersFromSquare(battleSquare);
  if (
    squareMod &&
    (squareMod.modifiers.weather || squareMod.modifiers.terrain)
  ) {
    const squareModifierData: MatchLog = {
      type: "weather",
      data: {
        event: "weatherChange",
        modifier: {
          type: "modify",
          squareModifiers: [squareMod],
        },
      },
    };
    weatherTerrainOutput.push(JSON.parse(JSON.stringify(squareModifierData)));
  } else {
    const squareModifierData: MatchLog = {
      type: "weather",
      data: {
        event: "weatherChange",
        modifier: {
          type: "remove",
          squares: [battleSquare],
        },
      },
    };
    weatherTerrainOutput.push(JSON.parse(JSON.stringify(squareModifierData)));
  }
  return weatherTerrainOutput;
};

const updateVictorAfterBattle = (
  attackerWon: boolean,
  advantageSide: "p1" | "p2",
): MatchLog[] => {
  const victorOutput: MatchLog[] = [];
  if (attackerWon) {
    const data: MatchLog = {
      type: "pokemon",
      data: {
        event: "victory",
        color: advantageSide === "p1" ? "w" : "b",
      },
    };
    victorOutput.push(data);
  } else {
    const data: MatchLog = {
      type: "pokemon",
      data: {
        event: "victory",
        color: advantageSide === "p1" ? "b" : "w",
      },
    };
    victorOutput.push(data);
  }
  return victorOutput;
};

const updateChessStakesAfterBattle = async ({
  battleSquare,
  attackerWon,
  chessManager,
  currentPokemonBattleStakes,
  currentTurn,
  onMoveChessPiece,
  onGameEnd,
  onRemoveChessPiece,
}: {
  battleSquare: Square;
  attackerWon: boolean;
  chessManager: Chess;
  currentPokemonBattleStakes: { san: string; color: Color } | null;
  currentTurn: Color;
  onMoveChessPiece: (move: Move) => Promise<void>;
  onGameEnd: (winner: Color) => Promise<void>;
  onRemoveChessPiece: (move: Move) => Promise<void>;
}): Promise<MatchLog[]> => {
  const chessOutput: MatchLog[] = [];
  const chessMove = chessManager
    .moves({ verbose: true, continueOnCheck: true })
    .find((move) => move.san === currentPokemonBattleStakes?.san);

  if (attackerWon && chessMove && currentPokemonBattleStakes) {
    const lostPiece = chessManager.get(battleSquare);
    await onMoveChessPiece(chessMove);
    const chessData: MatchLog = {
      type: "chess",
      data: {
        color: currentTurn,
        san: currentPokemonBattleStakes.san,
        failed: false,
      },
    };
    chessOutput.push(chessData);
    if (lostPiece?.type === "k") {
      const gameData: MatchLog = {
        type: "generic",
        data: {
          event: "gameEnd",
          color: currentTurn,
          reason: "KING_CAPTURED",
        },
      };
      chessOutput.push(gameData);
      await onGameEnd(currentTurn);
    }
  } else if (chessMove && currentPokemonBattleStakes) {
    const lostPiece = chessManager.get(chessMove.from);
    await onRemoveChessPiece(chessMove);
    const chessData: MatchLog = {
      type: "chess",
      data: {
        color: currentTurn,
        san: currentPokemonBattleStakes.san,
        failed: true,
      },
    };
    chessOutput.push(chessData);
    if (lostPiece?.type === "k") {
      const gameData: MatchLog = {
        type: "generic",
        data: {
          event: "gameEnd",
          color: currentTurn === "w" ? "b" : "w",
          reason: "KING_CAPTURED",
        },
      };
      chessOutput.push(gameData);
      await onGameEnd(currentTurn === "w" ? "b" : "w");
    }
  }

  return chessOutput;
};
