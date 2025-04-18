import { useEffect, useMemo, useState, useRef } from 'react';
import { Dex } from '@pkmn/dex';
import { PokemonSet, Generations } from "@pkmn/data";
import { ArgType, BattleArgsKWArgType, KWArgType, Protocol } from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import { socket } from '../../../../socket';
import { useUserState } from '../../../../context/UserStateContext';
import { useGameState } from '../../../../context/GameStateContext';
import { timer } from './../../../../utils';

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

  const battleOver = useRef(false);

  const battle = useMemo(() => (new Battle(new Generations(Dex))), []);

  const [parsedBattleLog, setParsedBattleLog] = useState<{ args: ArgType, kwArgs: BattleArgsKWArgType }[]>([])
  const [delayedBattleLog, setDelayedBattleLog] = useState<{ args: ArgType, kwArgs: BattleArgsKWArgType }[]>([])
  const battleLogIndex = useRef(0);

  useEffect(() => {
    let delayTimer: { start: () => Promise<void>, stop: () => void } | undefined;
    const iterateOverLog = async () => {
      if (parsedBattleLog.length > 0) {
        while (battleLogIndex.current < parsedBattleLog.length) {
          const { args, kwArgs } = parsedBattleLog[battleLogIndex.current];
          battle?.add(args, kwArgs);
          setDelayedBattleLog((curr) => [...curr, { args, kwArgs }]);
          battleLogIndex.current += 1;
          if (shouldDelayBeforeContinuing(args[0])) {
            delayTimer = timer(1000 * (gameState.isSkippingAhead ? 0 : 1));
            await delayTimer.start();
          }
        }
      }
    }
    iterateOverLog();

    return () => {
      delayTimer?.stop();
    };
  }, [parsedBattleLog, gameState.isSkippingAhead]);

  useEffect(() => {
    const parsedMoveHistory = [];
    for (const chunk of currentPokemonMoveHistory) {
      for (const { args, kwArgs } of Protocol.parse(chunk)) {
        console.log(args);
        if (args[0] === 'win') {
          battleOver.current = true;
        }
        parsedMoveHistory.push({ args, kwArgs });
      }
    }
    setParsedBattleLog(parsedMoveHistory)

  }, [currentPokemonMoveHistory]);

  return (
    <>
      <PokemonBattleDisplay
        battleState={battle}
        fullBattleLog={parsedBattleLog}
        delayedBattleLog={delayedBattleLog}
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
