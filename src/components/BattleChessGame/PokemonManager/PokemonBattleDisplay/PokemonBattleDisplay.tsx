import { useState, useEffect, useMemo } from "react";
import { Battle, Pokemon } from "@pkmn/client";
import { BattleArgsKWArgType } from "@pkmn/protocol";
import { PokemonSet, SideID } from "@pkmn/data";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices, {
  PokemonMoveChoice,
} from "./PokemonMoveChoices/PokemonMoveChoices";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import { CustomArgTypes } from "../../../../../shared/types/PokemonTypes";
import { useGameState } from "../../../../context/GameState/GameStateContext";
import { PokemonBattleDetails } from "./PokemonBattleDetails/PokemonBattleDetails";
import { useSocketRequests } from "../../../../util/useSocketRequests";
import "./PokemonBattleDisplay.css";

interface PokemonBattleDisplayProps {
  battleState: Battle | null;
  fullBattleLog: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType }[];
  p1Pokemon: PokemonSet;
  p2Pokemon: PokemonSet;
  perspective: SideID;
}

const PokemonBattleDisplay = ({
  battleState,
  fullBattleLog,
  p1Pokemon,
  p2Pokemon,
  perspective,
}: PokemonBattleDisplayProps) => {
  const { gameState } = useGameState();
  const [moveChosen, setMoveChosen] = useState<string>();
  const { requestPokemonMove } = useSocketRequests();

  useEffect(() => {
    // TODO: Better handling for clearing move selection
    setMoveChosen(undefined);
  }, [fullBattleLog]);

  const handleMoveSelect = (move: string) => {
    requestPokemonMove(move, (err) => {
      if (err) {
        setMoveChosen(undefined);
        // display error toast notification
      }
    });
  };

  const moves = useMemo(() => {
    if (
      battleState?.request?.requestType === "move" &&
      battleState.request.active[0]?.moves
    ) {
      return (
        battleState.request.active[0]?.moves.map((move) => {
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
  }, [battleState?.request]);

  return (
    <div>
      {battleState && (
        <>
          <div className="battlefieldAndLog">
            <span className="battleContainer">
              <PokemonBattleDetails
                p1Pokemon={battleState.p1.active[0]}
                p2Pokemon={battleState.p2.active[0]}
              >
                <PokemonBattleField
                  battleHistory={fullBattleLog}
                  battleState={battleState}
                  p1PokemonSet={p1Pokemon}
                  p2PokemonSet={p2Pokemon}
                />
              </PokemonBattleDetails>
              <PokemonBattleLog
                battleHistory={fullBattleLog}
                simple={true}
                battleState={battleState}
                perspective={perspective}
              />
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
                  currentPokemon={
                    battleState[perspective === "p1" ? "p1" : "p2"].active[0]
                  }
                  opponentPokemon={
                    battleState[perspective === "p1" ? "p2" : "p1"].active[0]
                  }
                />
              </div>
            </span>
            <PokemonBattleLog
              battleHistory={fullBattleLog}
              battleState={battleState}
              perspective={perspective}
            />
          </div>
        </>
      )}
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
    return <div></div>;
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
