import { useEffect, useMemo, useState } from "react";
import { MatchHistory } from "../../../../shared/types/Game";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { socket } from "../../../socket";

export const useGameSocketEvents = ({
  matchHistory,
  matchLogIndex,
}: {
  matchHistory?: MatchHistory;
  matchLogIndex: React.RefObject<number>;
}) => {
  const { gameState, dispatch } = useGameState();

  const [currentMatchLog, setCurrentMatchLog] = useState(matchHistory || []);

  const currentProcessedMatchLog = useMemo(
    () => currentMatchLog.slice(0, matchLogIndex.current),
    [currentMatchLog, matchLogIndex],
  );

  /**
   * If we receive new match history from the server in an attempt to re-sync the user,
   * then update our current state
   */
  useEffect(() => {
    if (matchHistory) {
      setCurrentMatchLog(matchHistory);
    }
  }, [matchHistory]);

  useEffect(() => {
    dispatch({ type: "SET_MATCH_HISTORY", payload: currentMatchLog });
  }, [currentMatchLog, dispatch]);

  useEffect(() => {
    socket.on("gameOutput", (log, ack) => {
      setCurrentMatchLog((curr) => [...curr, log]);
      ack();
    });

    return () => {
      socket.off("gameOutput");
    };
  }, []);

  useEffect(() => {
    // Stop listening for gameOutput once the match has ended
    if (gameState.matchEnded) {
      socket.off("gameOutput");
    }
  }, [gameState.matchEnded]);

  return {
    currentMatchLog,
    currentProcessedMatchLog: currentProcessedMatchLog,
    setCurrentMatchLog,
  };
};
