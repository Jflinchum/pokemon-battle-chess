import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretLeft,
  faCaretRight,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import RoomList from "../RoomList/RoomList";
import MenuOptions from "../MenuOptions/MenuOptions";
import { getAvailableRooms } from "../../../service/lobby";
import { useGameState } from "../../../context/GameState/GameStateContext";
import AnimatedBackground from "../../AnimatedBackground/AnimatedBackground";
import { useMusicPlayer } from "../../../util/useMusicPlayer";
import usePageVisibility from "../../../util/usePageVisibility";
import "./LobbyManager.css";

const LobbyManager = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const { dispatch: dispatchGameState } = useGameState();
  const { isVisible } = usePageVisibility();

  const { stopSongs } = useMusicPlayer();
  useEffect(() => {
    stopSongs();
  }, [stopSongs]);

  const handleRefreshRoom = useCallback(
    (searchTerm = "") => {
      setRefreshDisabled(true);

      const fetchRooms = async () => {
        const response = await getAvailableRooms(currentPage, 10, searchTerm);
        if (response.status === 200) {
          const {
            data: { rooms, pageCount },
          } = await response.json();
          setAvailableRooms(rooms || []);
          setTotalPages(pageCount);
        } else {
          toast("Error: Could not get rooms.", { type: "error" });
        }
      };
      fetchRooms();

      setTimeout(() => {
        setRefreshDisabled(false);
      }, 1000);
    },
    [currentPage],
  );

  useEffect(() => {
    handleRefreshRoom();
    // Whenever we're back at the lobby, reset the room to a clean slate
    dispatchGameState({ type: "RESET_ROOM" });

    let refreshInterval: NodeJS.Timeout;
    if (isVisible) {
      refreshInterval = setInterval(() => {
        handleRefreshRoom();
      }, 1000 * 20);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isVisible, dispatchGameState, handleRefreshRoom]);

  const handleOnSearch = (searchTerm: string) => {
    handleRefreshRoom(searchTerm);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="lobbyContainer">
        <MenuOptions />
        <div className="roomListLobbyContainer">
          <h1 className="mainMenuHeader">Pokemon Gambit</h1>
          <div className="roomListContainer">
            <RoomList
              availableRooms={availableRooms}
              onSearch={handleOnSearch}
            />
            <div className="roomListBottomActions">
              <div className="paginationActions">
                <button
                  aria-label="Page Left"
                  className="paginationButton"
                  onClick={() =>
                    setCurrentPage((curr) => (curr - 1 <= 0 ? curr : --curr))
                  }
                >
                  <FontAwesomeIcon icon={faCaretLeft} />
                </button>
                <span className="paginationLabel">
                  Page:{" "}
                  <span>
                    {currentPage} of {totalPages}
                  </span>
                </span>
                <button
                  aria-label="Page Right"
                  className="paginationButton"
                  onClick={() =>
                    setCurrentPage((curr) =>
                      curr >= totalPages ? curr : ++curr,
                    )
                  }
                >
                  <FontAwesomeIcon icon={faCaretRight} />
                </button>
              </div>
              <button
                aria-label="Refresh"
                disabled={refreshDisabled}
                className="refreshButton"
                onClick={() => handleRefreshRoom()}
              >
                <FontAwesomeIcon size="2x" icon={faRefresh} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LobbyManager;
