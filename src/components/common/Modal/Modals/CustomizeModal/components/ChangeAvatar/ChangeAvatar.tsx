import { Sprites } from "@pkmn/img";
import { avatarIdMapping } from "./avatarUtil";
import { useUserState } from "../../../../../../../context/UserState/UserStateContext";
import "./ChangeAvatar.css";

export const ChangeAvatar = () => {
  const { userState, dispatch } = useUserState();

  const handleAvatarSelect = (id: string) => {
    dispatch({ type: "SET_AVATAR", payload: `${id}` });
  };

  return (
    <div className="avatarChangeBody">
      {Object.keys(avatarIdMapping).map((id) => (
        <button
          className={`avatarButton ${userState.avatarId === id ? "avatarSelected" : ""}`}
          key={id}
          onClick={() => handleAvatarSelect(id)}
        >
          <img src={Sprites.getAvatar(id)} />
        </button>
      ))}
    </div>
  );
};
