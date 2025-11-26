import { CustomArgTypes } from "../../../../../shared/types/PokemonTypes";

export const shouldDelayBattleOutput = (
  logType: CustomArgTypes[0],
  futureArgType?: CustomArgTypes[0],
) => {
  const delayLogs: CustomArgTypes[0][] = [
    "start",
    "win",
    "move",
    "faint",
    "switch",
    "cant",
    "message",
    "-miss",
    "-fail",
    "-curestatus",
    "-damage",
    "-heal",
    "-boost",
    "-unboost",
    "-setboost",
    "-weather",
    "-activate",
    "-enditem",
    "-immune",
    "-fieldstart",
    "-block",
  ];
  if (logType === "-boost" && futureArgType === "-boost") {
    return false;
  }
  if (logType === "-unboost" && futureArgType === "-unboost") {
    return false;
  }

  return delayLogs.includes(logType);
};
