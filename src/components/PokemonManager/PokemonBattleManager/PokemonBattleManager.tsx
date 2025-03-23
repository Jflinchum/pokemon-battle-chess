import { useEffect, useMemo, useState } from 'react';
import { BattleStreams, Teams } from '@pkmn/sim';
import { PokemonSet } from "@pkmn/data";
import { LogFormatter } from '@pkmn/view';
import { Protocol } from '@pkmn/protocol';
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import PokemonBattleLog from '../PokemonBattleDisplay/PokemonBattleLog/PokemonBattleLog';
import './PokemonBattleManager.css';

interface PokemonBattleManagerProps {
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
}

const PokemonBattleManager = ({ p1Pokemon, p2Pokemon }: PokemonBattleManagerProps) => {
  /**
   * TODO:
   * - Health Bar above pokemon
   * - Win State/Lose State
   * - Pokemon Details Card
   */
  const battleStream = useMemo(() => (BattleStreams.getPlayerStreams(new BattleStreams.BattleStream())), []);
  const spec = { formatid: 'gen9customgame' };
  const p1spec = { name: 'player 1', team: Teams.pack([p1Pokemon]) };
  const p2spec = { name: 'player 2', team: Teams.pack([p2Pokemon]) };

  const [battleHistory, setBattleHistory] = useState<string[]>([])

  const beginBattleStreamHandler = async () => {
    const formatter = new LogFormatter();
    for await (const chunk of battleStream.omniscient) {
      for (const { args, kwArgs } of Protocol.parse(chunk)) {
        const formattedText = formatter.formatText(args, kwArgs);
        if (formattedText) {
          console.log(formattedText);
        }
      }
      setBattleHistory((battleHistory) => [...battleHistory, chunk]);
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
        onMoveSelect={(move) => {
          battleStream.omniscient.write(`>p1 move ${move}`);
        }}
        onP2MoveSelect={(move) => {
          battleStream.omniscient.write(`>p2 move ${move}`);
        }}
      />
      <PokemonBattleLog battleHistory={battleHistory}/>
    </div>
  )
}

export default PokemonBattleManager;
