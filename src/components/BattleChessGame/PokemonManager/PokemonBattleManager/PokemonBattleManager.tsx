import { useEffect, useMemo, useRef, useState } from "react";
import { Dex } from "@pkmn/dex";
import { PokemonSet, Generations, SideID } from "@pkmn/data";
import { KWArgType } from "@pkmn/protocol";
import { Battle, Pokemon, TerrainName, WeatherName } from "@pkmn/client";
import { PRNG } from "@pkmn/sim";
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import {
  CustomArgTypes,
  TerrainId,
  WeatherId,
} from "../../../../../shared/types/PokemonTypes";
import { LogFormatter } from "@pkmn/view";
import { PokemonMoveChoice } from "../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices";

interface PokemonBattleManagerProps {
  prng: PRNG;
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
  currentPokemonMoveHistory: { args: CustomArgTypes; kwArgs: KWArgType }[];
  perspective: SideID;
  demoMode?: boolean;
}

const getWeatherStateFromBattle = (battle: Battle) => {
  if (!battle) {
    return;
  }
  const weatherId =
    battle.field.weather ||
    (Object.keys(battle.field.pseudoWeather)[0] as WeatherId | undefined);

  if (!weatherId) {
    return;
  }

  return {
    id: weatherId,
    turns: battle.field.weatherState.minDuration,
  };
};

const getTerrainStateFromBattle = (battle: Battle) => {
  if (!battle) {
    return;
  }

  const terrainId = battle.field.terrain;

  if (!terrainId) {
    return;
  }

  return {
    id: terrainId,
    turns: battle.field.terrainState.minDuration,
  };
};

const getPokemonMoveChoicesFromBattle = (battle: Battle) => {
  if (
    battle?.request?.requestType === "move" &&
    battle.request.active[0]?.moves
  ) {
    return (
      battle.request.active[0]?.moves.map((move) => {
        // Typescript oddity. The union typings for the request don't match well
        if ("disabled" in move) {
          return move;
        } else {
          return move;
        }
      }) || []
    );
  }
  return [];
};

const PokemonBattleManager = ({
  prng,
  p1PokemonSet,
  p2PokemonSet,
  currentPokemonMoveHistory,
  perspective,
  demoMode,
}: PokemonBattleManagerProps) => {
  const [weatherState, setWeatherState] = useState<
    { id: WeatherName | WeatherId; turns: number } | undefined
  >();
  const [terrainState, setTerrainState] = useState<
    { id: TerrainName | TerrainId; turns: number } | undefined
  >();
  const [p1ActivePokemon, setP1ActivePokemon] = useState<Pokemon | null>(null);
  const [p2ActivePokemon, setP2ActivePokemon] = useState<Pokemon | null>(null);
  const [moves, setMoves] = useState<PokemonMoveChoice[]>([]);

  const currentPokemonMoveHistoryIndex = useRef(0);
  const battle = useMemo(() => {
    const newGeneration = new Generations(Dex);
    const newBattle = new Battle(
      newGeneration,
      null,
      [
        [perspective === "p1" ? p1PokemonSet : p2PokemonSet],
        [perspective === "p1" ? p2PokemonSet : p1PokemonSet],
      ],
      undefined,
    );
    return newBattle;
  }, [p1PokemonSet, p2PokemonSet, perspective]);
  /**
   * If we want to add damage numbers to the battle log, we need to add battle to the formatter here as a parameter
   * The issue is that the formatter doesn't seem to format the damage numbers correctly, likely due to an issue with the order
   * that the battle state and formatter currently operate
   * https://github.com/pkmn/ps/blob/e9c53799548ca8ba182efed51449d56afbb21f03/view/README.md
   */
  const formatter = useMemo(() => new LogFormatter(perspective), [perspective]);

  useEffect(() => {
    for (
      ;
      currentPokemonMoveHistoryIndex.current < currentPokemonMoveHistory.length;
      currentPokemonMoveHistoryIndex.current++
    ) {
      const { args, kwArgs } =
        currentPokemonMoveHistory[currentPokemonMoveHistoryIndex.current];
      // Custom handling for forfeit
      if (args[0] === "-forfeit") {
        const side = args[1];
        if (battle[side]?.active[0]?.hp) {
          battle[side].active[0].hp = 0;
        }
      } else {
        battle.add(args, kwArgs);
      }

      setP1ActivePokemon(
        perspective === "p1" ? battle.p1.active[0] : battle.p2.active[0],
      );
      setP2ActivePokemon(
        perspective === "p1" ? battle.p2.active[0] : battle.p1.active[0],
      );
      setWeatherState(getWeatherStateFromBattle(battle));
      setTerrainState(getTerrainStateFromBattle(battle));
      setMoves(getPokemonMoveChoicesFromBattle(battle));
    }
  }, [battle, currentPokemonMoveHistory, perspective]);

  return (
    <PokemonBattleDisplay
      demoMode={demoMode}
      prng={prng}
      fullBattleLog={currentPokemonMoveHistory}
      moves={moves}
      logFormatter={formatter}
      weatherState={weatherState}
      terrainState={terrainState}
      p1ActivePokemon={p1ActivePokemon}
      p2ActivePokemon={p2ActivePokemon}
      p1PokemonSet={p1PokemonSet}
      p2PokemonSet={p2PokemonSet}
      perspective={perspective}
    />
  );
};

export default PokemonBattleManager;
