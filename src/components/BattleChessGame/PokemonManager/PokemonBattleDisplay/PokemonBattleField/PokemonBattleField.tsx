import { useMemo } from 'react';
import pokemonBattleBackgroundImage from '../../../../../assets/pokemonBattleBackground.png';
import './PokemonBattleField.css';
import { Battle } from "@pkmn/client";
import PokemonFieldSprite from "./PokemonFieldSprite/PokemonFieldSprite";
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";

interface PokemonBattleFieldProps {
  battleState: Battle,
  battleHistory: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
}

const PokemonBattleField = ({ battleState, battleHistory }: PokemonBattleFieldProps) => {
  const p1Pokemon = useMemo(() => battleState.p1.active[0], [battleHistory]);
  const p2Pokemon = useMemo(() => battleState.p2.active[0], [battleHistory]);

  return (
    <div className='pokemonBattleBackground' style={{
      backgroundImage: `url(${pokemonBattleBackgroundImage})`
    }}>
      { p1Pokemon && <PokemonFieldSprite pokemon={p1Pokemon} side='p1' /> }
      { p2Pokemon && <PokemonFieldSprite pokemon={p2Pokemon} side='p2' /> }
    </div>
  )
}

export default PokemonBattleField;
