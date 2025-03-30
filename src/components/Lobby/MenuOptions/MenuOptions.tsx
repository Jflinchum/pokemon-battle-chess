import { Sprites } from "@pkmn/img";
import { useModalState } from "../../../context/ModalStateContext";
import { useUserState } from "../../../context/UserStateContext";
import Button from "../../common/Button/Button";
import PokemonOfTheDay from "../PokemonOfTheDay/PokemonOfTheDay";
import './MenuOptions.css';

const MenuOptions = () => {
  const { dispatch } = useModalState();
  const { userState } = useUserState();

  const handleChangeName = () => {
    dispatch({ type: 'OPEN_NAME_MODAL', payload: {} });
  };

  const handleCreateRoom = () => {
    dispatch({ type: 'OPEN_CREATE_ROOM_MODAL', payload: {} })
  };

  const handleChangeAvatar = () => {
    dispatch({ type: 'OPEN_AVATAR_MODAL', payload: {} })
  }

  return (
    <div className='menuOptions'>
      <ul>
        <li>
          {userState.name && (
            <div>
              <p className='nameContainer'>
                <b>Name: </b>
                <span className='username'>{userState.name}</span>
              </p>
              <div className='avatarContainer'>
                <img src={Sprites.getAvatar(parseInt(userState.avatarId))} />
              </div>
            </div>
          )}
        </li>
        <li>
          <Button colorPrimary="darkgoldenrod" onClick={() => {}}>Find Match (todo)</Button>
        </li>
        <li>
          <Button colorPrimary="green" onClick={handleCreateRoom}>Create New Room</Button>
        </li>
        <li>
          <Button colorPrimary="purple" onClick={handleChangeName}>Change Name</Button>
        </li>
        <li>
          <Button colorPrimary="brown" onClick={handleChangeAvatar}>Change Avatar</Button>
        </li>
        <li>
          <Button colorPrimary="darkblue" onClick={() => {}}>How to play (todo)</Button>
        </li>
      </ul>

      <div className='pokemonOfTheDayContainer'>
        <PokemonOfTheDay />
      </div>
    </div>
  );
};


export default MenuOptions;