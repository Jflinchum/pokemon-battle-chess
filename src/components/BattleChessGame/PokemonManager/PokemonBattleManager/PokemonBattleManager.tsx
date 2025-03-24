import { useEffect, useMemo, useState, useRef } from 'react';
import { BattleStreams, Teams } from '@pkmn/sim';
import { PokemonSet, Generations } from "@pkmn/data";
import { Dex } from '@pkmn/dex';
import { ArgType, BattleArgsKWArgType, Protocol } from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import './PokemonBattleManager.css';

interface PokemonBattleManagerProps {
  p1Name: string,
  p2Name: string,
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
  onVictory: (victor: string) => void,
}

const wait = async (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms)
  });
}

const shouldDelayBeforeContinuing = (logType: string) => {
  const delayLogs = ['move', '-damage', '-heal', 'win'];
  if (delayLogs.includes(logType)) {
    return true;
  }
  return false;
}

const PokemonBattleManager = ({ p1Name, p2Name, p1Pokemon, p2Pokemon, onVictory }: PokemonBattleManagerProps) => {
  /**
   * TODO:
   * - UI show status on pokemon
   * - On Hover in battle, show pokemon in depth details
   * - Pokemon Details Card
   */
  const battleStream = useMemo(() => (BattleStreams.getPlayerStreams(new BattleStreams.BattleStream())), []);
  const battle = useMemo(() => (new Battle(new Generations(Dex))), []);
  const spec = { formatid: 'gen9customgame' };
  const p1spec = { name: p1Name, team: Teams.pack([p1Pokemon]) };
  const p2spec = { name: p2Name, team: Teams.pack([p2Pokemon]) };

  const [parsedBattleLog, setParsedBattleLog] = useState<{ args: ArgType, kwArgs: BattleArgsKWArgType }[]>([])
  const [delayedBattleLog, setDelayedBattledLog] = useState<{ args: ArgType, kwArgs: BattleArgsKWArgType }[]>([])
  const battleLogIndex = useRef(0);

  const beginBattleStreamHandler = async () => {
    for await (const chunk of battleStream.omniscient) {
      for (const { args, kwArgs } of Protocol.parse(chunk)) {
        console.log(args);
        setParsedBattleLog((curr) => [...curr, { args, kwArgs }]);
      }
    }
  }

  useEffect(() => {
    const iterateOverLog = async () => {
      if (parsedBattleLog.length > 0) {
        while (battleLogIndex.current < parsedBattleLog.length) {
          const { args, kwArgs } = parsedBattleLog[battleLogIndex.current];
          battle?.add(args, kwArgs);
          setDelayedBattledLog((curr) => [...curr, { args, kwArgs }]);
          battleLogIndex.current += 1;
          if (shouldDelayBeforeContinuing(args[0])) {
            await wait(1000);
          }
          if (args[0] === 'win') {
            onVictory(args[1]);
            return;
          }
        }
      }
    }
    iterateOverLog();
  }, [parsedBattleLog])

  useEffect(() => {
    beginBattleStreamHandler();
    battleStream.omniscient.write(`>start ${JSON.stringify(spec)}`);
    battleStream.omniscient.write(`>player p1 ${JSON.stringify(p1spec)}`);
    battleStream.omniscient.write(`>player p2 ${JSON.stringify(p2spec)}`);
    battleStream.omniscient.write(`>p1 team 1`);
    battleStream.omniscient.write(`>p2 team 1`);
  }, [])

  return (
    <div className='pokemonBattleManagerContainer'>
      <PokemonBattleDisplay
        p1Pokemon={p1Pokemon}
        p2Pokemon={p2Pokemon}
        battleState={battle}
        parsedBattleLog={delayedBattleLog}
        onMoveSelect={(move) => {
          if (move === 'undo') {
            battleStream.omniscient.write(`>p1 undo`);
          } else {
            battleStream.omniscient.write(`>p1 move ${move}`);
          }
        }}
        onP2MoveSelect={(move) => {
          if (move === 'cancel') {
            battleStream.omniscient.write(`>p2 undo`);
          } else {
            battleStream.omniscient.write(`>p2 move ${move}`);
          }
        }}
      />
    </div>
  )
}

export default PokemonBattleManager;
