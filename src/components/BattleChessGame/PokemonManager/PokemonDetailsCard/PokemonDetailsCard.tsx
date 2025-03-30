import { PokemonSet } from '@pkmn/data';
import './PokemonDetailsCard.css';
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import PokemonMoveChoices from '../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices';

interface PokemonDetailsCard {
  pokemon?: PokemonSet,
}

const PokemonDetailsCard = ({ pokemon }: PokemonDetailsCard) => {

  return (
    <div className='pokemonDetailsContainer'>
      {
        pokemon ?
        (
          <>
            <p>{pokemon.name}</p>
            <img className='pokemonDetailsSprite' src={Sprites.getPokemon(pokemon.species, { gender: pokemon.gender as GenderName }).url}/>
            <PokemonMoveChoices moves={pokemon.moves.map((move) => ({ id: move }))}/>
            <p>Item: {pokemon.item}</p> 
            <p>Ability: {pokemon.ability}</p>
          </>
        ) :
        null
      }
    </div>
  )
}

export default PokemonDetailsCard;
