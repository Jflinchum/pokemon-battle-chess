import { Move as DexMove } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import { Color, Square } from "chess.js";
import { PokemonBattleChessManager } from "../../../../../../shared/models/PokemonBattleChessManager";
import {
  TerrainId,
  WeatherId,
} from "../../../../../../shared/types/PokemonTypes";
import {
  doesMoveDoDamage,
  getTypeEffectiveness,
  modifyTypeAbilities,
} from "../../../../../util/pokemonUtil";
import { PokemonCpu } from "../cpuFactory";
import {
  doesItemSynergizeWithMove,
  getDraftOptions,
  getHighestBst,
  getMoveSynergiesWithTerrain,
  getMoveSynergiesWithWeather,
  isFakeoutEffective,
  isHealingEffective,
  isPriorityMoveEffective,
  isScreenEffective,
  isSetupEffective,
  isStatusEffective,
  isWishProtectEffective,
} from "./pokemonGreedyHelper";

type PokemonCpuFactory = ({
  randomEffectiveMoves,
  enableDefensiveStrategies,
  enableItemSynergies,
  enableWeatherAndTerrainConsiderations,
  enablePriority,
}: {
  randomEffectiveMoves: boolean;
  enableDefensiveStrategies: boolean;
  enableItemSynergies: boolean;
  enableWeatherAndTerrainConsiderations: boolean;
  enablePriority: boolean;
  enableSetup: boolean;
}) => () => PokemonCpu;

