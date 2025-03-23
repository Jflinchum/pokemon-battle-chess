import { PokemonSet } from "@pkmn/data";
import pokemonBattleBackgroundImage from '../../../../assets/pokemonBattleBackground.png';
import './PokemonBattleField.css';
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";

interface PokemonBattleFieldProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
}

const PokemonBattleField = ({ p1Pokemon, p2Pokemon }: PokemonBattleFieldProps) => {

  return (
    <div className='pokemonBattleBackground' style={{
      backgroundImage: `url(${pokemonBattleBackgroundImage})`
    }}>
      <img className='player1PokemonSprite' src={Sprites.getPokemon(p1Pokemon.species, { gender: p1Pokemon.gender as GenderName, side: 'p1' }).url}/>
      <img className='player2PokemonSprite' src={Sprites.getPokemon(p2Pokemon.species, { gender: p2Pokemon.gender as GenderName }).url}/>
    </div>
  )
}

export default PokemonBattleField;
