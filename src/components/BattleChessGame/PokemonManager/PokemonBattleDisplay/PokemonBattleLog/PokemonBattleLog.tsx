import { SideID } from "@pkmn/data";
import { BattleArgsKWArgType, Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import { useEffect, useRef } from "react";
import { CustomArgTypes } from "../../../../../../shared/types/PokemonTypes";
import { useGameState } from "../../../../../context/GameState/GameStateContext";
import StylizedText from "../../../../common/StylizedText/StylizedText";
import "./PokemonBattleLog.css";

interface PokemonBattleLogProps {
  battleHistory: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType }[];
  simple?: boolean;
  perspective: SideID;
  logFormatter: LogFormatter;
}

const getClassnameFromBattleArg = (args: CustomArgTypes) => {
  if (args[0] === "turn") {
    return "turnLog";
  }
  return "";
};

const formatTextFromBattleArg = (text: string, args: CustomArgTypes) => {
  if (args[0] === "turn") {
    return text.replace(/=/g, "");
  }
  return text;
};

const PokemonBattleLog = ({
  battleHistory,
  simple,
  logFormatter,
}: PokemonBattleLogProps) => {
  const { gameState } = useGameState();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [battleHistory]);

  return (
    <div
      className={`pokemonBattleLogContainer ${simple ? "simpleLogContainer" : ""}`}
      ref={containerRef}
    >
      {battleHistory.map(({ args, kwArgs }, index) => {
        const totalLog: { text: string; args: string[] }[] = [];
        let formattedText = logFormatter.formatText(
          args as Protocol.ArgType,
          kwArgs,
        );

        if (gameState.gameSettings.whitePlayer?.playerId) {
          formattedText = formattedText.replace(
            new RegExp(gameState.gameSettings.whitePlayer.playerId, "g"),
            gameState.gameSettings.whitePlayer?.playerName,
          );
        }
        if (gameState.gameSettings.blackPlayer?.playerId) {
          formattedText = formattedText.replace(
            new RegExp(gameState.gameSettings.blackPlayer.playerId, "g"),
            gameState.gameSettings.blackPlayer?.playerName,
          );
        }

        if (formattedText) {
          totalLog.push({ text: formattedText, args: args as string[] });
        }
        if (formattedText) {
          return (
            <p
              className={`textLog ${getClassnameFromBattleArg(args)}`}
              key={index}
            >
              <StylizedText
                text={formatTextFromBattleArg(formattedText, args)}
              />
            </p>
          );
        }
      })}
    </div>
  );
};

export default PokemonBattleLog;
