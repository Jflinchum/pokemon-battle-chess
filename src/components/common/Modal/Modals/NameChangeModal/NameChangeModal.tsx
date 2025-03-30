import { useState, useRef, useEffect } from "react";
import { useModalState } from "../../../../../context/ModalStateContext";
import Button from "../../../Button/Button";
import { useUserState } from "../../../../../context/UserStateContext";
import './NameChangeModal.css';

const NameChangeModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const [name, setName] = useState(userState.name);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChangeName = () => {
    userStateDispatch({ type: 'SET_NAME', payload: name });
    dispatch({ type: 'CLOSE_MODAL' });
  }

  const handleCancel = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  return (
    <div className='nameChangeModalContainer'>
      <h2 className='nameChangeTitle'>Enter Name</h2>
      <form onSubmit={handleChangeName}>
        {
          modalState.required && (
            <span>Before you can play any games, you need to enter a name!</span>
          )
        }
        <div>
          <label>Name:</label>
          <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} maxLength={30}/>
        </div>
        <div>

          {
            (modalState.required ? null : (
              <Button type='button' colorPrimary="brown" onClick={handleCancel}>Cancel</Button>
            ))
          }
          <Button type='submit' disabled={name.length === 0} colorPrimary="green">Submit</Button>
        </div>
      </form>
    </div>
  )
};

export default NameChangeModal;