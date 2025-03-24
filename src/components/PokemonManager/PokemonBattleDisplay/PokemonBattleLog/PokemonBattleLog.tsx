import { useRef, useEffect, useMemo } from "react";
import { Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import StylizedText from "../../../common/StylizedText/StylizedText";
import './PokemonBattleLog.css';

interface PokemonBattleLogProps {
  battleHistory: string[];
}

const getClassnameFromBattleArg = (args: string[]) => {
  console.log(args);
  if (args[0] === 'turn') {
    return 'turnLog';
  }
  return '';
}

const formatTextFromBattleArg = (text: string, args: string[]) => {
  if (args[0] === 'turn') {
    return text.replace(/\=/g, '');
  }
  return text;
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
          let totalLog: { text: string, args: string[]  }[] = [];
          for (const { args, kwArgs } of Protocol.parse(log)) {
            const formattedText = formatter.formatText(args, kwArgs);
            if (formattedText) {
              totalLog.push({ text: formattedText, args: (args as string[]) });
            }
          }
          return totalLog.map(({ text, args }, index) => (
            text && (
              <p className={`textLog ${getClassnameFromBattleArg(args)}`} key={index}>
                <StylizedText text={formatTextFromBattleArg(text, args)} />
              </p>
            )
          ));
        }
        )
      }
    </div>
  )
}

export default PokemonBattleLog;
