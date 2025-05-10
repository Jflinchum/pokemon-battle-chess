import { Sprites } from "@pkmn/img";
import { avatarIdMapping } from "./avatarUtil";
import { useUserState } from "../../../../../../../context/UserStateContext";
import './ChangeAvatar.css';

export const ChangeAvatar = () => {
  const { dispatch } = useUserState();

  const handleAvatarSelect = (id: string) => {
    dispatch({ type: 'SET_AVATAR', payload: `${id}` })
  }

  return (
    <div className='avatarChangeBody'>
      {
        Object.keys(avatarIdMapping).map((id) => (
          <button className='avatarButton' key={id} onClick={() => handleAvatarSelect(id)}>
            <img src={Sprites.getAvatar(id)} />
          </button>
        ))
      }
    </div>
  );
}