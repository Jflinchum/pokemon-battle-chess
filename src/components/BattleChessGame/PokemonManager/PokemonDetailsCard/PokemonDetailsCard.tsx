import { PokemonSet } from '@pkmn/data';
import './PokemonDetailsCard.css';
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import PokemonMoveChoices from '../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices';

interface PokemonDetailsCard {
  pokemon?: PokemonSet | null,
}

const PokemonDetailsCard = ({ pokemon }: PokemonDetailsCard) => {

  return (
    <div className='pokemonDetailsContainer'>
      <div className='pokemonDetailsPadding'>
        {
          pokemon ?
          (
            <>
              <p>{pokemon.name}</p>
              <div className='pokemonDetailsCard'>
                <img className='pokemonDetailsSprite' src={Sprites.getPokemon(pokemon.species, { gender: pokemon.gender as GenderName }).url}/>
                <PokemonMoveChoices moves={pokemon.moves.map((move) => ({ id: move }))}/>
                <ul>
                  <li>
                    <span>
                      <b>Item: </b>
                      {pokemon.item || 'None'}
                    </span>
                  </li>
                  <li>
                    <span>
                      <b>Ability: </b>
                      {pokemon.ability || 'None'}
                    </span>
                  </li>
                </ul>
              </div>
            </>
          ) :
          null
        }
      </div>
    </div>
  )
}

export default PokemonDetailsCard;
