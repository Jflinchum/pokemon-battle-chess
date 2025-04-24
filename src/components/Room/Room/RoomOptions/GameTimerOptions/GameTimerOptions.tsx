import Button from "../../../../common/Button/Button";
import './GameTimerOptions.css';

export type TimerId = 'No Timer' | '30 + 20 + 10' | '30' | '15 + 10 + 5' | '10 + 5 + 1' | '10' | '5' | '3 + 2 + 1' | '3' | '2 + 1' | '1 + 1' | '1';

const timerCategoryMapping: Record<string, TimerId[]> = {
  Classic: ['No Timer', '30 + 20 + 10', '30'],
  Rapid: ['15 + 10 + 5', '10 + 5 + 1', '10'],
  Blitz: ['5', '3 + 2 + 1', '3'],
  Bullet: ['2 + 1', '1 + 1', '1'],
}

export const timerIdToTimerMapping: Record<TimerId, { chess: number, chessInc: number, pkmnInc: number }> = {
  'No Timer': { chess: 0, chessInc: 0, pkmnInc: 0 },
  '30 + 20 + 10': { chess: 30, chessInc: 20, pkmnInc: 10 },
  '30': { chess: 30, chessInc: 0, pkmnInc: 0 },
  '15 + 10 + 5': { chess: 15, chessInc: 10, pkmnInc: 5 },
  '10 + 5 + 1': { chess: 10, chessInc: 5, pkmnInc: 1 },
  '10': { chess: 10, chessInc: 0, pkmnInc: 0 },
  '5': { chess: 5, chessInc: 0, pkmnInc: 0 },
  '3 + 2 + 1': { chess: 3, chessInc: 2, pkmnInc: 1 },
  '3': { chess: 3, chessInc: 0, pkmnInc: 0 },
  '2 + 1': { chess: 2, chessInc: 1, pkmnInc: 0 },
  '1 + 1': { chess: 1, chessInc: 1, pkmnInc: 0 },
  '1': { chess: 1, chessInc: 0, pkmnInc: 0 },
};

export const getTimerIdFromTimerData = ({ chess, chessInc, pkmnInc }: { chess: number, chessInc: number, pkmnInc: number }): TimerId => {
  const timer = Object.keys(timerIdToTimerMapping).find((timerId) => (
    timerIdToTimerMapping[timerId as TimerId].chess === chess &&
    timerIdToTimerMapping[timerId as TimerId].chessInc === chessInc &&
    timerIdToTimerMapping[timerId as TimerId].pkmnInc === pkmnInc
  ));
  if (!timer) {
    return 'No Timer';
  }
  return timer as TimerId;
}

export const GameTimerOptions = ({ timerId, onChange, disabled }: { timerId: TimerId; onChange: (timer: TimerId) => void; disabled?: boolean }) => {
  const handleSelectTimerId = (timer: TimerId) => {
    onChange(timer);
  }

  return (
    <>
      <div className='gameTimerContainer'>
        {
          Object.keys(timerCategoryMapping).map((category) => (
            <div key={category}>
              <p className='gameTimerLabel'>{category}</p>
                {
                  timerCategoryMapping[category].map((timer) => (
                    <Button disabled={disabled} highlighted={timerId === timer} className='gameTimerButton' key={timer} onClick={() => handleSelectTimerId(timer)}>{ timer }</Button>
                  ))
                }
            </div>
          ))
        }
      </div>
    </>
  );
};