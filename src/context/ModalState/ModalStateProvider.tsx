import { ReactElement, useReducer } from "react";
import Modal from "../../components/common/Modal/Modal";
import { ModalStateContext, modalStateReducer } from "./ModalStateContext";

const ModalStateProvider = ({ children }: { children: ReactElement }) => {
  const [modalState, dispatch] = useReducer(modalStateReducer, {
    currentModal: "",
    required: false,
  });

  return (
    <ModalStateContext value={{ modalState, dispatch }}>
      <Modal />
      {children}
    </ModalStateContext>
  );
};

export default ModalStateProvider;
