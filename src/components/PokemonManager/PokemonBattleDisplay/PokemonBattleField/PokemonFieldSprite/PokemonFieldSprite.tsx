import { Pokemon } from "@pkmn/client";
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import ProgressBar from "../../../../common/ProgressBar/ProgressBar";
import './PokemonFieldSprite.css';

interface PokemonFieldSpriteProps {
  pokemon: Pokemon,
  side: 'p1' | 'p2',
}

const getHealthBarColor = (maxHp: number, currentHp: number) => {
  const percentage = (currentHp/maxHp) * 100;
  if (percentage > 60) {
    return 'green';
  } else if (percentage > 25) {
    return 'yellow';
  } else {
    return 'red';
  }
}

const getGenderSymbol = (gender: GenderName) => {
  switch (gender) {
    case ('M'): return '♂️';
    case ('F'): return '♀️';
    case ('N'): return '';
  }
}

const PokemonFieldSprite = ({ pokemon, side }: PokemonFieldSpriteProps) => {

  return (
    <div className={`${side}Pokemon`}>
      <div className='pokemonSpriteInfo'>
        <div className='pokemonDetails'>
          <span>{pokemon.name}</span>
          <span className="pokemonGender">{getGenderSymbol(pokemon.gender)}</span>
          <span className='pokemonLevel'>Lv{pokemon.level}</span>
        </div>
        <div className='pokemonHealth'>
          <ProgressBar className='pokemonHealthProgress' filled={Math.round((pokemon.hp/pokemon.maxhp)*1000)/10} color={getHealthBarColor(pokemon.maxhp, pokemon.hp)}/>
          <span>{Math.round((pokemon.hp/pokemon.maxhp)*1000)/10}%</span>
        </div>
      </div>
      <img className={`pokemonSprite ${side}PokemonSprite`} src={Sprites.getPokemon(pokemon.baseSpeciesForme, { gender: pokemon.gender as GenderName, side }).url}/>
    </div>
  )
}

export default PokemonFieldSprite;
