import { useMemo } from 'react';
import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";
import { PokemonSet } from '@pkmn/data';
import pokemonBattleBackgroundImage from '../../../../../assets/pokemonBattleBackground.png';
import './PokemonBattleField.css';
import PokemonFieldSprite from "./PokemonFieldSprite/PokemonFieldSprite";

interface PokemonBattleFieldProps {
  battleState: Battle,
  battleHistory: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
  p1PokemonSet: PokemonSet,
  p2PokemonSet: PokemonSet,
}

const PokemonBattleField = ({ battleState, battleHistory, p1PokemonSet, p2PokemonSet }: PokemonBattleFieldProps) => {
  const p1Pokemon = useMemo(() => battleState.p1.active[0], [battleHistory]);
  const p2Pokemon = useMemo(() => battleState.p2.active[0], [battleHistory]);
  return (
    <div className='pokemonBattleBackground' style={{
      backgroundImage: `url(${pokemonBattleBackgroundImage})`
    }}>
      { p1Pokemon && <PokemonFieldSprite pokemon={p1Pokemon} set={p1PokemonSet} side='p1' /> }
      { p2Pokemon && <PokemonFieldSprite pokemon={p2Pokemon} set={p2PokemonSet} side='p2' /> }
    </div>
  )
}

export default PokemonBattleField;
