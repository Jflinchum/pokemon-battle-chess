import { Sprites } from "@pkmn/img";
import { EndGameModalProps, useModalState } from "../../../../../context/ModalStateContext";
import { useUserState } from "../../../../../context/UserStateContext";
import { useGameState } from "../../../../../context/GameStateContext";
import { socket } from "../../../../../socket";
import Button from "../../../Button/Button";
import { EndGameReason } from "../../../../../../shared/types/game";
import './EndGameModal.css';
import { useMemo } from "react";

const getEndGameTitle = (isSpectator: boolean, playerVictory: boolean, reason: EndGameReason) => {
  if (isSpectator || reason === 'HOST_DISCONNECTED' || reason === 'PLAYER_DISCONNECTED') {
    return 'End Game';
  } else if (playerVictory) {
    return 'You Win!';
  } else {
    return 'You Lose...';
  }
}

const getEndgameSubtitle = (reason: EndGameReason, loseName: string, disconnectName?: string) => {
  switch (reason) {
    case 'KING_CAPTURED':
      return `${loseName} had their King captured!`;
    case 'TIMEOUT':
      return `${loseName} ran out of time.`;
    case 'HOST_DISCONNECTED':
      return `Game ended because the host has left the game.`;
    case 'PLAYER_DISCONNECTED':
      return `${disconnectName} left the game.`;
  }
}

const EndGameModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const { gameState, dispatch: gameStateDispatch } = useGameState();

  const currentColor = gameState.gameSettings?.color;
  const { victor, reason, name: disconnectName } = (modalState.modalProps as EndGameModalProps);

  const handleBackToMenu = () => {
    userStateDispatch({ type: 'LEAVE_ROOM' });
    dispatch({ type: 'CLOSE_MODAL' });
  }

  const handleReturn = () => {
    gameStateDispatch({ type: 'RETURN_TO_ROOM' });
    socket.emit('setViewingResults', userState.currentRoomId, userState.id, false);
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const player1 = useMemo(() => gameState.players.find((player) => player.isPlayer1), []);
  const player2 = useMemo(() => gameState.players.find((player) => player.isPlayer2), []);
  const loseName = useMemo(() => {
    return gameState.players.find((player) => player.color === (victor === 'w' ? 'b' : 'w'))?.playerName || ''
  }, []);
  
  return (
    <div className='endGameModalContainer'>
      <h2 className='endGameTitle'>
        {
          getEndGameTitle(
            !!gameState.players.find((player) => player.playerId === userState.id)?.isSpectator,
            currentColor === victor,
            reason,
          )
        }
      </h2>
      <h4>
        {
          getEndgameSubtitle(
            reason,
            loseName,
            disconnectName,
          )
        }
      </h4>
      {
        reason !== 'HOST_DISCONNECTED' && (
          <div className='endGamePlayerList'>
            <div className='endGamePlayer'>
              <p>{player1?.playerName}</p>
              <img src={Sprites.getAvatar(player1?.avatarId || 1)}/>
            </div>
            <p>vs</p>
            <div className='endGamePlayer'>
              <p>{player2?.playerName}</p>
              <img src={Sprites.getAvatar(player2?.avatarId || 1)}/>
            </div>
          </div>
        )
      }
      {
        reason !== 'HOST_DISCONNECTED' && (
          <div className='endGameBottomActions'>
            <Button color='danger' onClick={handleBackToMenu}>Back To Main Menu</Button>
            <Button className='endGameRematch' onClick={handleReturn} color='primary'>Return to Room</Button>
          </div>
        )
      }
    </div>
  )
};

export default EndGameModal;