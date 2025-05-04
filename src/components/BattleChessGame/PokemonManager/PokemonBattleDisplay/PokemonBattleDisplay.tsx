import { useState, useEffect, useMemo } from "react";
import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";
import { PokemonSet } from "@pkmn/data";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices, { PokemonMoveChoice } from "./PokemonMoveChoices/PokemonMoveChoices";
import PokemonBattleLog from "./PokemonBattleLog/PokemonBattleLog";
import './PokemonBattleDisplay.css';

interface PokemonBattleDisplayProps {
  battleState: Battle | null,
  fullBattleLog: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
  onMoveSelect: (move: string) => void,
  isSpectator?: boolean;
  p1Pokemon: PokemonSet;
  p2Pokemon: PokemonSet;
}

const PokemonBattleDisplay = ({ battleState, fullBattleLog, onMoveSelect, isSpectator, p1Pokemon, p2Pokemon }: PokemonBattleDisplayProps) => {
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
  }, [battleState?.request, fullBattleLog]);

  return (
    <div>
      {battleState && (
        <>
          <div className='battlefieldAndLog'>
            <span className='battleContainer'>
              <PokemonBattleField battleHistory={fullBattleLog} battleState={battleState} p1PokemonSet={p1Pokemon} p2PokemonSet={p2Pokemon}/>
              <PokemonBattleLog battleHistory={fullBattleLog} simple={true}/>
              <div className='battleMoveContainer'>
                <BattleMoveContainer
                  hideMoves={
                    !['turn', 'request'].includes(fullBattleLog[fullBattleLog.length - 1]?.args?.[0]) || fullBattleLog.some((log) => log.args[0] === 'win')
                  }
                  moveChosen={moveChosen}
                  onMoveSelect={onMoveSelect}
                  setMoveChosen={setMoveChosen}
                  moves={moves}
                  isSpectator={isSpectator}
                />
              </div>
            </span>
            <PokemonBattleLog battleHistory={fullBattleLog}/>
          </div>
        </>
      )}
    </div>
  )
}

interface BattleMoveContainerProps {
  moveChosen?: string;
  hideMoves: boolean;
  isSpectator?: boolean;
  setMoveChosen: (move?: string) => void;
  onMoveSelect: (move: string) => void;
  moves: PokemonMoveChoice[];
}

const BattleMoveContainer = ({ moveChosen, setMoveChosen, onMoveSelect, moves, hideMoves, isSpectator }: BattleMoveContainerProps) => {

  if (hideMoves || isSpectator) {
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
