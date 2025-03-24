import { useState, useEffect, useRef } from "react";
import { PokemonSet } from "@pkmn/data";
import { Battle } from "@pkmn/client";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices from "./PokemonMoveChoices/PokemonMoveChoices";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import './PokemonBattleDisplay.css';
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";

interface PokemonBattleDisplayProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
  battleState: Battle | null,
  parsedBattleLog: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
  onMoveSelect: (move: string) => void,
  onP2MoveSelect: (move: string) => void,
}

const wait = async (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms)
  });
}

const shouldDelayBeforeContinuing = (logType: string) => {
  const delayLogs = ['move', '-damage', '-heal'];
  if (delayLogs.includes(logType)) {
    return true;
  }
  return false;
}

const PokemonBattleDisplay = ({ p1Pokemon, p2Pokemon, battleState, parsedBattleLog, onMoveSelect, onP2MoveSelect }: PokemonBattleDisplayProps) => {
  const [moveChosen, setMoveChosen] = useState<string>();
  const [moveP2Chosen, setP2MoveChosen] = useState<string>();
  const battleLogIndex = useRef(0);

  useEffect(() => {
    // TODO: Better handling for clearing move selection
    setMoveChosen(undefined);
    setP2MoveChosen(undefined);
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
            <p>Player 1 Moves</p>
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
            <p>Player 2 Moves</p>
            {moveP2Chosen ? (
              <div>
                Waiting for opponent...
                <button className='cancelButton' onClick={() => {
                  setP2MoveChosen(undefined);
                  onP2MoveSelect('undo');
                }}>
                  Cancel
                </button>
              </div>
            ) : (
              <PokemonMoveChoices moves={p2Pokemon.moves} onMoveSelect={(move) => {
                setP2MoveChosen(move);
                onP2MoveSelect(move);
              }}/>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PokemonBattleDisplay;
