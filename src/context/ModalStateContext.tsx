import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";
import Modal from "../components/common/Modal/Modal";

type ModalName = 'ROOM_CODE' | '';

interface RoomCodeModalProps {
  roomId: string;
}

type ModalStateAction = 
  { type: 'OPEN_ROOM_MODAL'; payload: { required?: boolean, modalProps: RoomCodeModalProps }; }
  | { type: 'CLOSE_MODAL'; };

interface ModalState {
  currentModal: ModalName;
  required?: boolean;
  modalProps?: RoomCodeModalProps;
}

interface ModalStateType {
  modalState: ModalState;
  dispatch: Dispatch<ModalStateAction>;
}

export const ModalStateContext = createContext<ModalStateType | null>(null);

export const modalStateReducer = (modalState: ModalState, action: ModalStateAction): ModalState => {
  switch (action.type) {
    case 'OPEN_ROOM_MODAL':
      return { ...modalState, currentModal: 'ROOM_CODE', required: action.payload.required, modalProps: action.payload.modalProps };
    case 'CLOSE_MODAL':
      return { ...modalState, currentModal: '', required: false };
    default:
      return modalState;
  }
}

const ModalStateProvider = ({ children }: { children: ReactElement }) => {
  const [modalState, dispatch] = useReducer(modalStateReducer, { currentModal: '', required: false });

  return (
    <ModalStateContext.Provider value={{ modalState, dispatch }}>
      <Modal />
      {children}
    </ModalStateContext.Provider>
  );
}

export const useModalState = () => {
  return useContext(ModalStateContext) as ModalStateType;
}

export default ModalStateProvider;