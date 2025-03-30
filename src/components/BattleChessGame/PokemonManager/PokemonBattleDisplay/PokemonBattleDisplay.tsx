import { useState, useEffect, useMemo } from "react";
import { Battle } from "@pkmn/client";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices, { PokemonMoveChoice } from "./PokemonMoveChoices/PokemonMoveChoices";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import './PokemonBattleDisplay.css';
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";

interface PokemonBattleDisplayProps {
  battleState: Battle | null,
  fullBattleLog: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
  delayedBattleLog: { args: ArgType, kwArgs: BattleArgsKWArgType }[], 
  onMoveSelect: (move: string) => void,
}


const PokemonBattleDisplay = ({ battleState, fullBattleLog, delayedBattleLog, onMoveSelect }: PokemonBattleDisplayProps) => {
  const [moveChosen, setMoveChosen] = useState<string>();

  useEffect(() => {
    // TODO: Better handling for clearing move selection
    setMoveChosen(undefined);
  }, [fullBattleLog]);


  const moves = useMemo(() => {
    if (battleState?.request?.requestType === 'move' && battleState.request.active[0]?.moves) {
      return battleState.request.active[0]?.moves.map((move) => {
        // Typescript oddity. The union typings for the request don't match well
        if ('disabled' in move) {
          return move;
        } else {
          return move;
        }
      }) || [];
    }
    return [];
  }, [battleState?.request]);

  return (
    <div>
      {battleState && (
        <>
          <div className='battlefieldAndLog'>
            <div>
              <PokemonBattleField battleHistory={delayedBattleLog} battleState={battleState}/>
              <PokemonBattleLog battleHistory={delayedBattleLog} simple={true}/>
              <div className='battleMoveContainer'>
                <BattleMoveContainer
                  waitForDelay={
                    (delayedBattleLog.length !== fullBattleLog.length) ||
                    fullBattleLog.some((log) => log.args[0] === 'win')
                  }
                  moveChosen={moveChosen}
                  onMoveSelect={onMoveSelect}
                  setMoveChosen={setMoveChosen}
                  moves={moves}
                  />
              </div>
            </div>
            <PokemonBattleLog battleHistory={delayedBattleLog}/>
          </div>
        </>
      )}
    </div>
  )
}

interface BattleMoveContainerProps {
  moveChosen?: string;
  waitForDelay: boolean;
  setMoveChosen: (move?: string) => void;
  onMoveSelect: (move: string) => void;
  moves: PokemonMoveChoice[];
}

const BattleMoveContainer = ({ moveChosen, setMoveChosen, onMoveSelect, moves, waitForDelay }: BattleMoveContainerProps) => {

  if (waitForDelay) {
    return (
      <div></div>
    );
  } else if (moveChosen) {
    return (
      <div>
        Waiting for opponent...
        <button className='cancelButton' onClick={() => {
          setMoveChosen(undefined);
          onMoveSelect('undo');
        }}>
          Cancel
        </button>
      </div>
    )
  } else {
    return (
      <>
        <p>Moves</p>
        <PokemonMoveChoices moves={moves} onMoveSelect={(move) => {
          setMoveChosen(move);
          onMoveSelect(move);
        }}/>
      </>
    )
  }
}

export default PokemonBattleDisplay;
