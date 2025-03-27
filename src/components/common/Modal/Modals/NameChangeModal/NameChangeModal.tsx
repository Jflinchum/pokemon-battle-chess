import { useState } from "react";
import { useModalState } from "../../../../../context/ModalStateContext";
import Button from "../../../Button/Button";
import { useUserState } from "../../../../../context/UserStateContext";
import './NameChangeModal.css';

const NameChangeModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const [name, setName] = useState(userState.name);

  const handleChangeName = () => {
    userStateDispatch({ type: 'SET_NAME', payload: name });
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
          <input value={name} onChange={(e) => setName(e.target.value)}/>
        </div>
        <div>
          <Button disabled={name.length === 0} colorPrimary="green" onClick={handleChangeName}>Submit</Button>
        </div>
      </form>
    </div>
  )
};

export default NameChangeModal;