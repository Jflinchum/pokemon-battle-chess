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
import { GenderIcon } from '../../../common/GenderIcon/GenderIcon';
import { SquareModifier } from '../../../../../shared/models/PokemonBattleChessManager';
import { PokemonWeatherBackground } from '../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground';
import './PokemonChessDetailsCard.css';

interface PokemonChessDetailsCardProps {
  pokemon?: PokemonSet | null;
  chessMoveHistory?: ChessData[];
  squareModifier?: SquareModifier;
}

const squareModifierMapping: Record<SquareModifier['modifier'], { label: string, desc: string }> = {
  'sandstorm': { label: 'Sandstorm', desc: 'All Pokémon on the field are damaged by 1/16 of their max HP at the end of each turn, except Ground, Rock, and Steel. Rock type pokemon get a 50% Special Defense buff.' },
  'sunnyday': { label: 'Sunny', desc: 'Boosts the power of Fire type moves by 50% and decreases the power of Water type moves by 50%.' },
  'raindance': { label: 'Rain', desc: 'Boosts the power of Water type moves by 50% and decreases the power of Fire type moves by 50%.' },
  'snowscape': { label: 'Snowy Weather', desc: 'Boosts the Defence of Ice type Pokémon by 50%.' },
  'electricterrain': { label: 'Electric Terrain', desc: 'Boosts the power of Electric type moves by 50% and prevents grounded Pokémon from sleeping.' },
  'grassyterrain': { label: 'Grassy Terrain', desc: 'Boosts the power of Grass type moves by 50% and all grounded Pokémon have 1/16 of their max HP restored every turn.' },
  'psychicterrain': { label: 'Psychic Terrain', desc: 'Boosts the power of Psychic type moves by 50% and all grounded Pokémon cannot use priority moves.' },
  'mistyterrain': { label: 'Misty Terrain', desc: 'Decreases the power of Dragon type moves by 50% and all grounded Pokémon cannot be affected by status conditions.' },
}

const PokemonChessDetailsCard = ({ pokemon, chessMoveHistory = [], squareModifier }: PokemonChessDetailsCardProps) => {

  return (
    <div className='pokemonDetailsContainer'>
      <div className='pokemonDetailsPadding'>
        {
          squareModifier && (
            <div id='pokemonDetailsModifier' className='pokemonDetailsSquareModifier'>
              <PokemonWeatherBackground weatherType={squareModifier.modifier} className='detailsCardWeather'/>
              <span>{squareModifierMapping[squareModifier.modifier].label} - </span>
              <span>{squareModifier.duration} turns remaining</span>
              <Tooltip anchorSelect={'#pokemonDetailsModifier'}>
                { squareModifierMapping[squareModifier.modifier].desc }
              </Tooltip>
            </div>
          )
        }
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
