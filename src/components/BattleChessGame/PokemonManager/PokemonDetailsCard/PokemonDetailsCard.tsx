import { PokemonSet } from '@pkmn/data';
import './PokemonDetailsCard.css';
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import PokemonMoveChoices from '../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices';
import { Dex } from '@pkmn/dex';
import { speciesOverride } from '../../ChessManager/util';
import PokemonType from '../../../common/Pokemon/PokemonType/PokemonType';

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
              <p>
                {
                  Dex.species.get(pokemon.species).types.map((type, index) => (
                    <PokemonType className='pokemonDetailsTyping' type={type} key={index} />
                  ))
                }
              </p>
              <div className='pokemonDetailsCard'>
                <img className='pokemonDetailsSprite' src={Sprites.getPokemon(speciesOverride(pokemon.species), { gender: pokemon.gender as GenderName }).url}/>
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
