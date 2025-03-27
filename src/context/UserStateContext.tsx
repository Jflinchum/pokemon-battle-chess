import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";
import { getLastRoom, getName, getOrInitializeUUID } from "../utils";
import { leaveRoom } from "../service/lobby";

interface UserState {
  name: string;
  id: string;
  currentRoomId: string;
  currentRoomCode: string;
}

interface UserStateType {
  userState: UserState;
  dispatch: Dispatch<UserStateAction>;
}

type UserStateAction = 
  { type: 'SET_NAME'; payload: string }
  | { type: 'SET_ROOM'; payload: { roomId: string, roomCode: string } }
  | { type: 'JOIN_ROOM'; payload: { roomId: string, roomCode: string } }
  | { type: 'LEAVE_ROOM' };

export const UserStateContext = createContext<UserStateType | null>(null);

export const userStateReducer = (userState: UserState, action: UserStateAction): UserState => {
  switch (action.type) {
    case 'SET_NAME':
      localStorage.setItem('name', action.payload);
      return { ...userState, name: action.payload };
    case 'SET_ROOM':
      localStorage.setItem('mostRecentRoom', action.payload.roomId);
      return { ...userState, currentRoomId: action.payload.roomId, currentRoomCode: action.payload.roomCode };
    case 'LEAVE_ROOM':
      leaveRoom(userState.currentRoomId, userState.id);
      return { ...userState, currentRoomId: '', currentRoomCode: '' };
    case 'JOIN_ROOM':
      localStorage.setItem('mostRecentRoom', action.payload.roomId);
      return { ...userState, currentRoomId: action.payload.roomId, currentRoomCode: action.payload.roomCode } ;
    default:
      return userState;
  }
}

const UserStateProvider = ({ children }: { children: ReactElement }) => {
  const [userState, dispatch] = useReducer(userStateReducer, {
    name: getName(),
    id: getOrInitializeUUID(),
    currentRoomId: getLastRoom(),
    currentRoomCode: '',
  });

  return (
    <UserStateContext.Provider value={{ userState, dispatch }}>
      {children}
    </UserStateContext.Provider>
  );
}

export const useUserState = () => {
  return useContext(UserStateContext) as UserStateType;
}

export default UserStateProvider;