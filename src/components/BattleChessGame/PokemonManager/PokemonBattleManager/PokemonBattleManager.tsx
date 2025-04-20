import { useMemo } from 'react';
import { Dex } from '@pkmn/dex';
import { PokemonSet, Generations } from "@pkmn/data";
import { ArgType, KWArgType } from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import { socket } from '../../../../socket';
import { useUserState } from '../../../../context/UserStateContext';
import { useGameState } from '../../../../context/GameStateContext';

interface PokemonBattleManagerProps {
  p1Name: string;
  p2Name: string;
  p1Pokemon: PokemonSet;
  p2Pokemon: PokemonSet;
  currentPokemonMoveHistory: { args: ArgType; kwArgs: KWArgType }[];
}


const PokemonBattleManager = ({ p1Pokemon, p2Pokemon, currentPokemonMoveHistory }: PokemonBattleManagerProps) => {
  const { userState } = useUserState();
  const { gameState } = useGameState();

  // TODO - optimize this so we pass primitives down instead of recreating the class every time
  const battle = useMemo(
    () => {
      const newBattle = new Battle(new Generations(Dex));
      for (const { args, kwArgs } of currentPokemonMoveHistory) {
        newBattle.add(args, kwArgs)
      }
      return newBattle;
    }
  , [currentPokemonMoveHistory]);

  return (
    <>
      <PokemonBattleDisplay
        battleState={battle}
        fullBattleLog={currentPokemonMoveHistory}
        onMoveSelect={(move) => {
          socket.emit('requestPokemonMove', { pokemonMove: move, roomId: userState.currentRoomId, playerId: userState.id });
        }}
        isSpectator={gameState.players.find((player) => player.playerId === userState.id)?.isSpectator}
        p1Pokemon={p1Pokemon}
        p2Pokemon={p2Pokemon}
      />
    </>
  )
}

export default PokemonBattleManager;
