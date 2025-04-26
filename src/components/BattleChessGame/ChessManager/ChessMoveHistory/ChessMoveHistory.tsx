import { ChessData } from '../../../../../shared/types/game';
import './ChessMoveHistory.css';
import { useEffect, useRef } from "react";

const ChessMoveHistoryItem = ({ turn, whiteMove, blackMove }: { turn: number; whiteMove?: ChessData; blackMove?: ChessData }) => {
  return (
    <li className='moveHistoryRow'>
      <span className='moveHistoryTurnLabel'>
        {turn}.
      </span>
      <span className={`moveHistoryMoveLabel ${whiteMove?.data.failed === true ? 'moveHistoryFail' : whiteMove?.data.failed === false ? 'moveHistoryWin' : ''}`}>
        {whiteMove?.data.san}
      </span>
      <span className={`moveHistoryMoveLabel ${blackMove?.data.failed === true ? 'moveHistoryFail' : blackMove?.data.failed === false ? 'moveHistoryWin' : ''}`}>
        {blackMove?.data.san}
      </span>
    </li>
  )
};

const ChessMoveHistory = ({ chessMoveHistory }: { chessMoveHistory: ChessData[] }) => {
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
        <ChessMoveHistoryItem key={i} turn={Math.floor(i/2) + 1} whiteMove={chessMoveHistory[i]} blackMove={i + 1 < chessMoveHistory.length ? chessMoveHistory[i + 1] : undefined} />
      )
    }
  }

  return (
    <>
      <p>Chess Move History</p> 
      <ul className='moveHistoryContainer' ref={containerRef}>
        {moveListItem?.map((move) => (
          move
        ))}
      </ul>
    </>
  );
}

export default ChessMoveHistory;