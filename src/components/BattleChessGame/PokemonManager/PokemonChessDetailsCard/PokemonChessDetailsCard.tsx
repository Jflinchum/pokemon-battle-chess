import { useMemo } from 'react';
import { TerrainName, WeatherName } from '@pkmn/client';
import { PokemonSet, TypeName } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Icons } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import PokemonMoveChoices from '../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices';
import PokemonType from '../../../common/Pokemon/PokemonType/PokemonType';
import ChessMoveHistory from '../../ChessManager/ChessMoveHistory/ChessMoveHistory';
import Tooltip from '../../../common/Tooltip/Tooltip';
import { ChessData } from '../../../../../shared/types/game';
import { GenderIcon } from '../../../common/GenderIcon/GenderIcon';
import { SquareModifier } from '../../../../../shared/models/PokemonBattleChessManager';
import { PokemonWeatherBackground } from '../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground';
import { WeatherId, TerrainId } from '../../../../../shared/types/PokemonTypes';
import { PokemonSprite } from '../../../common/Pokemon/PokemonSprite/PokemonSprite';
import './PokemonChessDetailsCard.css';

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
  const dexPokemon = useMemo(() => (
    pokemon ? Dex.species.get(pokemon.species) : null
  ), [pokemon]);

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

  const { weaknesses, resistances, immunities } = useMemo(() => {
    const weaknesses: TypeName[] = [];
    const resistances: TypeName[] = [];
    const immunities: TypeName[] = [];
    if (!dexPokemon) {
      return { weaknesses, resistances, immunities };
    }
    Dex.types.names().map((type) => {
      const notImmune = Dex.getImmunity(type, dexPokemon.types);
      const typeModifier = Dex.getEffectiveness(type, dexPokemon.types);
      if (!notImmune) {
        immunities.push(type as TypeName);
      }
      if (notImmune && typeModifier > 0) {
        weaknesses.push(type as TypeName);
      }
      if (notImmune && typeModifier < 0) {
        resistances.push(type as TypeName);
      }
    });
    return { weaknesses, resistances, immunities };
  }, [dexPokemon]);

  return (
    <>
      <div className='pokemonDetailsContainer'>
        <div className='pokemonDetailsPadding'>
          <div className='pokemonDetailsTitle'>
            <div>
              {
                squareModArray.map((squareMod) => (
                  squareMod && (
                  <div key={squareMod.id} id={`squareMod-${squareMod.id}`} className='pokemonDetailsSquareModifier'>
                    <PokemonWeatherBackground weatherType={squareMod.id} className='detailsCardWeather'/>
                    <span>{getSquareModifierMapping(squareMod.id)?.label} - {squareMod.duration} turns</span>
                  </div>
                )))
              }
            </div>
            {
              pokemon && (
                <div className='pokemonDetailsIdentifierAndType'>
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
                </div>
              )
            }
          </div>
          {
            pokemon && dexPokemon ?
            (
              <>
                <div className='pokemonDetailsCard'>
                  <div>
                    <div className='pokemonDetailsSpriteContainer'>
                      <PokemonSprite className='pokemonDetailsSprite' pokemonIdentifier={pokemon.species} gender={pokemon.gender as GenderName} shiny={pokemon.shiny} />
                    </div>
                    <PokemonMoveChoices moves={pokemon.moves.map((move) => ({ id: move }))}/>
                  </div>
                  <ul>
                    <li>
                      <span>
                        <b>Item: </b>
                        <div id={`${pokemon.item.split(' ').join('-')}`} className='pokemonDetailsItemContainer'>
                          { pokemon.item && <div style={Icons.getItem(pokemon.item).css} /> }
                          <span>{pokemon.item || 'None'}</span>
                        </div>
                      </span>
                    </li>
                    <li>
                      <span>
                        <b>Ability: </b>
                        <div id={`${pokemon.ability.split(' ').join('-')}`}>
                          <span>{pokemon.ability || 'None'}</span>
                        </div>
                      </span>
                    </li>
                    {
                      weaknesses.length > 0 && (
                        <li>
                          <b>Weaknesses: </b>
                          <div>
                            {
                              weaknesses.map((type) => (
                                <PokemonType key={type} type={type as TypeName} className='pokemonDetailsTyping' />
                              ))
                            }
                          </div>
                        </li>
                      )
                    }
                    {
                      resistances.length > 0 && (
                        <li>
                          <b>Resistances: </b>
                          <div>
                            {
                              resistances.map((type) => (
                                <PokemonType key={type} type={type as TypeName} className='pokemonDetailsTyping' />
                              ))
                            }
                          </div>
                        </li>
                      )
                    }
                    {
                      immunities.length > 0 && (
                        <li>
                          <b>Immunities: </b>
                          <div>
                            {
                              immunities.map((type) => (
                                <PokemonType key={type} type={type as TypeName} className='pokemonDetailsTyping' />
                              ))
                            }
                          </div>
                        </li>
                      )
                    }
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
    {
      // Necessary to render this outside of above div to prevent tooltips from scrolling the container
      pokemon ? (
        <>
          <Tooltip anchorSelect={`#${pokemon.ability.split(' ').join('-')}`}>
            { Dex.abilities.get(pokemon.ability).shortDesc }
          </Tooltip>
          <Tooltip anchorSelect={`#${pokemon.item.split(' ').join('-')}`}>
            { Dex.items.get(pokemon.item).shortDesc }
          </Tooltip>
          {
            squareModArray.map((squareMod) => (
              squareMod ? 
                <Tooltip anchorSelect={`#squareMod-${squareMod.id}`}>
                  {getSquareModifierMapping(squareMod.id)?.desc}
                </Tooltip>
              : null
            ))
          }
        </>
      ) : null
    }
    </>
  )
}

export default PokemonChessDetailsCard;
