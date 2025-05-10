import { useState, useRef, useEffect } from "react";
import { useModalState } from "../../../../../../context/ModalStateContext";
import { useUserState } from "../../../../../../context/UserStateContext";
import Button from "../../../../Button/Button";
import Input from "../../../../Input/Input";
import './NameChangeForm.css';

interface NameChangeFormProps {
  closeModalOnSubmit?: boolean;
}

export const NameChangeForm = ({ closeModalOnSubmit }: NameChangeFormProps) => {
  const { dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const [name, setName] = useState(userState.name);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChangeName = () => {
    userStateDispatch({ type: 'SET_NAME', payload: name });
    if (closeModalOnSubmit) {
      dispatch({ type: 'CLOSE_MODAL' });
    }
  }

  return (
    <form onSubmit={handleChangeName} className='nameChangeForm'>
      <Input className='nameChangeInput' label='Name' ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} maxLength={30}/>
      <Button className='nameChangeActions' type='submit' disabled={name.length === 0} color='primary'>Submit</Button>
    </form>
  );
}