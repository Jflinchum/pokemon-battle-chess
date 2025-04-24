import { useGameState } from "../../../../context/GameStateContext";
import { useUserState } from "../../../../context/UserStateContext";
import Button from "../../../common/Button/Button";
import { socket } from "../../../../socket";
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

  const handleAnimationSpeedPreferenceChange = (animationSpeed: number) => {
    dispatch({ type: 'SET_ANIMATION_SPEED_PREFERENCE', payload: animationSpeed })
  };

  return (
    <div className='gameManagerContainer'>
      <h3 className='gameManagerHeader'>Pokemon Gambit</h3>
      <div className='gameManagerRightActions'>
        <label htmlFor='animationSpeedPreference'>Game Animation Speed:</label>
        <select id='animationSpeedPreference' value={userState.animationSpeedPreference} onChange={(e) => handleAnimationSpeedPreferenceChange(parseInt(e.target.value))}>
          <option value={1500}>Slow</option>
          <option value={1000}>Normal</option>
          <option value={500}>Fast</option>
          <option value={100}>Instant</option>
        </select>
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