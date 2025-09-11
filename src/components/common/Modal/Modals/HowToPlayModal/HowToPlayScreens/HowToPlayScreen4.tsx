import { Chess } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import { PokemonBattleChessManager } from "../../../../../../../shared/models/PokemonBattleChessManager";
import { BattleChessGame } from "../../../../../BattleChessGame/BattleChessManager/BattleChessGame";
import { MatchHistory } from "../../../../../../../shared/types/Game";
import { useEffect, useMemo, useRef, useState } from "react";

export const HowToPlayScreen4 = () => {
  const pokemonManager = useMemo(
    () =>
      new PokemonBattleChessManager({
        seed: "1234,tutorial",
        format: "random",
        weatherWars: true,
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
  const grimmsnarl = useMemo(
    () => pokemonManager.getPokemonFromSquare("d7"),
    [pokemonManager],
  )!.pkmn;
  const dewgong = useMemo(
    () => pokemonManager.getPokemonFromSquare("e2"),
    [pokemonManager],
  )!.pkmn;
  const matchGenerator = useMemo(
    () =>
      getExampleMatchHistoryGenerator(ninetales, sawsbuck, grimmsnarl, dewgong),
    [ninetales, sawsbuck, grimmsnarl, dewgong],
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
  }, [matchGenerator]);

  useEffect(() => {
    if (currentMatchHistory.length === 0) {
      chessManager.reset();
      pokemonManager.reset();
      matchLogIndex.current = 0;
    }
  }, [currentMatchHistory.length, chessManager, pokemonManager]);

  return (
    <>
      <b>Weather Wars</b>
      <p>
        One game mode within Pokemon Gambit is <b>"Weather Wars"</b>. In this
        game mode, weather and terrain will appear throughout the chessboard
        that will take affect when a battle starts on that chess square.
      </p>
      <p>
        If a Pokemon has an ability or move that sets the weather or terrain,
        the weather or terrain will{" "}
        <b>stay on the board after the battle is over.</b> Weather and terrain
        will only disappear from a square <b>after a set amount of battles</b>{" "}
        on that square, or if another Pokemon overrides it.
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
  grimmsnarl: PokemonSet<string>,
  dewgong: PokemonSet<string>,
): Generator<MatchHistory> {
  while (true) {
    const matchHistory: MatchHistory = [];
    yield matchHistory;
    matchHistory.push({
      type: "weather",
      data: {
        event: "weatherChange",
        modifier: {
          type: "modify",
          squareModifiers: [
            {
              square: "e5",
              modifiers: { weather: { id: "sandstorm", duration: 3 } },
            },
          ],
        },
      },
    });
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
        san: "d5",
      },
    });
    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "e4",
      },
    });

    yield matchHistory;
    matchHistory.push(
      {
        type: "pokemon",
        data: {
          event: "battleStart",
          p1Pokemon: dewgong,
          p2Pokemon: grimmsnarl,
          attemptedMove: {
            color: "b",
            san: "dxe4",
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
            "|player|p2|Blue||\n|teamsize|p1|1\n|teamsize|p2|1\n|gen|9\n|tier|pbc\n|\n|t:|1747268665\n|start\n|switch|p1a: Dewgong|Dewgong, L85, F|278/278\n|switch|p2a: Grimmsnarl|Grimmsnarl, L88, M|100/100\n|message|Grimmsnarl receives a stat boost from starting the battle!\n|-boost|p2a: Grimmsnarl|spe|1\n|-fieldstart|move: Psychic Terrain\n|turn|1",
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
          "|\n|t:|1747268685\n\n|move|p2a: Grimmsnarl|Spirit Break|p1a: Dewgong|\n|-damage|p1a: Dewgong|104/278\n|move|p1a: Dewgong|Surf|p2a: Grimmsnarl|\n|-crit|p2a:Grimmsnarl|\n|-damage|p2a: Grimmsnarl|0 fnt\n|faint|p2a: Grimmsnarl\n",
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
      type: "weather",
      data: {
        event: "weatherChange",
        modifier: {
          type: "modify",
          squareModifiers: [
            {
              square: "e4",
              modifiers: { terrain: { id: "psychicterrain", duration: 3 } },
            },
          ],
        },
      },
    });
    matchHistory.push({
      type: "chess",
      data: {
        color: "b",
        san: "dxe4",
        failed: true,
      },
    });

    yield matchHistory;
    matchHistory.push({
      type: "chess",
      data: {
        color: "w",
        san: "Bf4",
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
      type: "weather",
      data: {
        event: "weatherChange",
        modifier: {
          type: "modify",
          squareModifiers: [
            {
              square: "e5",
              modifiers: { weather: { id: "sunnyday", duration: 3 } },
            },
          ],
        },
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
        san: "f5",
      },
    });
    yield matchHistory;
  }
}
