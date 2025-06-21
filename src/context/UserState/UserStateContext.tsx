import { createContext, useContext, type Dispatch } from "react";
import {
  clearMostRecentRoom,
  set2DSpritePreference,
  setAnimatedBackgroundPreference,
  setAnimationSpeedPreference,
  setAvatar,
  setMostRecentRoom,
  setName,
  setVolumePreference,
} from "../../util/localWebData.ts";
import { leaveRoom } from "../../service/lobby.tsx";
import { ChatMessage } from "../../components/RoomManager/Chat/ChatDisplay/ChatDisplay.tsx";

export interface VolumePreference {
  pieceVolume: number;
  pokemonBattleVolume: number;
  musicVolume: number;
}

interface UserState {
  name: string;
  avatarId: string;
  id: string;
  secretId: string;
  animationSpeedPreference: number;
  volumePreference: VolumePreference;
  use2DSprites: boolean;
  animatedBackgroundEnabled: boolean;
  currentRoomId: string;
  currentRoomCode: string;
  chatHistory: ChatMessage[];
}

interface UserStateType {
  userState: UserState;
  dispatch: Dispatch<UserStateAction>;
}

type UserStateAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_AVATAR"; payload: string }
  | { type: "SET_ANIMATION_SPEED_PREFERENCE"; payload: number }
  | { type: "SET_VOLUME_PREFERENCE"; payload: Partial<VolumePreference> }
  | { type: "SET_2D_SPRITE_PREFERENCE"; payload: boolean }
  | { type: "SET_ANIMATED_BACKGROUND_PREFERENCE"; payload: boolean }
  | { type: "PUSH_CHAT_HISTORY"; payload: ChatMessage }
  | { type: "SET_ROOM"; payload: { roomId: string; roomCode: string } }
  | { type: "JOIN_ROOM"; payload: { roomId: string; roomCode: string } }
  | { type: "LEAVE_ROOM" };

export const UserStateContext = createContext<UserStateType | null>(null);

export const userStateReducer = (
  userState: UserState,
  action: UserStateAction,
): UserState => {
  switch (action.type) {
    case "SET_NAME":
      setName(action.payload);
      return { ...userState, name: action.payload };
    case "SET_AVATAR":
      setAvatar(action.payload);
      return { ...userState, avatarId: action.payload };
    case "SET_ANIMATION_SPEED_PREFERENCE":
      setAnimationSpeedPreference(action.payload);
      return { ...userState, animationSpeedPreference: action.payload };
    case "SET_VOLUME_PREFERENCE": {
      const newVolumePreference = {
        ...userState.volumePreference,
        ...action.payload,
      };
      setVolumePreference(newVolumePreference);
      return { ...userState, volumePreference: newVolumePreference };
    }
    case "SET_2D_SPRITE_PREFERENCE":
      set2DSpritePreference(action.payload);
      return { ...userState, use2DSprites: action.payload };
    case "SET_ANIMATED_BACKGROUND_PREFERENCE":
      setAnimatedBackgroundPreference(action.payload);
      return { ...userState, animatedBackgroundEnabled: action.payload };
    case "SET_ROOM":
      setMostRecentRoom({
        roomId: action.payload.roomId,
        roomCode: action.payload.roomCode,
      });
      return {
        ...userState,
        currentRoomId: action.payload.roomId,
        currentRoomCode: action.payload.roomCode,
        chatHistory: [],
      };
    case "LEAVE_ROOM":
      leaveRoom(userState.currentRoomId, userState.id);
      clearMostRecentRoom();
      return {
        ...userState,
        currentRoomId: "",
        currentRoomCode: "",
        chatHistory: [],
      };
    case "JOIN_ROOM":
      setMostRecentRoom({
        roomId: action.payload.roomId,
        roomCode: action.payload.roomCode,
      });
      return {
        ...userState,
        currentRoomId: action.payload.roomId,
        currentRoomCode: action.payload.roomCode,
        chatHistory: [],
      };
    case "PUSH_CHAT_HISTORY":
      return {
        ...userState,
        chatHistory: [...userState.chatHistory, action.payload],
      };
    default:
      return userState;
  }
};

export const useUserState = () => {
  return useContext(UserStateContext) as UserStateType;
};
