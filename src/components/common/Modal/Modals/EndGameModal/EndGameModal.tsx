import { EndGameModalProps, useModalState } from "../../../../../context/ModalStateContext";
import { useUserState } from "../../../../../context/UserStateContext";
import { useGameState } from "../../../../../context/GameStateContext";
import './EndGameModal.css';
import Button from "../../../Button/Button";
import { socket } from "../../../../../socket";
import { Sprites } from "@pkmn/img";

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

  const handleReturn = () => {
    gameStateDispatch({ type: 'RETURN_TO_ROOM' });
    socket.emit('setViewingResults', userState.currentRoomId, userState.id, false);
    dispatch({ type: 'CLOSE_MODAL' });
  };
  
  return (
    <div className='endGameModalContainer'>
      <h2 className='endGameTitle'>{currentColor === victorColor ? 'You Win!' : 'You Lose...'}</h2>
      <div className='endGamePlayerList'>
        <div className='endGamePlayer'>
          <p>{gameState.players.find((player) => player.isPlayer1)?.playerName}</p>
          <img src={Sprites.getAvatar(gameState.players.find((player) => player.isPlayer1)?.avatarId || 1)}/>
        </div>
        <p>vs</p>
        <div className='endGamePlayer'>
          <p>{gameState.players.find((player) => player.isPlayer2)?.playerName}</p>
          <img src={Sprites.getAvatar(gameState.players.find((player) => player.isPlayer2)?.avatarId || 1)}/>
        </div>
      </div>
      <div className='endGameBottomActions'>
        <Button colorPrimary='brown' onClick={handleBackToMenu}>Back To Main Menu</Button>
        <Button className='endGameRematch' colorPrimary='green' onClick={handleReturn}>Return to Room</Button>
      </div>
    </div>
  )
};

export default EndGameModal;