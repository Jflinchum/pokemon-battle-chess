import { useMemo } from 'react';
import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";
import { PokemonSet } from '@pkmn/data';
import pokemonBattleBackgroundImage from '../../../../../assets/pokemonBattleBackground.png';
import PokemonFieldSprite from "./PokemonFieldSprite/PokemonFieldSprite";
import { useGameState } from '../../../../../context/GameStateContext';
import { PokemonWeatherBackground } from '../../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground';
import { WeatherId } from '../../../../../../shared/types/PokemonTypes';
import { PokemonBattleConditions } from './PokemonBattleCondition/PokemonBattleConditions';
import './PokemonBattleField.css';

interface PokemonBattleFieldProps {
  battleState: Battle,
  battleHistory: { args: ArgType, kwArgs: BattleArgsKWArgType }[],
  p1PokemonSet: PokemonSet,
  p2PokemonSet: PokemonSet,
}

const PokemonBattleField = ({ battleState, battleHistory, p1PokemonSet, p2PokemonSet }: PokemonBattleFieldProps) => {
  const { gameState } = useGameState();
  const p1Pokemon = useMemo(() => gameState.gameSettings.color === 'w' ? battleState.p1.active[0] : battleState.p2.active[0], [battleHistory]);
  const p2Pokemon = useMemo(() => gameState.gameSettings.color === 'w' ? battleState.p2.active[0] : battleState.p1.active[0], [battleHistory]);

  return (
    <div className='pokemonBattleBackground' style={{
      backgroundImage: `url(${pokemonBattleBackgroundImage})`
    }}>
      <PokemonWeatherBackground weatherType={battleState.field.weather || (Object.keys(battleState.field.pseudoWeather)[0] as WeatherId)} />
      <PokemonWeatherBackground weatherType={battleState.field.terrain} />
      <PokemonBattleConditions battleField={battleState.field} />
      { p1Pokemon && <PokemonFieldSprite pokemon={p1Pokemon} set={p1PokemonSet} side='p1' /> }
      { p2Pokemon && <PokemonFieldSprite pokemon={p2Pokemon} set={p2PokemonSet} side='p2' /> }
    </div>
  )
}

export default PokemonBattleField;
