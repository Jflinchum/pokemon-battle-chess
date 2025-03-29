import { useRef, useEffect } from "react";
import { Sprites } from "@pkmn/img";
import { avatarIdMapping } from "./AvatarUtil";
import { useUserState } from "../../../../../context/UserStateContext";
import { useModalState } from "../../../../../context/ModalStateContext";
import './AvatarChangeModal.css';

const AvatarChangeModal = () => {
  const { dispatch: userStateDispatch } = useUserState();
  const { dispatch } = useModalState();

  const handleAvatarSelect = (id: string) => {
    userStateDispatch({ type: 'SET_AVATAR', payload: `${id}` })
    dispatch({ type: 'CLOSE_MODAL' });
  }

  return (
    <div className='avatarChangeModalContainer'>
      <h2 className='avatarChangeTitle'>Select Avatar</h2>
      <div className='avatarChangeBody'>
        {
          Object.keys(avatarIdMapping).map((id) => (
            <div className='avatarButton' key={id} onClick={() => handleAvatarSelect(id)}>
              <img src={Sprites.getAvatar(id)} />
            </div>
          ))
        }
      </div>
    </div>
  )
};

export default AvatarChangeModal;