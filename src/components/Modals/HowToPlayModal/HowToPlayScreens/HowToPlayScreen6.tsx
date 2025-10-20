import { Chess } from "chess.js";
import { useMemo, useRef } from "react";
import { PokemonBattleChessManager } from "../../../../../shared/models/PokemonBattleChessManager";
import { BattleChessGame } from "../../../BattleChessGame/BattleChessManager/BattleChessGame";

export const HowToPlayScreen6 = () => {
  const pokemonManager = useMemo(
    () =>
      new PokemonBattleChessManager({
        seed: "1234,tutorial",
        format: "random",
      }),
    [],
  );
  const chessManager = useMemo(() => new Chess(), []);
  const matchLogIndex = useRef(0);
  const currentMatchHistory = useMemo(() => [], []);

  return (
    <>
      <b>Pokémon Stats</b>
      <p>
        Pokémon are generated using common competitive sets and have{" "}
        <b>their levels modified based on how strong or weak they are.</b> For
        example, a Minun may be somewhere near level 100, while a Mewtwo may be
        in the lower 70 levels. This means that even weaker Pokémon have a
        chance to shine! Take a moment to hover over any of the pieces on this
        board to look.
      </p>
      <p>
        In the Random gamemode,{" "}
        <b>stronger Pokémon will be assigned to stronger pieces.</b> Due to the
        leveling system above, though, even Pawns can still have a chance to
        defend against Queens and Kings.
      </p>
      <div className="gameDemoContainer">
        <BattleChessGame
          demoMode
          color="w"
          pokemonManager={pokemonManager}
          chessManager={chessManager}
          matchHistory={currentMatchHistory}
          matchLogIndex={matchLogIndex}
        />
      </div>
    </>
  );
};
