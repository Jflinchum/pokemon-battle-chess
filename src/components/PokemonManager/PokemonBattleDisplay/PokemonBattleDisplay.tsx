import { PokemonSet } from "@pkmn/data";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices from "./PokemonMoveChoices/PokemonMoveChoices";
import { Battle } from "@pkmn/client";

interface PokemonBattleDisplayProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
  battleState: Battle | null,
  onMoveSelect: (move: string) => void,
  onP2MoveSelect: (move: string) => void,
}

const PokemonBattleDisplay = ({ p1Pokemon, p2Pokemon, battleState, onMoveSelect, onP2MoveSelect }: PokemonBattleDisplayProps) => {

  return (
    <div>
      {battleState && battleState.p1.active[0] && battleState.p2.active[0] && (
        <>
          <PokemonBattleField p1Pokemon={battleState.p1.active[0]} p2Pokemon={battleState.p2.active[0]} battleState={battleState}/>
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
