import { useState, useEffect } from "react";
import { PokemonSet } from "@pkmn/data";
import { Battle } from "@pkmn/client";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices from "./PokemonMoveChoices/PokemonMoveChoices";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import './PokemonBattleDisplay.css';

interface PokemonBattleDisplayProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
  battleState: Battle | null,
  battleHistory: string[],
  onMoveSelect: (move: string) => void,
  onP2MoveSelect: (move: string) => void,
}

const PokemonBattleDisplay = ({ p1Pokemon, p2Pokemon, battleState, battleHistory, onMoveSelect, onP2MoveSelect }: PokemonBattleDisplayProps) => {
  const [moveChosen, setMoveChosen] = useState<string>();
  const [moveP2Chosen, setP2MoveChosen] = useState<string>();

  useEffect(() => {
    setMoveChosen(undefined);
    setP2MoveChosen(undefined);
  }, [battleHistory]);

  return (
    <div>
      {battleState && battleState.p1.active[0] && battleState.p2.active[0] && (
        <>
          <div className='battlefieldAndLog'>
            <PokemonBattleField p1Pokemon={battleState.p1.active[0]} p2Pokemon={battleState.p2.active[0]} battleState={battleState}/>
            <PokemonBattleLog battleHistory={battleHistory}/>
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
