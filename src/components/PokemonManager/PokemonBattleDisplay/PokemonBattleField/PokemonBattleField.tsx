import { Pokemon } from "@pkmn/client";
import pokemonBattleBackgroundImage from '../../../../assets/pokemonBattleBackground.png';
import './PokemonBattleField.css';
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import { Battle } from "@pkmn/client";

interface PokemonBattleFieldProps {
  p1Pokemon: Pokemon,
  p2Pokemon: Pokemon,
  battleState: Battle,
}

const getHealthBarColor = (maxHp: number, currentHp: number) => {
  const percentage = (maxHp/currentHp) * 100;
  if (percentage > 60) {
    return 'green';
  } else if (percentage > 25) {
    return 'yellow';
  } else {
    return 'red';
  }
}

const PokemonBattleField = ({ p1Pokemon, p2Pokemon }: PokemonBattleFieldProps) => {

  return (
    <div className='pokemonBattleBackground' style={{
      backgroundImage: `url(${pokemonBattleBackgroundImage})`
    }}>
      <div className='player1Pokemon'>
        <p className='pokemonHealth'>{p1Pokemon.hp}/{p1Pokemon.maxhp}</p>
        <progress className='healthbar' style={{ accentColor: getHealthBarColor(p1Pokemon.maxhp, p1Pokemon.hp) }} max={p1Pokemon.maxhp} value={p1Pokemon.hp}></progress>
        <img className='pokemonSprite player1PokemonSprite' src={Sprites.getPokemon(p1Pokemon.baseSpeciesForme, { gender: p1Pokemon.gender as GenderName, side: 'p1' }).url}/>
      </div>
      <div className='player2Pokemon'>
        <p className='pokemonHealth'>{p2Pokemon.hp}/{p2Pokemon.maxhp}</p>
        <progress className='healthbar' style={{ accentColor: getHealthBarColor(p2Pokemon.maxhp, p2Pokemon.hp) }} max={p2Pokemon.maxhp} value={p2Pokemon.hp}></progress>
        <img className='pokemonSprite player2PokemonSprite' src={Sprites.getPokemon(p2Pokemon.baseSpeciesForme, { gender: p2Pokemon.gender as GenderName }).url}/>
      </div>
    </div>
  )
}

export default PokemonBattleField;
