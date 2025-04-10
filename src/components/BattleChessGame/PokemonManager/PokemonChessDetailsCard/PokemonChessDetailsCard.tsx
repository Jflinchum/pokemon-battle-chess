import { PokemonSet } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import PokemonMoveChoices from '../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices';
import { speciesOverride } from '../../ChessManager/util';
import PokemonType from '../../../common/Pokemon/PokemonType/PokemonType';
import './PokemonChessDetailsCard.css';
import ChessMoveHistory from '../../ChessManager/ChessMoveHistory/ChessMoveHistory';

interface PokemonChessDetailsCardProps {
  pokemon?: PokemonSet | null;
  chessMoveHistory: { sanMove: string, battleSuccess: boolean | null }[];
}

const PokemonChessDetailsCard = ({ pokemon, chessMoveHistory }: PokemonChessDetailsCardProps) => {

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
          ) : (
          <div className='pokemonDetailsChessMoveHistory'>
            <ChessMoveHistory chessMoveHistory={chessMoveHistory} />
          </div>
          )
        }
      </div>
    </div>
  )
}

export default PokemonChessDetailsCard;
