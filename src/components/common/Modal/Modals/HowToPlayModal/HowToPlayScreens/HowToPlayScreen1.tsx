import { Chess } from "chess.js";
import { PokemonBattleChessManager } from "../../../../../../../shared/models/PokemonBattleChessManager";
import { BattleChessGame } from "../../../../../BattleChessGame/BattleChessManager/BattleChessGame";
import { MatchHistory } from "../../../../../../../shared/types/Game";
import { useEffect, useMemo, useRef, useState } from "react";

export const HowToPlayScreen1 = () => {
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

  const matchGenerator = useMemo(() => getExampleMatchHistoryGenerator(), []);

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
  }, [currentMatchHistory, chessManager, pokemonManager]);

  return (
    <>
      <p>Welcome to Pokemon Gambit!</p>
      <p>
        This game makes an attempt to merge both Pokemon's battle system and
        Chess together to create a layered strategy game. A game will start off
        as any normal Chess game, except{" "}
        <b>each Chess piece will be assigned a Pokemon.</b>
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

function* getExampleMatchHistoryGenerator(): Generator<MatchHistory> {
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
        san: "Nf6",
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
        san: "d5",
      },
    });
    yield matchHistory;
  }
}
