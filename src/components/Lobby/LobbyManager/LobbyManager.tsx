import { useState, useEffect } from "react";
import RoomList from "../RoomList/RoomList";
import MenuOptions from "../MenuOptions/MenuOptions";
import { getAvailableRooms } from "../../../service/lobby";
import { useGameState } from "../../../context/GameStateContext";
import Button from "../../common/Button/Button";
import './LobbyManager.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";

const LobbyManager = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const { dispatch: dispatchGameState } = useGameState();
  const [errorText, setErrorText] = useState('');

  const handleRefreshRoom = (searchTerm = '') => {
    setRefreshDisabled(true);
    setErrorText('');

    const fetchRooms = async () => {
      const response = await getAvailableRooms(currentPage, 10, searchTerm);
      if (response.status === 200) {
        const { data: { rooms, pageCount } } = await response.json();
        setAvailableRooms(rooms || []);
        setTotalPages(pageCount);
      } else {
        setErrorText('Error while getting rooms.');
      }
    }
    fetchRooms();

    setTimeout(() => {
      setRefreshDisabled(false);
    }, 1000);
  }

  useEffect(() => {
    handleRefreshRoom();
    // Whenever we're back at the lobby, reset the room to a clean slate
    dispatchGameState({ type: 'RESET_ROOM' });

    const refreshInterval = setInterval(() => {
      handleRefreshRoom();
    }, 1000 * 10);
    return () => {
      clearInterval(refreshInterval);
    }
  }, []);

  const handleOnSearch = (searchTerm: string) => {
    handleRefreshRoom(searchTerm);
  };

  return (
    <>
      <div className='lobbyContainer'>
        <MenuOptions />
        <div className='roomListLobbyContainer'>
          <h1 className='mainMenuHeader'>Pokemon Chess Arena</h1>
          <div className='roomListContainer'>
            <RoomList availableRooms={availableRooms} errorText={errorText} onSearch={handleOnSearch}/>
            <div className='roomListBottomActions'>
              <div className='paginationActions'>
                <button className='paginationButton' onClick={() => setCurrentPage((curr => curr - 1 <= 0 ? curr : --curr))}>
                  <FontAwesomeIcon icon={faCaretLeft} />
                </button>
                <span className='paginationLabel'>
                  Page: {currentPage} of {totalPages}
                </span>
                <button className='paginationButton' onClick={() => setCurrentPage((curr) => curr + 1 >= totalPages ? curr : ++curr)}>
                  <FontAwesomeIcon icon={faCaretRight} />
                </button>
              </div>
              <Button disabled={refreshDisabled} colorPrimary="brown" className='refreshButton' onClick={handleRefreshRoom}>Refresh Rooms</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LobbyManager;