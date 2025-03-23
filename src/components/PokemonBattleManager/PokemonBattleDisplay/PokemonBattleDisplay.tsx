import { PokemonSet } from "@pkmn/data";
import pokemonBattleBackgroundImage from '../../../assets/pokemonBattleBackground.png';

interface PokemonBattleDisplayProps {
  player1Pokemon: PokemonSet,
  player2Pokemon: PokemonSet,
}

const PokemonBattleDisplay = ({ player1Pokemon, player2Pokemon }: PokemonBattleDisplayProps) => {
  debugger;

  return (
    <div className='pokemonBattleDisplay' style={{
      backgroundImage: `url(${pokemonBattleBackgroundImage})`
    }}>
    </div>
  )
}

export default PokemonBattleDisplay;
