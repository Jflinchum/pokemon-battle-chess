import { useGameState } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import Button from "../../common/Button/Button";
import './GameManagerActions.css';

const GameManagerActions = () => {
  const { dispatch } = useUserState();
  const { gameState, dispatch: dispatchGameState } = useGameState();

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  return (
    <div className='gameManagerContainer'>
      <h3 className='gameManagerHeader'>Pokemon Chess Arena</h3>
      <div className='gameManagerRightActions'>
        {
          gameState.isCatchingUp && !gameState.isSkippingAhead && (
            <Button onClick={() => { dispatchGameState({ type: 'SET_SKIPPING_AHEAD', payload: !gameState.isSkippingAhead }) }}>
              Skip to Current Turn
            </Button>
          )
        }
        <Button color='danger' onClick={() => handleLeaveRoom()}>Return to Main Menu</Button>
      </div>
    </div>
  )
};


export default GameManagerActions;