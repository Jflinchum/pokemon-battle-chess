import { useEffect, useState } from "react";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameStateContext";
import { useUserState } from "../../context/UserStateContext";
import { useModalState } from "../../context/ModalStateContext";
import { socket } from "../../socket";
import Room from "./Room/Room";
import ChatToggle from "./Chat/ChatToggle/ChatToggle";
import { MatchHistory, Timer } from "../../../shared/types/game";
import { Player } from "../../../shared/types/Player";
import { useMusicPlayer } from "../../util/useMusicPlayer";
import { useSocketRequests } from "../../util/useSocketRequests";
import './RoomManager.css';

const RoomManager = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();
  const { dispatch: dispatchModalState } = useModalState();
  const [matchHistory, setMatchHistory] = useState<MatchHistory>();
  const [timers, setTimers] = useState<Timer>();
  const { requestJoinGame, requestSync } = useSocketRequests();

  const { stopSongs } = useMusicPlayer();
  useEffect(() => {
    if (!gameState.inGame) {
      stopSongs();
    }
  }, [gameState.inGame]);

  useEffect(() => {
    requestJoinGame();
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('startSync', ({ history }: { history: MatchHistory }) => {
      console.log('starting sync');
      console.log(history);
      setMatchHistory(history);
    });

    socket.io.on('reconnect', () => {
      console.log('reconnecting -- attempting resync');
      requestSync();
    });

    socket.on('endGameFromDisconnect', ({ name, isHost }) => {
      if (isHost || !gameState.matchEnded) {
        dispatchModalState({
          type: 'OPEN_END_GAME_MODAL',
          payload: { modalProps: { reason: isHost ? 'HOST_DISCONNECTED' : 'PLAYER_DISCONNECTED', name } }
        });
      }
      if (isHost) {
        dispatchUserState({ type: 'LEAVE_ROOM' });
      }
    });

    socket.on('connectedPlayers', (players: Player[]) => {
      let isHost = false;
      let isSpectator = false;
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player.playerId === userState.id) {
          isHost = player.isHost;
          isSpectator = player.isSpectator;
          break;
        }
      }

      dispatch({ type: 'SET_PLAYERS', payload: { players: players as Player[], isHost, isSpectator } });
    });

    socket.on('roomClosed', () => {
      dispatchUserState({ type: 'LEAVE_ROOM' });
    });

    socket.on('currentTimers', (timer: Timer) => {
      setTimers(timer);
    });

    socket.on('startGame', (settings, isSyncing) => {
      if (!isSyncing) {
        setMatchHistory(undefined);
      }
      dispatch({ type: 'START_MATCH', payload: settings });
    });

    socket.on('kickedFromRoom', (cb) => {
      dispatchUserState({ type: 'LEAVE_ROOM' });
      dispatchModalState({ type: 'OPEN_GENERIC_MODAL', payload: {
        modalProps: {
          title: 'Disconnected',
          body: 'You were kicked from the game by the host.'
        }
      }})
      cb?.();
    });

    return () => {
      socket.off('connectedPlayers');
      socket.off('roomClosed');
      socket.off('endGameFromDisconnect');
      socket.off('startSync');
      socket.off('currentTimers');
      socket.off('startGame');
      socket.off('kickedFromRoom');
    }
  }, [gameState.matchEnded]);

  return (
    <>
      <div className='roomManagerContainer'>
        {
          gameState.inGame ?
          (<BattleChessManager matchHistory={matchHistory} timers={gameState.gameSettings.options.timersEnabled ? timers : undefined} />) :
          (<Room />)
        }
      </div>
      <ChatToggle className='chatToggleAction' />
    </>
  );
};

export default RoomManager;