import { PokemonSet } from "@pkmn/data";
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";

interface PokemonBattleManagerProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
}

const PokemonBattleManager = ({ p1Pokemon, p2Pokemon }: PokemonBattleManagerProps) => {

  return (
    <div>
      <PokemonBattleDisplay p1Pokemon={p1Pokemon} p2Pokemon={p2Pokemon}/>
    </div>
  )
}

export default PokemonBattleManager;
