import { useRef, useEffect, useMemo } from "react";
import { Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import './PokemonBattleLog.css';

interface PokemonBattleLogProps {
  battleHistory: string[];
}

const PokemonBattleLog = ({ battleHistory }: PokemonBattleLogProps) => {
  const formatter = useMemo(() => (new LogFormatter()), []);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [battleHistory]);

  return (
    <div className='pokemonBattleLogContainer' ref={containerRef}>
      {
        battleHistory.map((log) => {
          let totalLog: string[] = [];
          for (const { args, kwArgs } of Protocol.parse(log)) {
            const formattedText = formatter.formatText(args, kwArgs);
            if (formattedText) {
              totalLog.push(formattedText);
            }
          }
          return totalLog.map((formattedBattleText) => (
            formattedBattleText && (<p>{formattedBattleText}</p>)
          ));
        }
        )
      }
    </div>
  )
}

export default PokemonBattleLog;
