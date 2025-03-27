import './RoomListItem.css';

interface RoomListItem {
  name: string;
  onClick: () => void;
}

const RoomListItem = ({ name, onClick }: RoomListItem) => {
  return (
    <li>
      <button className='roomListItemButton' onClick={onClick}>
        {name}
      </button>
    </li>
  );
};

export default RoomListItem;