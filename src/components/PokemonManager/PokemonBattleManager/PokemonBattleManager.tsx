import { useEffect, useMemo, useState } from 'react';
import { BattleStreams, Teams } from '@pkmn/sim';
import { PokemonSet, Generations } from "@pkmn/data";
import { Dex } from '@pkmn/dex';
import { Protocol } from '@pkmn/protocol';
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

const PokemonBattleManager = ({ p1Name, p2Name, p1Pokemon, p2Pokemon, onVictory }: PokemonBattleManagerProps) => {
  /**
   * TODO:
   * - Split pokemon stream output and process them 1 second at a time
   * - UI show status on pokemon
   * - On Hover in battle, show pokemon in depth details
   * - Pokemon Details Card
   */
  const battleStream = useMemo(() => (BattleStreams.getPlayerStreams(new BattleStreams.BattleStream())), []);
  const battle = useMemo(() => (new Battle(new Generations(Dex))), []);
  const spec = { formatid: 'gen9customgame' };
  const p1spec = { name: p1Name, team: Teams.pack([p1Pokemon]) };
  const p2spec = { name: p2Name, team: Teams.pack([p2Pokemon]) };

  const [battleHistory, setBattleHistory] = useState<string[]>([])
  const [battleState, setBattleState] = useState<Battle | null>(null);

  const beginBattleStreamHandler = async () => {
    for await (const chunk of battleStream.omniscient) {
      for (const { args, kwArgs } of Protocol.parse(chunk)) {
        console.log(args);
        battle.add(args, kwArgs);
        if (args[0] === 'win') {
          onVictory(args[1]);
        }
      }
      setBattleHistory((battleHistory) => [...battleHistory, chunk]);
      setBattleState(battle);
    }
  }

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
        battleState={battleState}
        battleHistory={battleHistory}
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
