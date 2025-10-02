import { vi } from "vitest";
import {
  ModalState,
  ModalStateType,
} from "../context/ModalState/ModalStateContext";

export const getMockModalState = (
  overrides: Partial<ModalState> = {},
): ModalState => ({
  currentModal: "",
  ...overrides,
});

export const getMockModalStateContext = (
  modalStateOverrides: Partial<ModalState> = {},
): ModalStateType => {
  const mockDispatch = vi.fn();
  return {
    modalState: getMockModalState(modalStateOverrides),
    dispatch: mockDispatch,
  };
};
