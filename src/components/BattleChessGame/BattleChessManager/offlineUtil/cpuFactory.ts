import { Battle } from "@pkmn/client";
import { Chess, Color, Move, Square } from "chess.js";
import { PokemonBattleChessManager } from "../../../../../shared/models/PokemonBattleChessManager";
import stockfishWorker from "../../../../assets/stockfishMin/stockfish-17.1-8e4d048.js?url";
import { cpuDifficultyLevels } from "../../../../util/offlineUtil";
import { chessCpuFactory } from "./chessCpu/chessCpuFactory";
import { pokemonCpuFactory } from "./pokemonCpu/pokemonCpuFactory";

export type ChessCpu = {
  move: (
    chessManager: Chess,
    pokemonManager: PokemonBattleChessManager,
  ) => Promise<Move>;
};
export type PokemonCpu = {
  banPokemon: (pokemonManager: PokemonBattleChessManager) => number;
  draftPokemon: (
    color: Color,
    pokemonManager: PokemonBattleChessManager,
  ) => { square: Square; index: number; color: Color };
  move: (playerSide: "p1" | "p2", battle: Battle) => Promise<string>;
};
type BotLevels = Record<
  (typeof cpuDifficultyLevels)[number],
  { chessCpu: () => ChessCpu; pokemonCpu: () => PokemonCpu }
>;

export const availableBotLevels: BotLevels = {
  Easy: {
    chessCpu: chessCpuFactory({
      file: stockfishWorker,
      skillLevel: 1,
      depth: 10,
      multiPVLevel: 1,
    }),
    pokemonCpu: pokemonCpuFactory({
      randomEffectiveMoves: true,
      enableWeatherAndTerrainConsiderations: false,
      enableDefensiveStrategies: false,
      enableItemSynergies: false,
      enablePriority: false,
      enableSetup: false,
    }),
  },
  Medium: {
    chessCpu: chessCpuFactory({
      file: stockfishWorker,
      skillLevel: 10,
      depth: 10,
      multiPVLevel: 3,
    }),
    pokemonCpu: pokemonCpuFactory({
      randomEffectiveMoves: false,
      enableWeatherAndTerrainConsiderations: true,
      enableDefensiveStrategies: false,
      enableItemSynergies: false,
      enablePriority: false,
      enableSetup: false,
    }),
  },
  Hard: {
    chessCpu: chessCpuFactory({
      file: stockfishWorker,
      skillLevel: 20,
      depth: 10,
      multiPVLevel: 5,
    }),
    pokemonCpu: pokemonCpuFactory({
      randomEffectiveMoves: false,
      enableDefensiveStrategies: true,
      enableItemSynergies: true,
      enableWeatherAndTerrainConsiderations: true,
      enablePriority: true,
      enableSetup: true,
    }),
  },
};
