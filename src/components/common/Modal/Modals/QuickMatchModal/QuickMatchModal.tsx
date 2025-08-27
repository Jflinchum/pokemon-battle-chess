import { useEffect, useState } from "react";
import { useModalState } from "../../../../../context/ModalState/ModalStateContext";
import Button from "../../../Button/Button";
import { useUserState } from "../../../../../context/UserState/UserStateContext";
import Spinner from "../../../Spinner/Spinner";
import { socket } from "../../../../../socket";
import "./QuickMatchModal.css";

type QuickMatchOption = "random" | "draft";

const quickMatchOptionDescriptionMapping: Record<QuickMatchOption, string> = {
  random: "Pokemon will be randomly assigned to each Chess piece.",
  draft:
    "Both players are given a pool of Pokemon to pick and choose from. After banning 3 Pokemon from the pool each, players will take turns picking a Pokemon and assigning" +
    " it to their Chess pieces.",
};

const QuickMatchModal = () => {
  const { dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const [searching, setSearching] = useState(false);
  const [quickMatchOption, setQuickMatchOption] =
    useState<QuickMatchOption>("random");

  useEffect(() => {
    let timeout: NodeJS.Timeout | null;
    if (searching) {
      // We set a 1 second delay before starting search in order to allow the user to cancel it if they need to
      timeout = setTimeout(() => {
        socket.connect();
        socket.emit("matchSearch", {
          playerId: userState.id,
          playerName: userState.name,
          avatarId: userState.avatarId,
          secretId: userState.secretId,
          matchQueue: quickMatchOption,
        });
      }, 1000);
    } else {
      socket.disconnect();
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  }, [
    searching,
    quickMatchOption,
    userState.avatarId,
    userState.name,
    userState.id,
    userState.secretId,
  ]);

  useEffect(() => {
    socket.on("foundMatch", async ({ roomId }) => {
      setSearching(false);

      userStateDispatch({
        type: "JOIN_ROOM",
        payload: { roomId, roomCode: "" },
      });
      dispatch({ type: "CLOSE_MODAL" });
    });

    return () => {
      socket.off("foundMatch");
      socket.disconnect();
    };
  }, [dispatch, userStateDispatch]);

  const handleCancelClick = () => {
    socket.disconnect();
    dispatch({ type: "CLOSE_MODAL" });
  };

  return (
    <div className="quickMatchModalContainer">
      <h2 className="quickMatchTitle">Quick Play</h2>
      <div className="quickMatchContainer">
        <div className="quickMatchOptionContainer">
          <div className="quickMatchSearchOptions">
            <Button
              type="button"
              highlighted={quickMatchOption === "random"}
              onClick={() => setQuickMatchOption("random")}
            >
              Random Battles
            </Button>
            <Button
              type="button"
              highlighted={quickMatchOption === "draft"}
              onClick={() => setQuickMatchOption("draft")}
            >
              Draft Battles
            </Button>
          </div>
          <div className="quickMatchSearchDescription">
            <p>{quickMatchOptionDescriptionMapping[quickMatchOption]}</p>
            <p>
              The match will have a 15 minute timer. Weather will appear
              throughout the match on each Chess square. If a Pokemon piece
              attacks an opponent Pokemon, the attacking piece will gain a minor
              Speed buff.
            </p>
          </div>
        </div>
        <div className="quickMatchActions">
          <Button type="button" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button
            className="quickMatchSubmit"
            type="submit"
            color="primary"
            onClick={() => setSearching((curr) => !curr)}
          >
            {searching ? <Spinner className="quickMatchSpinner" /> : null}
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickMatchModal;
