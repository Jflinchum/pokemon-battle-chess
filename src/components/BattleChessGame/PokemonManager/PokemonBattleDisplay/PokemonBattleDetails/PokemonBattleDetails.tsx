import { PokemonSet } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import PokemonType from "../../../../common/Pokemon/PokemonType/PokemonType";
import Tooltip from "../../../../common/Tooltip/Tooltip";
import { GenderIcon } from "../../../../common/GenderIcon/GenderIcon";
import './PokemonBattleDetails.css';
import { PokemonMoveTooltip } from "../PokemonMoveTooltip/PokemonMoveTooltip";

interface PokemonBattleDetailsProps {
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
}

export const PokemonBattleDetails = ({ p1PokemonSet, p2PokemonSet }: PokemonBattleDetailsProps) => {
  return (
    <div className='pokemonBattleDetailsContainer'>
      <PokemonBattleDetailsCard pokemonSet={p1PokemonSet} />
      <PokemonBattleDetailsCard pokemonSet={p2PokemonSet} />
    </div>
  );
};

const PokemonBattleDetailsCard = ({ pokemonSet }: { pokemonSet: PokemonSet }) => {
  const dexPokemon = Dex.species.get(pokemonSet.species);

  return (
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
        <Tooltip className='pokemonBattleDetailsCardSetTooltip' anchorSelect={`#ability-${pokemonSet.species.split(' ').join('-')}`}>
          { Dex.abilities.get(pokemonSet.ability).shortDesc }
        </Tooltip>
        <span id={`item-${pokemonSet.species.split(' ').join('-')}`}><strong>Item: </strong>{pokemonSet.item}</span>
        <Tooltip className='pokemonBattleDetailsCardSetTooltip' anchorSelect={`#item-${pokemonSet.species.split(' ').join('-')}`}>
          { Dex.items.get(pokemonSet.item).shortDesc }
        </Tooltip>
        <span>
          <strong>Moves: </strong>
          {
            pokemonSet.moves.map((move, index) => (
              <>
                <span key={index} id={`${move.split(' ').join('-')}-${pokemonSet.species.split(' ').join('-')}`}>
                  {Dex.moves.get(move).name}{index === pokemonSet.moves.length - 1 ? ' ' : ', '}
                </span>
                <Tooltip key={`tooltip-${index}`} className='pokemonBattleDetailsCardSetTooltip' anchorSelect={`#${move.split(' ').join('-')}-${pokemonSet.species.split(' ').join('-')}`}>
                  <PokemonMoveTooltip move={move} />
                </Tooltip>
              </>
            ))
          }
        </span>
      </div>
    </div>
  );
}