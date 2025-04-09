import { Sprites } from "@pkmn/img";
import { EndGameModalProps, useModalState } from "../../../../../context/ModalStateContext";
import { useUserState } from "../../../../../context/UserStateContext";
import { useGameState } from "../../../../../context/GameStateContext";
import { socket } from "../../../../../socket";
import Button from "../../../Button/Button";
import './EndGameModal.css';

const getEndGameTitle = (isSpectator: boolean, playerVictory: boolean) => {
  if (isSpectator) {
    return 'End Game';
  } else if (playerVictory) {
    return 'You Win!';
  } else {
    return 'You Lose...';
  }
}

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
      <h2 className='endGameTitle'>{getEndGameTitle(!!gameState.players.find((player) => player.playerId === userState.id)?.isSpectator, currentColor === victorColor)}</h2>
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
        <Button onClick={handleBackToMenu}>Back To Main Menu</Button>
        <Button className='endGameRematch' onClick={handleReturn} color='primary'>Return to Room</Button>
      </div>
    </div>
  )
};

export default EndGameModal;