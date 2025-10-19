import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import { useEffect, useState } from "react";
import { CustomArgTypes } from "../../../../../../../shared/types/PokemonTypes";
import { useGameState } from "../../../../../../context/GameState/GameStateContext";
import { useDebounce } from "../../../../../../utils";
import StylizedText from "../../../../../common/StylizedText/StylizedText";
import { shouldDelayBattleOutput } from "../../../utils/shouldDelayBattleOutput";
import "./PokemonBattleText.css";

interface PokemonBattleTextProps {
  battleHistory: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType }[];
  logFormatter: LogFormatter;
}

export const PokemonBattleText = ({
  battleHistory,
  logFormatter,
}: PokemonBattleTextProps) => {
  const [currentText, setCurrentText] = useState("");
  const { gameState } = useGameState();

  const textDebouncer = useDebounce(() => {
    setCurrentText("");
  }, 1000);

  useEffect(() => {
    const latestLog = battleHistory[battleHistory.length - 1];
    if (shouldDelayBattleOutput(latestLog?.args[0])) {
      let formattedText = logFormatter.formatText(
        latestLog.args as ArgType,
        latestLog.kwArgs,
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

      setCurrentText(formattedText);
      textDebouncer();
    }
  }, [
    battleHistory,
    logFormatter,
    textDebouncer,
    gameState.gameSettings.whitePlayer,
    gameState.gameSettings.blackPlayer,
  ]);

  if (currentText) {
    return (
      <p className="battleTextContainer">
        <StylizedText text={currentText} />
      </p>
    );
  }
};
