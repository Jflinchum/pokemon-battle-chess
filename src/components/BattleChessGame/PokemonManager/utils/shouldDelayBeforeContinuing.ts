import { CustomArgTypes } from "../../../../../shared/types/PokemonTypes";

export const shouldDelayBeforeContinuing = (logType: CustomArgTypes[0]) => {
  const delayLogs: CustomArgTypes[0][] = [
    "player",
    "move",
    "faint",
    "switch",
    "cant",
    "-fail",
    "-curestatus",
    "-damage",
    "-heal",
    "-forfeit",
    "-boost",
    "-unboost",
    "-setboost",
    "-weather",
    "-activate",
    "-enditem",
    "-immune",
  ];
  if (delayLogs.includes(logType)) {
    return true;
  }
  return false;
};
