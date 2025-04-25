import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faDoorOpen, faFlag, faForwardFast } from "@fortawesome/free-solid-svg-icons";
import { useGameState } from "../../../../context/GameStateContext";
import { useUserState } from "../../../../context/UserStateContext";
import { socket } from "../../../../socket";
import NavOptions from "../../../common/NavOptions/NavOptions";
import { NavOptionButton } from "../../../common/NavOptions/NavOptionButton/NavOptionButton";
import { useModalState } from "../../../../context/ModalStateContext";
import './GameManagerActions.css';

const GameManagerActions = () => {
  const { userState, dispatch } = useUserState();
  const { gameState, dispatch: dispatchGameState } = useGameState();
  const { dispatch: dispatchModalState } = useModalState();

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  const handleOptionsClick = () => {
    dispatchModalState({ type: 'OPEN_OPTIONS_MODAL', payload: {} });
  };

  const handleReturn = () => {
    dispatchGameState({ type: 'RETURN_TO_ROOM' });
    socket.emit('setViewingResults', userState.currentRoomId, userState.id, false);
  };

  return (
    <NavOptions minimal={true} className='gameManagerActionContainer'>
      <div className='gameManagerActionHeaderContainer'>
        <span className='gameManagerActionHeader'>Pokemon</span>
        <span className='gameManagerActionHeader'>Gambit</span>
      </div>
      <div className='gameManagerActions'>
        {
          gameState.isCatchingUp && !gameState.isSkippingAhead && (
            <NavOptionButton className='gameManagerAction' onClick={() => { dispatchGameState({ type: 'SET_SKIPPING_AHEAD', payload: !gameState.isSkippingAhead }) }}>
              <span className='gameManagerActionIcon'><FontAwesomeIcon icon={faForwardFast} /></span>
              <span className='gameManagerActionLabel'>Skip to Current Turn</span>
            </NavOptionButton>
          )
        }
        {
          gameState.matchEnded && (
            <NavOptionButton className='gameManagerAction' onClick={handleReturn}>
              <span className='gameManagerActionIcon'><FontAwesomeIcon icon={faDoorOpen} /></span>
              <span className='gameManagerActionLabel'>Return to Room</span>
            </NavOptionButton>
          )
        }
        <NavOptionButton className='gameManagerAction' onClick={() => handleLeaveRoom()}>
          <span className='gameManagerActionIcon'><FontAwesomeIcon icon={faFlag} /></span>
          <span className='gameManagerActionLabel'>Return to Main Menu</span>
        </NavOptionButton>
        <NavOptionButton className='gameManagerAction' onClick={() => handleOptionsClick()}>
          <span className='gameManagerActionIcon'><FontAwesomeIcon icon={faCog} /></span>
          <span className='gameManagerActionLabel'>Options</span>
        </NavOptionButton>
      </div>
    </NavOptions>
  )
};


export default GameManagerActions;