import PokemonBattleField from "./PokemonBattleField/PokemonBattleField";
import { PokemonSet } from "@pkmn/data";
import PokemonMoveChoices from "./PokemonMoveChoices/PokemonMoveChoices";

interface PokemonBattleDisplayProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
}

const PokemonBattleDisplay = ({ p1Pokemon, p2Pokemon }: PokemonBattleDisplayProps) => {

  return (
    <div>
      <PokemonBattleField p1Pokemon={p1Pokemon} p2Pokemon={p2Pokemon}/>
      <PokemonMoveChoices moves={p1Pokemon.moves} onMoveSelect={() => {}}/>
    </div>
  )
}

export default PokemonBattleDisplay;
