import { ReactElement, useReducer } from "react";
import {
  get2DSpritePreference,
  getAnimatedBackgroundPreference,
  getAnimationSpeedPreference,
  getAvatar,
  getName,
  getOrInitializeSecretUUID,
  getOrInitializeUUID,
  getPremovingPreference,
  getVolumePreference,
} from "../../util/localWebData.ts";
import { UserStateContext, userStateReducer } from "./UserStateContext.tsx";

const UserStateProvider = ({ children }: { children: ReactElement }) => {
  const [userState, dispatch] = useReducer(userStateReducer, {
    name: getName(),
    avatarId: getAvatar(),
    id: getOrInitializeUUID(),
    secretId: getOrInitializeSecretUUID(),
    animationSpeedPreference: getAnimationSpeedPreference(),
    volumePreference: getVolumePreference(),
    use2DSprites: get2DSpritePreference(),
    enablePremoving: getPremovingPreference(),
    animatedBackgroundEnabled: getAnimatedBackgroundPreference(),
    currentRoomId: "",
    currentRoomCode: "",
    chatHistory: [],
  });

  return (
    <UserStateContext value={{ userState, dispatch }}>
      {children}
    </UserStateContext>
  );
};

export default UserStateProvider;
