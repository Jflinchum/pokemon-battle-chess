interface RoomListItem {
  name: string;
  onClick: () => void;
}

const RoomListItem = ({ name, onClick }: RoomListItem) => {
  return (
    <li>
      <div onClick={onClick}>
        {name}
      </div>
    </li>
  );
};

export default RoomListItem;