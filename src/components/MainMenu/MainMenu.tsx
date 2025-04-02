import LobbyManager from '../Lobby/LobbyManager/LobbyManager'
import RoomManager from '../Room/RoomManager';
import { useUserState } from '../../context/UserStateContext';
import './MainMenu.css';
import { useEffect } from 'react';
import { useModalState } from '../../context/ModalStateContext';
import { Dex } from '@pkmn/sim';

const MainMenu = () => {
  const { userState } = useUserState();
  const { dispatch } = useModalState();
  useEffect(() => {
    if (!Dex.formats.get('pokemonBattleChess')) {
      Dex.formats.extend([{
        name: 'pokemonbattlechess',
        mod: 'gen9',
        onBattleStart: () => {
          console.log(this);
          debugger;
        },
        onBegin: () => {
          console.log(this);
          debugger;
        }
      }]);
    }
  }, []);

  useEffect(() => {
    if (userState.name.length === 0) {
      dispatch({ type: 'OPEN_NAME_MODAL', payload: { required: true } });
      return;
    }
  }, [])
  return (
    <>
      {
        userState.currentRoomId ?
        (<RoomManager />) :
        (<LobbyManager />)
      }
    </>
  );
}

export default MainMenu;