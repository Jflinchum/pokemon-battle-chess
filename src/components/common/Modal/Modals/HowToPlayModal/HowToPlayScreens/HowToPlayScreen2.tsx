import { Chess } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import { PokemonBattleChessManager } from "../../../../../../../shared/models/PokemonBattleChessManager";
import { BattleChessGame } from "../../../../../BattleChessGame/BattleChessManager/BattleChessGame";
import { MatchHistory } from "../../../../../../../shared/types/game";
import { useEffect, useMemo, useRef, useState } from "react";

export const HowToPlayScreen2 = () => {
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
  const tauros = useMemo(
    () => pokemonManager.getPokemonFromSquare("f7"),
    [pokemonManager],
  )!.pkmn;
  const matchGenerator = useMemo(
    () => getExampleMatchHistoryGenerator(ninetales, sawsbuck, tauros),
    [ninetales, sawsbuck, tauros],
  );

  const matchLogIndex = useRef(0);

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
  }, [ninetales, sawsbuck, matchGenerator]);

  useEffect(() => {
    if (currentMatchHistory.length === 0) {
      chessManager.reset();
      pokemonManager.reset();
      matchLogIndex.current = 0;
    }
  }, [currentMatchHistory.length, chessManager, pokemonManager]);

  return (
    <>
      <b>Taking a Piece</b>
      <p>
        Whenever you attempt to attack another Chess piece with your piece,{" "}
        <b>you will first need to win a Pokemon battle!</b> If you win, you
        successfully take the piece. However, if you lose,{" "}
        <b>your Chess piece will be taken instead!</b>
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

function* getExampleMatchHistoryGenerator(
  ninetales: PokemonSet<string>,
  sawsbuck: PokemonSet<string>,
  tauros: PokemonSet<string>,
): Generator<MatchHistory> {
  while (true) {
    const matchHistory: MatchHistory = [];
    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "d4",
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
    matchHistory.push(
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
    );
    yield matchHistory;
    yield matchHistory;
    matchHistory.push({
      type: "pokemon",
      data: {
        event: "streamOutput",
        chunk:
          "|\n|t:|1747268685\n|move|p1a: Ninetales|Fire Blast|p2a: Sawsbuck|\n|-supereffective|\n|-damage|p2a: Sawsbuck|0 fnt\n|faint|p2a: Sawsbuck\n",
      },
    });
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
        color: "w",
        san: "dxe5",
        failed: false,
      },
    });

    yield matchHistory;

    matchHistory.push({
      type: "chess",
      data: {
        color: "b",
        san: "f6",
      },
    });
    yield matchHistory;
    matchHistory.push(
      {
        type: "pokemon",
        data: {
          event: "battleStart",
          p1Pokemon: ninetales,
          p2Pokemon: tauros,
          attemptedMove: {
            color: "w",
            san: "exf6",
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
            "|player|p2|Blue||\n|teamsize|p1|1\n|teamsize|p2|1\n|gen|9\n|tier|pbc\n|\n|t:|1747268665\n|start\n|switch|p1a: Ninetales|Ninetales, L85, M|278/278\n|switch|p2a: Tauros|Tauros, L82, M|100/100\n|message|Ninetales receives a stat boost from starting the battle!\n|-boost|p1a: Ninetales|spe|1\n|-weather|Sunnyday\n|turn|1",
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
          "|\n|t:|1747268685\n|move|p1a: Ninetales|Fire Blast|p2a: Tauros|\n|-damage|p2a: Tauros|4/100\n|move|p2a: Tauros|Body Slam|p1a: Ninetales\n|-crit|p1a: Ninetales\n|-damage|p1a: Ninetales|0/278\n|faint|p1a: Ninetales\n",
      },
    });
    yield matchHistory;
    yield matchHistory;
    yield matchHistory;
    matchHistory.push({
      type: "pokemon",
      data: {
        event: "streamOutput",
        chunk: "|\n|win|Blue",
      },
    });
    matchHistory.push({
      type: "pokemon",
      data: {
        event: "victory",
        color: "b",
      },
    });

    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "exf6",
        failed: true,
      },
    });

    yield matchHistory;

    matchHistory.push({
      type: "chess",
      data: {
        color: "b",
        san: "f5",
      },
    });
    yield matchHistory;
  }
}
