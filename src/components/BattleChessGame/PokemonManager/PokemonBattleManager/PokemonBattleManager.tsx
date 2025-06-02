import { useMemo } from "react";
import { Dex } from "@pkmn/dex";
import { PokemonSet, Generations, SideID } from "@pkmn/data";
import { KWArgType } from "@pkmn/protocol";
import { Battle } from "@pkmn/client";
import PokemonBattleDisplay from "../PokemonBattleDisplay/PokemonBattleDisplay";
import { CustomArgTypes } from "../../../../../shared/types/PokemonTypes";

interface PokemonBattleManagerProps {
  p1Pokemon: PokemonSet;
  p2Pokemon: PokemonSet;
  currentPokemonMoveHistory: { args: CustomArgTypes; kwArgs: KWArgType }[];
  perspective: SideID;
  demoMode?: boolean;
}

const PokemonBattleManager = ({
  p1Pokemon,
  p2Pokemon,
  currentPokemonMoveHistory,
  perspective,
  demoMode,
}: PokemonBattleManagerProps) => {
  // TODO - optimize this so we pass primitives down instead of recreating the class every time
  const battle = useMemo(() => {
    const newGeneration = new Generations(Dex);
    const newBattle = new Battle(
      newGeneration,
      null,
      [
        [perspective === "p1" ? p1Pokemon : p2Pokemon],
        [perspective === "p1" ? p2Pokemon : p1Pokemon],
      ],
      undefined,
    );
    for (const { args, kwArgs } of currentPokemonMoveHistory) {
      // Custom handling for forfeit
      if (args[0] === "-forfeit") {
        const side = args[1];
        if (newBattle[side]?.active[0]?.hp) {
          newBattle[side].active[0].hp = 0;
        }
      } else {
        newBattle.add(args, kwArgs);
      }
    }
    return newBattle;
  }, [p1Pokemon, p2Pokemon, perspective, currentPokemonMoveHistory]);

  return (
    <PokemonBattleDisplay
      demoMode={demoMode}
      battleState={battle}
      fullBattleLog={currentPokemonMoveHistory}
      p1Pokemon={p1Pokemon}
      p2Pokemon={p2Pokemon}
      perspective={perspective}
    />
  );
};

export default PokemonBattleManager;
