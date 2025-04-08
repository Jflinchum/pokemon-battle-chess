import { Sprites } from "@pkmn/img";
import { useModalState } from "../../../context/ModalStateContext";
import { useUserState } from "../../../context/UserStateContext";
import PokemonOfTheDay from "../PokemonOfTheDay/PokemonOfTheDay";
import './MenuOptions.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChessKing, faDoorOpen, faFaceGrin, faNoteSticky, faPencil, faX } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

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

  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className='menuMobileNav'>
        <button onClick={() => setOpen(!open)} className='menuMobileButton'>
          <span>
            <FontAwesomeIcon size='2x' icon={open ? faX : faBars}/>
          </span>
        </button>
      </div>
      <div className={`menuOptions ${open ? 'menuOptionsOpen' : 'menuOptionsClose'}`}>
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
          <li className='menuOptionButtonContainer'>
            <button className='menuOptionButton' onClick={() => {}}>
              <FontAwesomeIcon icon={faChessKing}/> Find Match (todo)
            </button>
          </li>
          <li className='menuOptionButtonContainer'>
            <button className="menuOptionButton" onClick={handleCreateRoom}>
              <FontAwesomeIcon icon={faDoorOpen} /> Create New Room
            </button>
          </li>
          <li className='menuOptionButtonContainer'>
            <button className="menuOptionButton" onClick={handleChangeName}>
              <FontAwesomeIcon icon={faPencil}/> Change Name
            </button>
          </li>
          <li className='menuOptionButtonContainer'>
            <button className="menuOptionButton" onClick={handleChangeAvatar}>
              <FontAwesomeIcon icon={faFaceGrin} /> Change Avatar
            </button>
          </li>
          <li className='menuOptionButtonContainer'>
            <button className="menuOptionButton" onClick={handleHowToPlay}>
              <FontAwesomeIcon icon={faNoteSticky}/> How to play
            </button>
          </li>
        </ul>

        <div className='pokemonOfTheDayContainer'>
          <PokemonOfTheDay />
        </div>
      </div>
    </div>
  );
};


export default MenuOptions;