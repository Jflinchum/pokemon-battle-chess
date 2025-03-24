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

  return (
    <div>
      {battleState && battleState.p1.active[0] && battleState.p2.active[0] && (
        <>
          <div className='battlefieldAndLog'>
            <PokemonBattleField p1Pokemon={battleState.p1.active[0]} p2Pokemon={battleState.p2.active[0]} battleState={battleState}/>
            <PokemonBattleLog battleHistory={battleHistory}/>
          </div>
          <p>Player 1 Moves</p>
          <PokemonMoveChoices moves={p1Pokemon.moves} onMoveSelect={onMoveSelect}/>
          <p>Player 2 Moves</p>
          <PokemonMoveChoices moves={p2Pokemon.moves} onMoveSelect={onP2MoveSelect}/>
        </>
      )}
    </div>
  )
}

export default PokemonBattleDisplay;
