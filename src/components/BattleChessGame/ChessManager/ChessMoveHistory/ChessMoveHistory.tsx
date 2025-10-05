import { ChessData } from "../../../../../shared/types/Game.js";
import "./ChessMoveHistory.css";
import { useEffect, useRef } from "react";

const ChessMoveHistoryItem = ({
  turn,
  whiteMove,
  blackMove,
}: {
  turn: number;
  whiteMove?: ChessData;
  blackMove?: ChessData;
}) => {
  return (
    <li className="moveHistoryRow" data-testid="chess-move-history-row">
      <span
        className="moveHistoryTurnLabel"
        data-testid="chess-move-history-turn-label"
      >
        {turn}.
      </span>
      <span
        data-testid="chess-move-history-white-move"
        className={`moveHistoryMoveLabel ${whiteMove?.data.failed === true ? "moveHistoryFail" : whiteMove?.data.failed === false ? "moveHistoryWin" : ""}`}
      >
        {whiteMove?.data.san}
      </span>
      <span
        data-testid="chess-move-history-black-move"
        className={`moveHistoryMoveLabel ${blackMove?.data.failed === true ? "moveHistoryFail" : blackMove?.data.failed === false ? "moveHistoryWin" : ""}`}
      >
        {blackMove?.data.san}
      </span>
    </li>
  );
};

export interface ChessMoveHistoryProps {
  chessMoveHistory: ChessData[];
}

const ChessMoveHistory = ({ chessMoveHistory }: ChessMoveHistoryProps) => {
  const containerRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [chessMoveHistory]);

  const moveListItem = [];
  if (chessMoveHistory) {
    for (let i = 0; i < (chessMoveHistory.length || 0); i += 2) {
      moveListItem.push(
        <ChessMoveHistoryItem
          key={i}
          turn={Math.floor(i / 2) + 1}
          whiteMove={chessMoveHistory[i]}
          blackMove={
            i + 1 < chessMoveHistory.length
              ? chessMoveHistory[i + 1]
              : undefined
          }
        />,
      );
    }
  }

  return (
    <>
      <p data-testid="chess-move-history-title">Chess Move History</p>
      <ul
        className="moveHistoryContainer"
        ref={containerRef}
        data-testid="chess-move-history-container"
      >
        {moveListItem?.map((move) => move)}
      </ul>
    </>
  );
};

export default ChessMoveHistory;
