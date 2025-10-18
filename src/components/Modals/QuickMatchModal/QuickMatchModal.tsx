import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useModalState } from "../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { socket } from "../../../socket";
import { useSocketRequests } from "../../../util/useSocketRequests";
import Button from "../../common/Button/Button";
import Spinner from "../../common/Spinner/Spinner";
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
  const { dispatch: userStateDispatch } = useUserState();
  const [searching, setSearching] = useState(false);
  const [quickMatchOption, setQuickMatchOption] =
    useState<QuickMatchOption>("random");

  const { requestMatchSearch } = useSocketRequests();

  useEffect(() => {
    let timeout: NodeJS.Timeout | null;
    if (searching) {
      // We set a 2 second delay before starting search in order to allow the user to cancel it if they need to
      timeout = setTimeout(async () => {
        socket.connect();

        try {
          await requestMatchSearch(quickMatchOption);
        } catch (err) {
          toast(`Error: ${err}`, { type: "error" });
        }
      }, 2000);
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  }, [searching, quickMatchOption, requestMatchSearch]);

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

      if (socket.connected) {
        socket.disconnect();
      }
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
