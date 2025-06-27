import { useEffect, useMemo, useRef, useState } from "react";
import { Dex } from "@pkmn/dex";
import { PokemonSet, Generations, SideID } from "@pkmn/data";
import { KWArgType } from "@pkmn/protocol";
import { Battle, Pokemon, TerrainName, WeatherName } from "@pkmn/client";
import { PRNG } from "@pkmn/sim";
import { LogFormatter } from "@pkmn/view";
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import {
  CustomArgTypes,
  TerrainId,
  WeatherId,
} from "../../../../../shared/types/PokemonTypes";
import { PokemonMoveChoice } from "../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices";
import { useUserState } from "../../../../context/UserState/UserStateContext";
import { useGameState } from "../../../../context/GameState/GameStateContext";
import { timer } from "../../../../utils";
import { usePokemonAudioFx } from "./usePokemonAudioFx";

interface PokemonBattleManagerProps {
  prng: PRNG;
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
  currentPokemonMoveHistory: { args: CustomArgTypes; kwArgs: KWArgType }[];
  perspective: SideID;
  demoMode?: boolean;
  onBattleEnd: () => void;
}

const PokemonBattleManager = ({
  prng,
  p1PokemonSet,
  p2PokemonSet,
  currentPokemonMoveHistory,
  perspective,
  demoMode,
  onBattleEnd,
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
  const { userState } = useUserState();
  const { gameState } = useGameState();

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
  const playAudioEffect = usePokemonAudioFx({
    p1PokemonSpecies:
      perspective === "p1" ? p1PokemonSet["species"] : p2PokemonSet["species"],
    p2PokemonSpecies:
      perspective === "p1" ? p2PokemonSet["species"] : p1PokemonSet["species"],
  });

  useEffect(() => {
    let catchUpTimer:
      | { start: () => Promise<void>; stop: () => void }
      | undefined;

    const skipToEndOfSync = gameState.isSkippingAhead;
    const timeBetweenSteps =
      userState.animationSpeedPreference * (skipToEndOfSync ? 0 : 1);

    const playMoveHistory = async () => {
      while (
        currentPokemonMoveHistoryIndex.current <
        currentPokemonMoveHistory.length
      ) {
        const { args, kwArgs } =
          currentPokemonMoveHistory[currentPokemonMoveHistoryIndex.current];

        let previousArgs;
        if (currentPokemonMoveHistoryIndex.current > 0) {
          previousArgs =
            currentPokemonMoveHistory[
              currentPokemonMoveHistoryIndex.current - 1
            ].args;
        }
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
        currentPokemonMoveHistoryIndex.current++;

        if (!gameState.isSkippingAhead) {
          playAudioEffect({ args, kwArgs }, { args: previousArgs });
          if (shouldDelayBeforeContinuing(args[0])) {
            catchUpTimer = timer(timeBetweenSteps * (skipToEndOfSync ? 0 : 1));
            await catchUpTimer.start();
          }
        }

        if (args[0] === "win") {
          onBattleEnd();
        }
      }
    };

    playMoveHistory();

    return () => {
      catchUpTimer?.stop();
    };
  }, [
    battle,
    currentPokemonMoveHistory,
    perspective,
    gameState.isSkippingAhead,
    onBattleEnd,
    userState.animationSpeedPreference,
  ]);

  return (
    <PokemonBattleDisplay
      demoMode={demoMode}
      prng={prng}
      fullBattleLog={currentPokemonMoveHistory.slice(
        0,
        currentPokemonMoveHistoryIndex.current,
      )}
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

const shouldDelayBeforeContinuing = (logType: CustomArgTypes[0]) => {
  const delayLogs: CustomArgTypes[0][] = [
    "player",
    "move",
    "faint",
    "switch",
    "-damage",
    "-heal",
    "-forfeit",
    "-boost",
    "-unboost",
    "-setboost",
    "-weather",
    "-activate",
    "-enditem",
  ];
  if (delayLogs.includes(logType)) {
    return true;
  }
  return false;
};

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

export default PokemonBattleManager;
