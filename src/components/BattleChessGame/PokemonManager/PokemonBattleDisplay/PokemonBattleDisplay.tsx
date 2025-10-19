import { Battle, Pokemon, TerrainName, WeatherName } from "@pkmn/client";
import { PokemonSet, SideID } from "@pkmn/data";
import { BattleArgsKWArgType } from "@pkmn/protocol";
import { PRNG } from "@pkmn/sim";
import { LogFormatter } from "@pkmn/view";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  CustomArgTypes,
  TerrainId,
  WeatherId,
} from "../../../../../shared/types/PokemonTypes";
import { useGameState } from "../../../../context/GameState/GameStateContext";
import { useSocketRequests } from "../../../../util/useSocketRequests";
import "./PokemonBattleDisplay.css";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import PokemonMoveChoices, {
  PokemonMoveChoice,
} from "./PokemonMoveChoices/PokemonMoveChoices";

interface PokemonBattleDisplayProps {
  fullBattleLog: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType }[];
  weatherState?: {
    id: WeatherName | WeatherId;
    turns: number;
  };
  terrainState?: {
    id: TerrainName | TerrainId;
    turns: number;
  };
  pseudoWeatherState?: Battle["field"]["pseudoWeather"];
  p1ActivePokemon: Pokemon | null;
  p2ActivePokemon: Pokemon | null;
  moves: PokemonMoveChoice[];
  logFormatter: LogFormatter;
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
  perspective: SideID;
  demoMode?: boolean;
  prng: PRNG;
}

const PokemonBattleDisplay = ({
  fullBattleLog,
  moves,
  logFormatter,
  weatherState,
  terrainState,
  pseudoWeatherState,
  p1ActivePokemon,
  p2ActivePokemon,
  p1PokemonSet,
  p2PokemonSet,
  perspective,
  demoMode,
  prng,
}: PokemonBattleDisplayProps) => {
  const { gameState } = useGameState();
  const [moveChosen, setMoveChosen] = useState<string>();
  const { requestPokemonMove } = useSocketRequests();

  useEffect(() => {
    // TODO: Better handling for clearing move selection
    setMoveChosen(undefined);
  }, [fullBattleLog]);

  const handleMoveSelect = async (move: string) => {
    try {
      await requestPokemonMove(move);
    } catch (err) {
      setMoveChosen(undefined);
      toast(`Error: ${err}. Please reselect your move`, { type: "error" });
    }
  };

  return (
    <div className="battlefieldAndLog">
      <span className="battleContainer">
        <PokemonBattleField
          prng={prng}
          battleHistory={fullBattleLog}
          logFormatter={logFormatter}
          p1ActivePokemon={p1ActivePokemon}
          p2ActivePokemon={p2ActivePokemon}
          weatherState={weatherState}
          terrainState={terrainState}
          pseudoWeatherState={pseudoWeatherState}
          p1PokemonSet={p1PokemonSet}
          p2PokemonSet={p2PokemonSet}
        />
        <PokemonBattleLog
          battleHistory={fullBattleLog}
          logFormatter={logFormatter}
          simple={true}
          perspective={perspective}
        />
        {!demoMode && (
          <div className="battleMoveContainer">
            <BattleMoveContainer
              hideMoves={
                !["turn", "request"].includes(
                  fullBattleLog[fullBattleLog.length - 1]?.args?.[0],
                ) ||
                fullBattleLog.some((log) => log.args[0] === "win") ||
                gameState.isSpectator ||
                gameState.isCatchingUp
              }
              moveChosen={moveChosen}
              onMoveSelect={handleMoveSelect}
              setMoveChosen={setMoveChosen}
              moves={moves}
              currentPokemon={p1ActivePokemon}
              opponentPokemon={p2ActivePokemon}
            />
          </div>
        )}
      </span>
      <PokemonBattleLog
        battleHistory={fullBattleLog}
        logFormatter={logFormatter}
        perspective={perspective}
      />
    </div>
  );
};

interface BattleMoveContainerProps {
  moveChosen?: string;
  hideMoves: boolean;
  setMoveChosen: (move?: string) => void;
  onMoveSelect: (move: string) => void;
  moves: PokemonMoveChoice[];
  currentPokemon?: Pokemon | null;
  opponentPokemon?: Pokemon | null;
}

const BattleMoveContainer = ({
  moveChosen,
  setMoveChosen,
  onMoveSelect,
  moves,
  hideMoves,
  currentPokemon,
  opponentPokemon,
}: BattleMoveContainerProps) => {
  if (hideMoves) {
    return <></>;
  } else if (moveChosen) {
    return (
      <div>
        Waiting for opponent...
        <button
          className="cancelButton"
          onClick={() => {
            setMoveChosen(undefined);
            onMoveSelect("undo");
          }}
        >
          Cancel
        </button>
      </div>
    );
  } else {
    return (
      <>
        <button
          onClick={() => {
            onMoveSelect("forfeit");
          }}
        >
          Forfeit this battle
        </button>
        <p>Moves</p>
        <PokemonMoveChoices
          currentPokemon={currentPokemon}
          opponentPokemon={opponentPokemon}
          moves={moves}
          onMoveSelect={(move) => {
            setMoveChosen(move);
            onMoveSelect(move);
          }}
        />
      </>
    );
  }
};

export default PokemonBattleDisplay;
