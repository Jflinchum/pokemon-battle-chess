import { Pokemon } from "@pkmn/client";
import pokemonBattleBackgroundImage from '../../../../../assets/pokemonBattleBackground.png';
import './PokemonBattleField.css';
import { Battle } from "@pkmn/client";
import PokemonFieldSprite from "./PokemonFieldSprite/PokemonFieldSprite";

interface PokemonBattleFieldProps {
  p1Pokemon: Pokemon,
  p2Pokemon: Pokemon,
  battleState: Battle,
}

const PokemonBattleField = ({ p1Pokemon, p2Pokemon }: PokemonBattleFieldProps) => {

  return (
    <div className='pokemonBattleBackground' style={{
      backgroundImage: `url(${pokemonBattleBackgroundImage})`
    }}>
      <PokemonFieldSprite pokemon={p1Pokemon} side='p1' />
      <PokemonFieldSprite pokemon={p2Pokemon} side='p2' />
    </div>
  )
}

export default PokemonBattleField;
