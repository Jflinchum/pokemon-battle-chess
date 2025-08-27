import { createContext, useContext, type Dispatch } from "react";
import { Color } from "chess.js";
import { EndGameReason } from "../../../shared/types/Game.js";

export type ModalName =
  | "ROOM_CODE"
  | "NAME_CHANGE"
  | "CREATE_ROOM"
  | "END_GAME"
  | "HOW_TO_PLAY"
  | "OPTIONS"
  | "CUSTOMIZE"
  | "GENERIC"
  | "QUICK_MATCH"
  | "CREDITS"
  | "";

export interface RoomCodeModalProps {
  roomId: string;
}

export interface EndGameModalProps {
  reason: EndGameReason;
  victor?: Color | "";
  name?: string;
}

export interface GenericModalProps {
  title: string;
  body: string;
}

type ModalStateAction =
  | {
      type: "OPEN_ROOM_MODAL";
      payload: { required?: boolean; modalProps: RoomCodeModalProps };
    }
  | {
      type: "OPEN_QUICK_MATCH_MODAL";
      payload: { required?: boolean; modalProps?: object };
    }
  | {
      type: "OPEN_NAME_MODAL";
      payload: { required?: boolean; modalProps?: object };
    }
  | {
      type: "OPEN_OPTIONS_MODAL";
      payload: { required?: boolean; modalProps?: object };
    }
  | {
      type: "OPEN_GENERIC_MODAL";
      payload: { required?: boolean; modalProps?: GenericModalProps };
    }
  | {
      type: "OPEN_CREATE_ROOM_MODAL";
      payload: { required?: boolean; modalProps?: object };
    }
  | {
      type: "OPEN_HOW_TO_PLAY_MODAL";
      payload: { required?: boolean; modalProps?: object };
    }
  | {
      type: "OPEN_CUSTOMIZE_MODAL";
      payload: { required?: boolean; modalProps?: object };
    }
  | {
      type: "OPEN_END_GAME_MODAL";
      payload: { required?: boolean; modalProps?: EndGameModalProps };
    }
  | {
      type: "OPEN_CREDITS_MODAL";
      payload: { required?: boolean };
    }
  | { type: "CLOSE_MODAL"; payload?: object };

interface ModalState {
  currentModal: ModalName;
  required?: boolean;
  modalProps?: RoomCodeModalProps | EndGameModalProps | GenericModalProps;
}

interface ModalStateType {
  modalState: ModalState;
  dispatch: Dispatch<ModalStateAction>;
}

export const ModalStateContext = createContext<ModalStateType | null>(null);

export const modalStateReducer = (
  modalState: ModalState,
  action: ModalStateAction,
): ModalState => {
  switch (action.type) {
    case "OPEN_QUICK_MATCH_MODAL":
      return {
        ...modalState,
        currentModal: "QUICK_MATCH",
        required: action.payload.required,
      };
    case "OPEN_ROOM_MODAL":
      return {
        ...modalState,
        currentModal: "ROOM_CODE",
        required: action.payload.required,
        modalProps: action.payload.modalProps as RoomCodeModalProps,
      };
    case "OPEN_OPTIONS_MODAL":
      return {
        ...modalState,
        currentModal: "OPTIONS",
        required: action.payload.required,
      };
    case "OPEN_NAME_MODAL":
      return {
        ...modalState,
        currentModal: "NAME_CHANGE",
        required: action.payload.required,
      };
    case "OPEN_CREATE_ROOM_MODAL":
      return {
        ...modalState,
        currentModal: "CREATE_ROOM",
        required: action.payload.required,
      };
    case "OPEN_END_GAME_MODAL":
      return {
        ...modalState,
        currentModal: "END_GAME",
        required: action.payload.required,
        modalProps: action.payload.modalProps as EndGameModalProps,
      };
    case "OPEN_GENERIC_MODAL":
      return {
        ...modalState,
        currentModal: "GENERIC",
        required: action.payload.required,
        modalProps: action.payload.modalProps as GenericModalProps,
      };
    case "OPEN_HOW_TO_PLAY_MODAL":
      return {
        ...modalState,
        currentModal: "HOW_TO_PLAY",
        required: action.payload.required,
      };
    case "OPEN_CUSTOMIZE_MODAL":
      return {
        ...modalState,
        currentModal: "CUSTOMIZE",
        required: action.payload.required,
      };
    case "OPEN_CREDITS_MODAL":
      return {
        ...modalState,
        currentModal: "CREDITS",
        required: action.payload.required,
      };
    case "CLOSE_MODAL":
      return { ...modalState, currentModal: "", required: false };
    default:
      return modalState;
  }
};

export const useModalState = () => {
  return useContext(ModalStateContext) as ModalStateType;
};
