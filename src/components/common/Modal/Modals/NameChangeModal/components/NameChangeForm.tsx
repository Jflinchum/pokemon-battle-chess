import { useState, useRef, useEffect } from "react";
import { useModalState } from "../../../../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../../../../context/UserState/UserStateContext";
import Button from "../../../../Button/Button";
import TextInput from "../../../../TextInput/TextInput";
import "./NameChangeForm.css";
import { isStringProfane } from "../../../../../../../shared/util/profanityFilter";
import { toast } from "react-toastify";

interface NameChangeFormProps {
  closeModalOnSubmit?: boolean;
}

const isNameValid = (str: string) => {
  return !isStringProfane(str);
};

export const NameChangeForm = ({ closeModalOnSubmit }: NameChangeFormProps) => {
  const { dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const [name, setName] = useState(userState.name);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChangeName = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStringProfane(name)) {
      toast("Error: Cannot accept this name due to our profanity filters.", {
        type: "error",
      });
      return;
    }
    userStateDispatch({ type: "SET_NAME", payload: name });
    if (closeModalOnSubmit) {
      dispatch({ type: "CLOSE_MODAL" });
    } else {
      toast("Name set!", { type: "success" });
    }
  };

  return (
    <form onSubmit={handleChangeName} className="nameChangeForm">
      <TextInput
        className="nameChangeInput"
        label="Name"
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        valid={isNameValid(name)}
      />
      <Button
        className="nameChangeActions"
        type="submit"
        disabled={name.length === 0}
        color="primary"
      >
        Submit
      </Button>
    </form>
  );
};
