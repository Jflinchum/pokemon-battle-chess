import { useGameState } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import Button from "../../common/Button/Button";
import { socket } from "../../../socket";
import './GameManagerActions.css';

const GameManagerActions = () => {
  const { userState, dispatch } = useUserState();
  const { gameState, dispatch: dispatchGameState } = useGameState();

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  const handleReturn = () => {
    dispatchGameState({ type: 'RETURN_TO_ROOM' });
    socket.emit('setViewingResults', userState.currentRoomId, userState.id, false);
  };

  return (
    <div className='gameManagerContainer'>
      <h3 className='gameManagerHeader'>Pokemon Gambit</h3>
      <div className='gameManagerRightActions'>
        {
          gameState.isCatchingUp && !gameState.isSkippingAhead && (
            <Button onClick={() => { dispatchGameState({ type: 'SET_SKIPPING_AHEAD', payload: !gameState.isSkippingAhead }) }}>
              Skip to Current Turn
            </Button>
          )
        }
        <Button color='danger' onClick={() => handleLeaveRoom()}>Return to Main Menu</Button>
        {
          gameState.inGame && gameState.matchEnded && (<Button color='primary' onClick={handleReturn}>Return to Room</Button>)
        }
      </div>
    </div>
  )
};


export default GameManagerActions;