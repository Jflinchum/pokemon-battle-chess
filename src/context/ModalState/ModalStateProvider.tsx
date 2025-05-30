import { useReducer, ReactElement } from "react";
import { modalStateReducer, ModalStateContext } from "./ModalStateContext";
import Modal from "../../components/common/Modal/Modal";

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
