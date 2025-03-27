import './RoomListItem.css';
import lockIcon from '../../../assets/lockIcon.png'

interface RoomListItem {
  name: string;
  locked: boolean;
  onClick: () => void;
}

const RoomListItem = ({ name, onClick, locked }: RoomListItem) => {
  return (
    <li>
      <button className='roomListItemButton' onClick={onClick}>
        <span>{name}</span>
        { locked && <img className='roomListLockIcon' src={lockIcon} /> }
      </button>
    </li>
  );
};

export default RoomListItem;