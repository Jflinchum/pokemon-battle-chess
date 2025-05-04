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
import { WeatherId, TerrainId } from '../../../../../shared/types/PokemonTypes';
import { TerrainName, WeatherName } from '@pkmn/client';
import './PokemonChessDetailsCard.css';
import { useMemo } from 'react';

interface PokemonChessDetailsCardProps {
  pokemon?: PokemonSet | null;
  chessMoveHistory?: ChessData[];
  squareModifier?: SquareModifier;
}

export const getSquareModifierMapping = (condition: WeatherId | TerrainId | WeatherName | TerrainName) => {
  switch (condition.toLowerCase()) {
    case 'electricterrain':
    case 'electric':
      return { label: 'Electric Terrain', desc: 'Boosts the power of Electric type moves by 50% and prevents grounded Pokémon from sleeping.' }
    case 'psychicterrain':
    case 'psychic':
      return { label: 'Psychic Terrain', desc: 'Boosts the power of Psychic type moves by 50% and all grounded Pokémon cannot use priority moves.' }
    case 'grassyterrain':
    case 'grassy':
      return { label: 'Grassy Terrain', desc: 'Boosts the power of Grass type moves by 50% and all grounded Pokémon have 1/16 of their max HP restored every turn.' }
    case 'mistyterrain':
    case 'misty':
      return { label: 'Misty Terrain', desc: 'Decreases the power of Dragon type moves by 50% and all grounded Pokémon cannot be affected by status conditions.' }
    case 'snowscape':
    case 'snow':
      return { label: 'Snow', desc: 'Boosts the Defence of Ice type Pokémon by 50%.' }
    case 'raindance':
    case 'rain':
      return { label: 'Rain', desc: 'Boosts the power of Water type moves by 50% and decreases the power of Fire type moves by 50%.' }
    case 'sandstorm':
    case 'sand':
      return { label: 'Sandstorm', desc: 'All Pokémon on the field are damaged by 1/16 of their max HP at the end of each turn, except Ground, Rock, and Steel. Rock type pokemon get a 50% Special Defense buff.' }
    case 'sunnyday':
    case 'sun':
      return { label: 'Sun', desc: 'Boosts the power of Fire type moves by 50% and decreases the power of Water type moves by 50%.' }
  }
}

const PokemonChessDetailsCard = ({ pokemon, chessMoveHistory = [], squareModifier }: PokemonChessDetailsCardProps) => {
  const squareModArray = useMemo(() => {
    return Object.keys(squareModifier?.modifiers || {}).map((squareMod) => {
      const weatherOrTerrain = squareModifier?.modifiers?.[squareMod as 'weather' | 'terrain'];
      if (weatherOrTerrain) {
        return {
          id: weatherOrTerrain.id,
          duration: weatherOrTerrain.duration
        }
      }
    }).filter((squareMod) => squareMod);
  }, [squareModifier]);

  return (
    <div className='pokemonDetailsContainer'>
      <div className='pokemonDetailsPadding'>
        {
          squareModArray.map((squareMod) => (
            squareMod && (
            <div key={squareMod.id} id={`squareMod-${squareMod.id}`} className='pokemonDetailsSquareModifier'>
              <PokemonWeatherBackground weatherType={squareMod.id} className='detailsCardWeather'/>
              <span>{getSquareModifierMapping(squareMod.id)?.label} - </span>
              <span>{squareMod.duration} turns</span>
              <Tooltip anchorSelect={`#squareMod-${squareMod.id}`}>
                {getSquareModifierMapping(squareMod.id)?.desc}
              </Tooltip>
            </div>
          )))
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
