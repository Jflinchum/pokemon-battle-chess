import { useState, useEffect, useMemo } from "react";
import { Battle } from "@pkmn/client";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices from "./PokemonMoveChoices/PokemonMoveChoices";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import './PokemonBattleDisplay.css';
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";

interface PokemonBattleDisplayProps {
  battleState: Battle | null,
  parsedBattleLog: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
  onMoveSelect: (move: string) => void,
}


const PokemonBattleDisplay = ({ battleState, parsedBattleLog, onMoveSelect }: PokemonBattleDisplayProps) => {
  const [moveChosen, setMoveChosen] = useState<string>();

  useEffect(() => {
    // TODO: Better handling for clearing move selection
    setMoveChosen(undefined);
  }, [parsedBattleLog]);


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
            <PokemonBattleField battleHistory={parsedBattleLog} battleState={battleState}/>
            <div className='battleMoveContainer'>
              <p>Moves</p>
              {moveChosen ? (
                <div>
                  Waiting for opponent...
                  <button className='cancelButton' onClick={() => {
                    setMoveChosen(undefined);
                    onMoveSelect('undo');
                  }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <PokemonMoveChoices moves={moves} onMoveSelect={(move) => {
                  setMoveChosen(move);
                  onMoveSelect(move);
                }}/>
              )}
            </div>
          </div>
            <PokemonBattleLog battleHistory={parsedBattleLog}/>
          </div>
        </>
      )}
    </div>
  )
}

export default PokemonBattleDisplay;
