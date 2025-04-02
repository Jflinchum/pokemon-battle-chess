import { useRef, useEffect, useMemo } from "react";
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import StylizedText from "../../../../common/StylizedText/StylizedText";
import './PokemonBattleLog.css';

interface PokemonBattleLogProps {
  battleHistory: { args: ArgType, kwArgs: BattleArgsKWArgType }[];
  simple?: boolean;
}

const getClassnameFromBattleArg = (args: ArgType) => {
  if (args[0] === 'turn') {
    return 'turnLog';
  }
  return '';
}

const formatTextFromBattleArg = (text: string, args: ArgType) => {
  if (args[0] === 'turn') {
    return text.replace(/\=/g, '');
  }
  return text;
}

const PokemonBattleLog = ({ battleHistory, simple }: PokemonBattleLogProps) => {
  const formatter = useMemo(() => (new LogFormatter()), []);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [battleHistory]);

  return (
    <div className={`pokemonBattleLogContainer ${simple ? 'simpleLogContainer' : ''}`} ref={containerRef}>
      {
        battleHistory.map(({ args, kwArgs }, index) => {
          let totalLog: { text: string, args: string[]  }[] = [];
          const formattedText = formatter.formatText(args, kwArgs);
          if (formattedText) {
            totalLog.push({ text: formattedText, args: (args as string[]) });
          }
          if (formattedText) {
            return (
              <p className={`textLog ${getClassnameFromBattleArg(args)}`} key={index}>
                <StylizedText text={formatTextFromBattleArg(formattedText, args)} />
              </p>
            );
          }
        }
        )
      }
    </div>
  )
}

export default PokemonBattleLog;
