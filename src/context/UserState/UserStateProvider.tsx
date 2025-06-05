import { useReducer, ReactElement } from "react";
import {
  get2DSpritePreference,
  getAnimatedBackgroundPreference,
  getAnimationSpeedPreference,
  getAvatar,
  getName,
  getOrInitializeSecretUUID,
  getOrInitializeUUID,
  getVolumePreference,
} from "../../util/localWebData.ts";
import { userStateReducer, UserStateContext } from "./UserStateContext.tsx";

const UserStateProvider = ({ children }: { children: ReactElement }) => {
  const [userState, dispatch] = useReducer(userStateReducer, {
    name: getName(),
    avatarId: getAvatar(),
    id: getOrInitializeUUID(),
    secretId: getOrInitializeSecretUUID(),
    animationSpeedPreference: getAnimationSpeedPreference(),
    volumePreference: getVolumePreference(),
    use2DSprites: get2DSpritePreference(),
    animatedBackgroundEnabled: getAnimatedBackgroundPreference(),
    currentRoomId: "",
    currentRoomCode: "",
  });

  return (
    <UserStateContext value={{ userState, dispatch }}>
      {children}
    </UserStateContext>
  );
};

export default UserStateProvider;
