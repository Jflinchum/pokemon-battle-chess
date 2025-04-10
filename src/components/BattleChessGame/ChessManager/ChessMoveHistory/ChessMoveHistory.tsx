import './ChessMoveHistory.css';
import { useEffect, useRef } from "react";

const ChessMoveHistoryItem = ({ turn, whiteMove, blackMove }: { turn: number; whiteMove?: { sanMove: string; battleSuccess: boolean | null }; blackMove?: { sanMove: string; battleSuccess: boolean | null } }) => {
  return (
    <li>
      <span className='moveHistoryTurnLabel'>
        {turn}.
      </span>
      <span className={`moveHistoryMoveLabel ${whiteMove?.battleSuccess === false ? 'moveHistoryFail' : whiteMove?.battleSuccess === true ? 'moveHistoryWin' : ''}`}>
        {whiteMove?.sanMove}
      </span>
      <span className={`moveHistoryMoveLabel ${blackMove?.battleSuccess === false ? 'moveHistoryFail' : blackMove?.battleSuccess === true ? 'moveHistoryWin' : ''}`}>
        {blackMove?.sanMove}
      </span>
    </li>
  )
};

const ChessMoveHistory = ({ chessMoveHistory }: { chessMoveHistory: { sanMove: string, battleSuccess: boolean | null }[] }) => {
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