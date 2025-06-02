import { Chess } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import { PokemonBattleChessManager } from "../../../../../../../shared/models/PokemonBattleChessManager";
import { BattleChessGame } from "../../../../../BattleChessGame/BattleChessManager/BattleChessGame";
import { MatchHistory } from "../../../../../../../shared/types/game";
import { useEffect, useMemo, useRef, useState } from "react";

export const HowToPlayScreen3 = () => {
  const pokemonManager = useMemo(
    () =>
      new PokemonBattleChessManager({
        seed: "1234,tutorial",
        format: "random",
      }),
    [],
  );
  const chessManager = useMemo(() => new Chess(), []);

  const kyurem = useMemo(
    () => pokemonManager.getPokemonFromSquare("e1"),
    [pokemonManager],
  )!.pkmn;
  const mewtwo = useMemo(
    () => pokemonManager.getPokemonFromSquare("d8"),
    [pokemonManager],
  )!.pkmn;
  const matchGenerator = useMemo(
    () => getExampleMatchHistoryGenerator(kyurem, mewtwo),
    [mewtwo, kyurem],
  );

  const matchLogIndex = useRef(0);
  const pokemonLogIndex = useRef(0);

  const [currentMatchHistory, setCurrentMatchHistory] = useState<MatchHistory>(
    [],
  );

  useEffect(() => {
    // const testKeypress = (e: KeyboardEvent) => {
    //   if (e.key === "Shift") {
    //     setCurrentMatchHistory([...matchGenerator.next().value]);
    //   }
    // };
    // document.addEventListener("keydown", testKeypress);
    const exampleMoveTimeout = setInterval(() => {
      setCurrentMatchHistory([...matchGenerator.next().value]);
    }, 3000);

    return () => {
      // document.removeEventListener("keydown", testKeypress);
      clearTimeout(exampleMoveTimeout);
    };
  }, [kyurem, mewtwo, matchGenerator]);

  useEffect(() => {
    if (currentMatchHistory.length === 0) {
      chessManager.reset();
      pokemonManager.reset();
      pokemonLogIndex.current = 0;
      matchLogIndex.current = 0;
    }
  }, [currentMatchHistory.length, chessManager, pokemonManager]);

  return (
    <div>
      <b>Winning and Losing</b>
      <p>
        Check and Checkmate work a little differently in this game! If you're in
        Check, you can still remain in Check after your next move.{" "}
        <b>You only lose once your King piece gets taken!</b>
      </p>
      <div className="gameDemoContainer">
        <BattleChessGame
          demoMode
          color="w"
          pokemonManager={pokemonManager}
          chessManager={chessManager}
          matchHistory={currentMatchHistory}
          matchLogIndex={matchLogIndex}
          pokemonLogIndex={pokemonLogIndex}
        />
      </div>
    </div>
  );
};

function* getExampleMatchHistoryGenerator(
  kyurem: PokemonSet<string>,
  mewtwo: PokemonSet<string>,
): Generator<MatchHistory> {
  while (true) {
    const matchHistory: MatchHistory = [];
    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "f4",
      },
    });
    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "b",
        san: "e5",
      },
    });
    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "Kf2",
      },
    });
    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "b",
        san: "Qh4+",
      },
    });
    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "Kg3",
      },
    });
    yield matchHistory;
    matchHistory.push(
      {
        type: "pokemon",
        data: {
          event: "battleStart",
          p1Pokemon: kyurem,
          p2Pokemon: mewtwo,
          attemptedMove: {
            color: "b",
            san: "Qxg3",
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
            "|player|p2|Blue||\n|teamsize|p1|1\n|teamsize|p2|1\n|gen|9\n|tier|pbc\n|\n|t:|1747268665\n|start\n|switch|p1a: Kyurem|Kyurem, L73|278/278\n|switch|p2a: Mewtwo|Mewtwo, L72|100/100\n|message|Mewtwo receives a stat boost from starting the battle!\n|-boost|p1a: Mewtwo|spe|1\n|turn|1",
        },
      },
    );
    yield matchHistory;
    yield matchHistory;
    matchHistory.push({
      type: "pokemon",
      data: {
        event: "streamOutput",
        chunk:
          "|\n|t:|1747268685\n|move|p2a: Mewtwo|Psytrike|p1a: Kyurem|\n|-damage|p1a: Kyurem|130/278\n|move|p1a: Kyurem|Draco Meteor|p2a: Mewtwo|\n|-damage|p2a: Mewtwo|0 fnt\n|faint|p2a: Mewtwo\n",
      },
    });
    yield matchHistory;
    yield matchHistory;
    matchHistory.push({
      type: "pokemon",
      data: {
        event: "streamOutput",
        chunk: "|\n|win|Red",
      },
    });
    matchHistory.push({
      type: "pokemon",
      data: {
        event: "victory",
        color: "w",
      },
    });
    matchHistory.push({
      type: "chess",
      data: {
        color: "b",
        san: "Qxg3",
        failed: true,
      },
    });

    yield matchHistory;

    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "e3",
      },
    });
    yield matchHistory;
  }
}
