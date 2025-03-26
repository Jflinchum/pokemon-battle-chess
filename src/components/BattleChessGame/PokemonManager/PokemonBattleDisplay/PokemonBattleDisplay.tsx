import { useState, useEffect } from "react";
import { PokemonSet } from "@pkmn/data";
import { Battle } from "@pkmn/client";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices from "./PokemonMoveChoices/PokemonMoveChoices";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import './PokemonBattleDisplay.css';
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";

interface PokemonBattleDisplayProps {
  p1Pokemon: PokemonSet,
  battleState: Battle | null,
  parsedBattleLog: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
  onMoveSelect: (move: string) => void,
}


const PokemonBattleDisplay = ({ p1Pokemon, battleState, parsedBattleLog, onMoveSelect }: PokemonBattleDisplayProps) => {
  const [moveChosen, setMoveChosen] = useState<string>();

  useEffect(() => {
    // TODO: Better handling for clearing move selection
    setMoveChosen(undefined);
  }, [parsedBattleLog]);

  return (
    <div>
      {battleState && (
        <>
          <div className='battlefieldAndLog'>
            <PokemonBattleField battleHistory={parsedBattleLog} battleState={battleState}/>
            <PokemonBattleLog battleHistory={parsedBattleLog}/>
          </div>
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
              <PokemonMoveChoices moves={p1Pokemon.moves} onMoveSelect={(move) => {
                setMoveChosen(move);
                onMoveSelect(move);
              }}/>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PokemonBattleDisplay;
