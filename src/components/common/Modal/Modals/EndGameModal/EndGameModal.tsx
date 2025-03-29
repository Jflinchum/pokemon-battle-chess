import { EndGameModalProps, useModalState } from "../../../../../context/ModalStateContext";
import { useUserState } from "../../../../../context/UserStateContext";
import { useGameState } from "../../../../../context/GameStateContext";
import './EndGameModal.css';
import Button from "../../../Button/Button";
import { socket } from "../../../../../socket";

const EndGameModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const { gameState, dispatch: gameStateDispatch } = useGameState();

  const currentColor = gameState.gameSettings?.color;
  const victorColor = (modalState.modalProps as EndGameModalProps)?.victor;

  const handleBackToMenu = () => {
    userStateDispatch({ type: 'LEAVE_ROOM' });
    dispatch({ type: 'CLOSE_MODAL' });
  }

  const handleRematch = () => {
    gameStateDispatch({ type: 'RETURN_TO_ROOM' });
    socket.emit('setViewingResults', userState.currentRoomId, userState.id, false);
    dispatch({ type: 'CLOSE_MODAL' });
  };
  
  return (
    <div className='endGameModalContainer'>
      <h2 className='endGameTitle'>{currentColor === victorColor ? 'You Win!' : 'You Lose...'}</h2>
      <p>{gameState.gameSettings?.player1Name} vs {gameState.gameSettings?.player2Name}</p>
      <div className='endGameBottomActions'>
        <Button colorPrimary='brown' onClick={handleBackToMenu}>Back To Main Menu</Button>
        <Button className='endGameRematch' colorPrimary='green' onClick={handleRematch}>Rematch</Button>
      </div>
    </div>
  )
};

export default EndGameModal;