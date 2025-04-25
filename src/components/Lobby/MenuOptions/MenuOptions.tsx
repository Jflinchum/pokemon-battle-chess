import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChessKing, faDoorOpen, faFaceGrin, faNoteSticky, faPencil } from "@fortawesome/free-solid-svg-icons";
import { useModalState } from "../../../context/ModalStateContext";
import { useUserState } from "../../../context/UserStateContext";
import PokemonOfTheDay from "../PokemonOfTheDay/PokemonOfTheDay";
import NavOptions from "../../common/NavOptions/NavOptions";
import { NavOptionButton } from "../../common/NavOptions/NavOptionButton/NavOptionButton";
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

  const handleHowToPlay = () => {
    dispatch({ type: 'OPEN_HOW_TO_PLAY_MODAL', payload: {} })
  }

  return (
    <NavOptions>
      <div className='menuOptions'>
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
        <NavOptionButton className='menuOptionButtonContainer' onClick={() => {}}>
          <FontAwesomeIcon icon={faChessKing}/>
          <span>Find Match (todo)</span>
        </NavOptionButton>
        <NavOptionButton className='menuOptionButtonContainer' onClick={handleCreateRoom}>
          <FontAwesomeIcon icon={faDoorOpen} />
          <span>Create New Room</span>
        </NavOptionButton>
        <NavOptionButton className='menuOptionButtonContainer' onClick={handleChangeName}>
          <FontAwesomeIcon icon={faPencil}/>
          <span>Change Name</span>
        </NavOptionButton>
        <NavOptionButton className='menuOptionButtonContainer' onClick={handleChangeAvatar}>
          <FontAwesomeIcon icon={faFaceGrin} />
          <span>Change Avatar</span>
        </NavOptionButton>
        <NavOptionButton className='menuOptionButtonContainer' onClick={handleHowToPlay}>
          <FontAwesomeIcon icon={faNoteSticky}/>
          <span>How to play</span>
        </NavOptionButton>
      </div>

      <div className='pokemonOfTheDayContainer'>
        <PokemonOfTheDay />
      </div>
    </NavOptions>
  );
};


export default MenuOptions;