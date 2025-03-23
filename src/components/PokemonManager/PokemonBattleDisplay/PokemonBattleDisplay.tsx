import { PokemonSet } from "@pkmn/data";
import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import PokemonMoveChoices from "./PokemonMoveChoices/PokemonMoveChoices";

interface PokemonBattleDisplayProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
  onMoveSelect: (move: string) => void,
  onP2MoveSelect: (move: string) => void,
}

const PokemonBattleDisplay = ({ p1Pokemon, p2Pokemon, onMoveSelect, onP2MoveSelect }: PokemonBattleDisplayProps) => {

  return (
    <div>
      <PokemonBattleField p1Pokemon={p1Pokemon} p2Pokemon={p2Pokemon}/>
      <p>Player 1 Moves</p>
      <PokemonMoveChoices moves={p1Pokemon.moves} onMoveSelect={onMoveSelect}/>
      <p>Player 2 Moves</p>
      <PokemonMoveChoices moves={p2Pokemon.moves} onMoveSelect={onP2MoveSelect}/>
    </div>
  )
}

export default PokemonBattleDisplay;