export const pokemonCpuFactory: PokemonCpuFactory =
  ({
    randomEffectiveMoves,
    enableDefensiveStrategies,
    enableItemSynergies,
    enableWeatherAndTerrainConsiderations,
    enablePriority,
    enableSetup,
  }) =>
  () => {
    return {
      banPokemon: (pokemonManager: PokemonBattleChessManager): number => {
        return getHighestBst(pokemonManager.draftPieces)?.index || 0;
      },
      draftPokemon: (
        color: Color,
        pokemonManager: PokemonBattleChessManager,
      ): { square: Square; index: number; color: Color } => {
        // const currentDraftedPieces = pokemonManager.chessPieces.filter(
        //   (piece) => piece.color === color,
        // );
        // const opponentDraftedPieces = pokemonManager.chessPieces.filter(
        //   (piece) => piece.color === (color === "w" ? "b" : "w"),
        // );
        const draftSquareOptions = getDraftOptions(color, pokemonManager);
        const highestBstPiece = getHighestBst(pokemonManager.draftPieces);

        let highestPrioritySquare: { square: Square; priority: number } = {
          square: "a1",
          priority: -Infinity,
        };
        draftSquareOptions.forEach((draftOption) => {
          if (draftOption.priority > highestPrioritySquare.priority) {
            highestPrioritySquare = draftOption;
          }
        });

        return {
          square: highestPrioritySquare.square,
          index: highestBstPiece?.index || 0,
          color,
        };
      },
      move: async (playerSide, battle) =>
        new Promise((resolve) => {
          const botSide = battle.getSide(playerSide);
          const botPokemon = botSide.active[0]!;
          const opponentSide = botSide.foe;
          const opponentPokemon = opponentSide.active[0]!;

          if (battle.request?.requestType !== "move") {
            console.error(
              "Something went wrong! Could not find cpu pokemon set",
            );
            return resolve("forfeit");
          }

          const availablePokemonMoves = battle.request.active[0]?.moves
            .filter((move) => !("disabled" in move) || move.disabled === false)
            .map((move) => Dex.moves.get(move.id));

          if (!availablePokemonMoves || !availablePokemonMoves.length) {
            console.error(
              "Something went wrong! Could not find cpu pokemon set",
            );
            return resolve("forfeit");
          }

          const moveGreedyEvaluation = (
            move: DexMove,
          ): { priority: number; move: DexMove } => {
            /**
             * Random strategy should just randomly select moves that can
             * hit the opponent
             */
            if (
              randomEffectiveMoves &&
              getTypeEffectiveness(move, botPokemon, opponentPokemon).notImmune
            ) {
              return {
                priority: 1,
                move,
              };
            }

            if (
              battle.turn === 1 &&
              isFakeoutEffective(move, botPokemon, opponentPokemon) &&
              battle.field.terrainState.id !== "psychicterrain"
            ) {
              return {
                priority: 10,
                move,
              };
            }

            if (
              enableDefensiveStrategies &&
              isWishProtectEffective(move, botSide)
            ) {
              return {
                priority: 10,
                move,
              };
            }

            if (
              enableDefensiveStrategies &&
              !Object.keys(botSide.sideConditions).length &&
              isScreenEffective(move, opponentPokemon)
            ) {
              return {
                priority: 9,
                move,
              };
            }

            if (
              enableDefensiveStrategies &&
              isStatusEffective(move, opponentPokemon)
            ) {
              return {
                priority: 8,
                move,
              };
            }

            if (
              enableDefensiveStrategies &&
              isHealingEffective(move, botPokemon)
            ) {
              return {
                priority: 7,
                move,
              };
            }

            if (
              enableItemSynergies &&
              doesItemSynergizeWithMove(move, botPokemon)
            ) {
              return {
                priority: 6,
                move,
              };
            }

            if (enableSetup && isSetupEffective(move, botPokemon)) {
              return {
                priority: 5,
                move,
              };
            }

            /**
             * Consider damaging moves
             *
             * Consider charge moves
             * Consider recharge on move
             * Consider stab moves
             * Consider super effective moves
             */
            let damagingMovePriority = 0;
            const { effectiveness, notImmune } = getTypeEffectiveness(
              move,
              botPokemon,
              opponentPokemon,
            );

            if (move.flags.charge && botPokemon.item !== "powerherb") {
              damagingMovePriority -= 1;
            }

            if (move.flags.recharge) {
              damagingMovePriority -= 1;
            }

            if (
              enablePriority &&
              isPriorityMoveEffective(move, battle, opponentPokemon)
            ) {
              damagingMovePriority += 3;
            }

            if (enableWeatherAndTerrainConsiderations) {
              damagingMovePriority += getMoveSynergiesWithWeather(
                move,
                battle.field.weatherState.id as WeatherId,
              );

              damagingMovePriority += getMoveSynergiesWithTerrain(
                move,
                battle.field.terrainState.id as TerrainId,
              );
            }

            const abilityModifier =
              modifyTypeAbilities[botPokemon.set?.ability.toLowerCase() || ""];
            const type = abilityModifier
              ? abilityModifier({
                  move,
                  terastallized: botPokemon.terastallized,
                  holdItem: botPokemon.item,
                })
              : move.type;
            if (
              doesMoveDoDamage(move) &&
              botPokemon.types.includes(type) &&
              notImmune
            ) {
              damagingMovePriority += 1;
            }

            if (doesMoveDoDamage(move) && notImmune) {
              damagingMovePriority += effectiveness;
            }

            if (
              move.basePower <= 60 &&
              botPokemon.ability !== "technician" &&
              !move.multihit
            ) {
              damagingMovePriority -= 1;
            }
            return {
              priority: damagingMovePriority,
              move,
            };
          };

          let highestPriority = -Infinity;
          const prioritizations = availablePokemonMoves.map((move) => {
            const evalResult = moveGreedyEvaluation(move);
            if (evalResult.priority > highestPriority) {
              highestPriority = evalResult.priority;
            }
            return evalResult;
          });
          console.log(prioritizations);

          if (randomEffectiveMoves) {
            const effectiveMoves = prioritizations.filter(
              (move) => move.priority === 1,
            );
            const randomMove =
              effectiveMoves[Math.floor(Math.random() * effectiveMoves.length)];

            if (randomMove) {
              return resolve(randomMove.move.id);
            }
          } else {
            // Choose a random move amongst the highest priority moves
            const highestPriorityMoves = prioritizations.filter(
              (evaluations) => evaluations.priority === highestPriority,
            );

            const highestPriorityMove =
              highestPriorityMoves[
                Math.floor(Math.random() * highestPriorityMoves.length)
              ].move.id;

            if (highestPriorityMove) {
              return resolve(highestPriorityMove);
            }
          }

          return resolve(
            availablePokemonMoves[
              Math.floor(Math.random() * availablePokemonMoves.length)
            ].name,
          );
        }),
    };
  };
