import { PokemonSet, TypeName } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import PokemonType from "../../../../common/Pokemon/PokemonType/PokemonType";
import Tooltip from "../../../../common/Tooltip/Tooltip";
import { GenderIcon } from "../../../../common/GenderIcon/GenderIcon";
import { PokemonMoveTooltip } from "../PokemonMoveTooltip/PokemonMoveTooltip";
import './PokemonBattleDetails.css';
import { useMemo } from "react";

interface PokemonBattleDetailsProps {
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
  children: React.ReactNode;
}

export const PokemonBattleDetails = ({ p1PokemonSet, p2PokemonSet, children }: PokemonBattleDetailsProps) => {
  return (
    <div className='pokemonBattleDetailsContainer'>
      <PokemonBattleDetailsCard pokemonSet={p1PokemonSet} />
      <span className='pokemonBattleDetailsChild'>
        {children}
      </span>
      <PokemonBattleDetailsCard pokemonSet={p2PokemonSet} />
    </div>
  );
};

const PokemonBattleDetailsCard = ({ pokemonSet }: { pokemonSet: PokemonSet }) => {
  const dexPokemon = Dex.species.get(pokemonSet.species);

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
      <div className='pokemonBattleDetailsCard'>
        <div className='pokemonBattleDetailsCardSet'>
          <span>
            {
              dexPokemon.types.map((type) => (
                <PokemonType key={type} type={type} className='pokemonBattleDetailsCardSetType' />
              ))
            }
          </span>
          <span className='pokemonBattleDetailsCardName'>
            <span>{pokemonSet.species}</span>
            <GenderIcon gender={pokemonSet.gender} />
            <span>Lv{pokemonSet.level}</span>
          </span>
          <span id={`ability-${pokemonSet.species.split(' ').join('-')}`}><strong>Ability: </strong>{pokemonSet.ability}</span>
          <span id={`item-${pokemonSet.species.split(' ').join('-')}`}><strong>Item: </strong>{pokemonSet.item}</span>
          <span>
            <strong>Moves: </strong>
            {
              pokemonSet.moves.map((move, index) => (
                <span key={index}>
                  <span id={`${move.split(' ').join('-')}-${pokemonSet.species.split(' ').join('-')}`}>
                    {Dex.moves.get(move).name}{index === pokemonSet.moves.length - 1 ? ' ' : ', '}
                  </span>
                </span>
              ))
            }
          </span>
          {
            weaknesses.length > 0 && (
              <span>
                <b>Weaknesses: </b>
                <div>
                  {
                    weaknesses.map((type) => (
                      <PokemonType key={type} type={type as TypeName} className='pokemonBattleDetailsTyping' />
                    ))
                  }
                </div>
              </span>
            )
          }
          {
            resistances.length > 0 && (
              <span>
                <b>Resistances: </b>
                <div>
                  {
                    resistances.map((type) => (
                      <PokemonType key={type} type={type as TypeName} className='pokemonBattleDetailsTyping' />
                    ))
                  }
                </div>
              </span>
            )
          }
          {
            immunities.length > 0 && (
              <span>
                <b>Immunities: </b>
                <div>
                  {
                    immunities.map((type) => (
                      <PokemonType key={type} type={type as TypeName} className='pokemonBattleDetailsTyping' />
                    ))
                  }
                </div>
              </span>
            )
          }
        </div>
      </div>
      {
        pokemonSet.moves.map((move, index) => (
          <Tooltip key={index} className='pokemonBattleDetailsCardSetTooltip' anchorSelect={`#${move.split(' ').join('-')}-${pokemonSet.species.split(' ').join('-')}`}>
            <PokemonMoveTooltip move={move} />
          </Tooltip>
        ))
      }
      <Tooltip className='pokemonBattleDetailsCardSetTooltip' anchorSelect={`#ability-${pokemonSet.species.split(' ').join('-')}`}>
        { Dex.abilities.get(pokemonSet.ability).shortDesc }
      </Tooltip>
      <Tooltip className='pokemonBattleDetailsCardSetTooltip' anchorSelect={`#item-${pokemonSet.species.split(' ').join('-')}`}>
        { Dex.items.get(pokemonSet.item).shortDesc }
      </Tooltip>
    </>
  );
}