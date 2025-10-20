import { Chess } from "chess.js";
import { useMemo, useRef } from "react";
import { PokemonBattleChessManager } from "../../../../../shared/models/PokemonBattleChessManager";
import { MatchHistory } from "../../../../../shared/types/Game";
import { BattleChessGame } from "../../../BattleChessGame/BattleChessManager/BattleChessGame";

export const HowToPlayScreen5 = () => {
  const pokemonManager = useMemo(
    () =>
      new PokemonBattleChessManager({
        seed: "1234,tutorial",
        format: "random",
      }),
    [],
  );
  const chessManager = useMemo(() => new Chess(), []);

  const ninetales = useMemo(
    () => pokemonManager.getPokemonFromSquare("d2"),
    [pokemonManager],
  )!.pkmn;
  const sawsbuck = useMemo(
    () => pokemonManager.getPokemonFromSquare("e7"),
    [pokemonManager],
  )!.pkmn;

  const matchLogIndex = useRef(0);

  const currentMatchHistory: MatchHistory = useMemo(
    () => [
      {
        type: "chess",
        data: {
          color: "w",
          san: "d4",
        },
      },
      {
        type: "chess",
        data: {
          color: "b",
          san: "e5",
        },
      },
      {
        type: "pokemon",
        data: {
          event: "battleStart",
          p1Pokemon: ninetales,
          p2Pokemon: sawsbuck,
          attemptedMove: {
            color: "w",
            san: "dxe5",
          },
        },
      },
      {
        type: "pokemon",
        data: {
          event: "streamOutput",
          chunk: "|t:|1747268665\n|gametype|singles",
        },
      },
      {
        type: "pokemon",
        data: {
          event: "streamOutput",
          chunk: "|player|p1|Red||",
        },
      },
      {
        type: "pokemon",
        data: {
          event: "streamOutput",
          chunk:
            "|player|p2|Blue||\n|teamsize|p1|1\n|teamsize|p2|1\n|gen|9\n|tier|pbc\n|\n|t:|1747268665\n|start\n|switch|p1a: Ninetales|Ninetales, L85, M|278/278\n|switch|p2a: Sawsbuck|Sawsbuck, L88, F|100/100\n|message|Ninetales receives a stat boost from starting the battle!\n|-boost|p1a: Ninetales|spe|1\n|-weather|Sunnyday\n|turn|1",
        },
      },
    ],
    [sawsbuck, ninetales],
  );

  return (
    <>
      <b>Pokémon Battle Info</b>
      <p>
        At any point during a battle, you can click on a Pokémon to view
        information about it! You can hover/click most details you find in the
        game to view more, including items and abilities.
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
