import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";
import { get2DSpritePreference, getAnimationSpeedPreference, getAvatar, getName, getOrInitializeSecretUUID, getOrInitializeUUID, getVolumePreference, set2DSpritePreference, setAnimationSpeedPreference, setAvatar, setName, setVolumePreference } from "../util/localWebData.ts";
import { leaveRoom } from "../service/lobby";

export interface VolumePreference {
  pieceVolume: number;
  musicVolume: number;
}

interface UserState {
  name: string;
  avatarId: string;
  id: string;
  secretId: string;
  animationSpeedPreference: number;
  volumePreference: VolumePreference,
  use2DSprites: boolean;
  currentRoomId: string;
  currentRoomCode: string;
}

interface UserStateType {
  userState: UserState;
  dispatch: Dispatch<UserStateAction>;
}

type UserStateAction = 
  { type: 'SET_NAME'; payload: string }
  | { type: 'SET_AVATAR'; payload: string }
  | { type: 'SET_ANIMATION_SPEED_PREFERENCE'; payload: number }
  | { type: 'SET_VOLUME_PREFERENCE'; payload: Partial<VolumePreference> }
  | { type: 'SET_2D_SPRITE_PREFERENCE'; payload: boolean }
  | { type: 'SET_ROOM'; payload: { roomId: string, roomCode: string } }
  | { type: 'JOIN_ROOM'; payload: { roomId: string, roomCode: string } }
  | { type: 'LEAVE_ROOM' };

export const UserStateContext = createContext<UserStateType | null>(null);

export const userStateReducer = (userState: UserState, action: UserStateAction): UserState => {
  switch (action.type) {
    case 'SET_NAME':
      setName(action.payload);
      return { ...userState, name: action.payload };
    case 'SET_AVATAR':
      setAvatar(action.payload);
      return { ...userState, avatarId: action.payload };
    case 'SET_ANIMATION_SPEED_PREFERENCE':
      setAnimationSpeedPreference(action.payload);
      return { ...userState, animationSpeedPreference: action.payload };
    case 'SET_VOLUME_PREFERENCE':
      const newVolumePreference = { ...userState.volumePreference, ...action.payload };
      setVolumePreference(newVolumePreference);
      return { ...userState, volumePreference: newVolumePreference };
    case 'SET_2D_SPRITE_PREFERENCE':
      set2DSpritePreference(action.payload);
      return { ...userState, use2DSprites: action.payload };
    case 'SET_ROOM':
      return { ...userState, currentRoomId: action.payload.roomId, currentRoomCode: action.payload.roomCode };
    case 'LEAVE_ROOM':
      leaveRoom(userState.currentRoomId, userState.id);
      return { ...userState, currentRoomId: '', currentRoomCode: '' };
    case 'JOIN_ROOM':
      return { ...userState, currentRoomId: action.payload.roomId, currentRoomCode: action.payload.roomCode } ;
    default:
      return userState;
  }
}

const UserStateProvider = ({ children }: { children: ReactElement }) => {
  const [userState, dispatch] = useReducer(userStateReducer, {
    name: getName(),
    avatarId: getAvatar(),
    id: getOrInitializeUUID(),
    secretId: getOrInitializeSecretUUID(),
    animationSpeedPreference: getAnimationSpeedPreference(),
    volumePreference: getVolumePreference(),
    use2DSprites: get2DSpritePreference(),
    currentRoomId: '',
    currentRoomCode: '',
  });

  return (
    <UserStateContext value={{ userState, dispatch }}>
      {children}
    </UserStateContext>
  );
}

export const useUserState = () => {
  return useContext(UserStateContext) as UserStateType;
}

export default UserStateProvider;