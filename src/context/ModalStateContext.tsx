import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";
import Modal from "../components/common/Modal/Modal";
import { Color } from "chess.js";
import { EndGameReason } from "../../shared/types/game";

type ModalName = 'ROOM_CODE' | 'NAME_CHANGE' | 'AVATAR_CHANGE' | 'CREATE_ROOM' | 'END_GAME' | 'HOW_TO_PLAY' | '';

export interface RoomCodeModalProps {
  roomId: string;
}

export interface EndGameModalProps {
  reason: EndGameReason;
  victor?: Color;
  name?: string;
}

type ModalProps = RoomCodeModalProps | EndGameModalProps | undefined;

type ModalStateAction = 
  { type: 'OPEN_ROOM_MODAL'; payload: { required?: boolean, modalProps: ModalProps }; }
  | { type: 'OPEN_NAME_MODAL'; payload: { required?: boolean, modalProps?: {} }; }
  | { type: 'OPEN_AVATAR_MODAL'; payload: { required?: boolean, modalProps?: {} }; }
  | { type: 'OPEN_CREATE_ROOM_MODAL'; payload: { required?: boolean, modalProps?: {} }; }
  | { type: 'OPEN_HOW_TO_PLAY_MODAL'; payload: { required?: boolean, modalProps?: {} }; }
  | { type: 'OPEN_END_GAME_MODAL'; payload: { required?: boolean, modalProps?: EndGameModalProps }; }
  | { type: 'CLOSE_MODAL'; payload?: {} };

interface ModalState {
  currentModal: ModalName;
  required?: boolean;
  modalProps?: RoomCodeModalProps | EndGameModalProps;
}

interface ModalStateType {
  modalState: ModalState;
  dispatch: Dispatch<ModalStateAction>;
}

export const ModalStateContext = createContext<ModalStateType | null>(null);

export const modalStateReducer = (modalState: ModalState, action: ModalStateAction): ModalState => {
  switch (action.type) {
    case 'OPEN_ROOM_MODAL':
      return { ...modalState, currentModal: 'ROOM_CODE', required: action.payload.required, modalProps: action.payload.modalProps as RoomCodeModalProps };
    case 'OPEN_NAME_MODAL':
      return { ...modalState, currentModal: 'NAME_CHANGE', required: action.payload.required };
    case 'OPEN_AVATAR_MODAL':
      return { ...modalState, currentModal: 'AVATAR_CHANGE', required: action.payload.required };
    case 'OPEN_CREATE_ROOM_MODAL':
      return { ...modalState, currentModal: 'CREATE_ROOM', required: action.payload.required };
    case 'OPEN_END_GAME_MODAL':
      return { ...modalState, currentModal: 'END_GAME', required: action.payload.required, modalProps: action.payload.modalProps as EndGameModalProps };
    case 'OPEN_HOW_TO_PLAY_MODAL':
      return { ...modalState, currentModal: 'HOW_TO_PLAY', required: action.payload.required };
    case 'CLOSE_MODAL':
      return { ...modalState, currentModal: '', required: false };
    default:
      return modalState;
  }
}

const ModalStateProvider = ({ children }: { children: ReactElement }) => {
  const [modalState, dispatch] = useReducer(modalStateReducer, { currentModal: '', required: false });

  return (
    <ModalStateContext value={{ modalState, dispatch }}>
      <Modal />
      {children}
    </ModalStateContext>
  );
}

export const useModalState = () => {
  return useContext(ModalStateContext) as ModalStateType;
}

export default ModalStateProvider;