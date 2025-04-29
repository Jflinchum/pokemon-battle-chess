import { PokemonSet } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Sprites, Icons } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import PokemonMoveChoices from '../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices';
import { speciesOverride } from '../../ChessManager/util';
import PokemonType from '../../../common/Pokemon/PokemonType/PokemonType';
import ChessMoveHistory from '../../ChessManager/ChessMoveHistory/ChessMoveHistory';
import Tooltip from '../../../common/Tooltip/Tooltip';
import { ChessData } from '../../../../../shared/types/game';
import './PokemonChessDetailsCard.css';
import { GenderIcon } from '../../../common/GenderIcon/GenderIcon';

interface PokemonChessDetailsCardProps {
  pokemon?: PokemonSet | null;
  chessMoveHistory?: ChessData[];
}

const PokemonChessDetailsCard = ({ pokemon, chessMoveHistory = [] }: PokemonChessDetailsCardProps) => {

  return (
    <div className='pokemonDetailsContainer'>
      <div className='pokemonDetailsPadding'>
        {
          pokemon ?
          (
            <>
              <p className='pokemonDetailsIdentifier'>
                <span>{pokemon.name}</span>
                <GenderIcon gender={pokemon.gender} />
                <span>Lv{pokemon.level}</span>
              </p>
              <div className='pokemonDetailsTypingContainer'>
                {
                  Dex.species.get(pokemon.species).types.map((type) => (
                    <PokemonType className='pokemonDetailsTyping' type={type} key={type} />
                  ))
                }
              </div>
              <div className='pokemonDetailsCard'>
                <div className='pokemonDetailsSpriteContainer'>
                  <img className='pokemonDetailsSprite' src={Sprites.getPokemon(speciesOverride(pokemon.species), { gender: pokemon.gender as GenderName }).url}/>
                </div>
                <PokemonMoveChoices moves={pokemon.moves.map((move) => ({ id: move }))}/>
                <ul>
                  <li>
                    <span>
                      <b>Item: </b>
                      <div id={`${pokemon.item.split(' ').join('-')}`} className='pokemonDetailsItemContainer'>
                        { pokemon.item && <div style={Icons.getItem(pokemon.item).css} /> }
                        <span>{pokemon.item || 'None'}</span>
                        <Tooltip anchorSelect={`#${pokemon.item.split(' ').join('-')}`}>
                          { Dex.items.get(pokemon.item).shortDesc }
                        </Tooltip>
                      </div>
                    </span>
                  </li>
                  <li>
                    <span>
                      <b>Ability: </b>
                      <div id={`${pokemon.ability.split(' ').join('-')}`}>
                        <span>{pokemon.ability || 'None'}</span>
                        <Tooltip anchorSelect={`#${pokemon.ability.split(' ').join('-')}`}>
                          { Dex.abilities.get(pokemon.ability).shortDesc }
                        </Tooltip>
                      </div>
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
