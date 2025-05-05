import { useRef, useEffect, useMemo } from "react";
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import StylizedText from "../../../../common/StylizedText/StylizedText";
import './PokemonBattleLog.css';
import { useGameState } from "../../../../../context/GameStateContext";
import { Battle } from "@pkmn/client";
import { SideID } from "@pkmn/data";

interface PokemonBattleLogProps {
  battleHistory: { args: ArgType, kwArgs: BattleArgsKWArgType }[];
  simple?: boolean;
  perspective: SideID;
  battleState: Battle;
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

const PokemonBattleLog = ({ battleHistory, simple, perspective, battleState }: PokemonBattleLogProps) => {
  const { gameState } = useGameState();
  const formatter = useMemo(() => (new LogFormatter(perspective, battleState)), []);
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
          let formattedText = formatter.formatText(args, kwArgs);

          if (gameState.gameSettings.whitePlayer?.playerId) {
            formattedText = formattedText.replace(new RegExp(gameState.gameSettings.whitePlayer.playerId, 'g'), gameState.gameSettings.whitePlayer?.playerName);
          }
          if (gameState.gameSettings.blackPlayer?.playerId) {
            formattedText = formattedText.replace(new RegExp(gameState.gameSettings.blackPlayer.playerId, 'g'), gameState.gameSettings.blackPlayer?.playerName);
          }
          
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
