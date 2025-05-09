import { useMemo } from 'react';
import { Dex } from '@pkmn/dex';
import { PokemonSet, Generations, SideID } from "@pkmn/data";
import { KWArgType } from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import { socket } from '../../../../socket';
import { useUserState } from '../../../../context/UserStateContext';
import { useGameState } from '../../../../context/GameStateContext';
import { CustomArgTypes } from '../../../../../shared/types/PokemonTypes';

interface PokemonBattleManagerProps {
  p1Pokemon: PokemonSet;
  p2Pokemon: PokemonSet;
  currentPokemonMoveHistory: { args: CustomArgTypes; kwArgs: KWArgType }[];
  perspective: SideID;
}


const PokemonBattleManager = ({ p1Pokemon, p2Pokemon, currentPokemonMoveHistory, perspective }: PokemonBattleManagerProps) => {
  const { userState } = useUserState();
  const { gameState } = useGameState();

  // TODO - optimize this so we pass primitives down instead of recreating the class every time
  const battle = useMemo(
    () => {
      const newBattle = new Battle(new Generations(Dex));
      for (const { args, kwArgs } of currentPokemonMoveHistory) {
        // Custom handling for forfeit
        if (args[0] === '-forfeit') {
          const side = args[1];
          if (newBattle[side]?.active[0]?.hp) {
            newBattle[side].active[0].hp = 0;
          }
        } else {
          newBattle.add(args, kwArgs)
        }
      }
      return newBattle;
    }
  , [currentPokemonMoveHistory]);

  return (
    <PokemonBattleDisplay
      battleState={battle}
      fullBattleLog={currentPokemonMoveHistory}
      onMoveSelect={(move) => {
        socket.emit('requestPokemonMove', { pokemonMove: move, roomId: userState.currentRoomId, playerId: userState.id });
      }}
      isSpectator={gameState.isSpectator}
      p1Pokemon={p1Pokemon}
      p2Pokemon={p2Pokemon}
      perspective={perspective}
    />
  )
}

export default PokemonBattleManager;
