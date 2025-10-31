import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Markdown from "react-markdown";
import { PokemonSprite } from "../../common/Pokemon/PokemonSprite/PokemonSprite";
import { changeLog } from "./ChangeLogData/changeLog";
import "./ChangeLogModal.css";

export const ChangeLogModal = () => {
  const [currentPage, setCurrentPage] = useState(0);
  return (
    <div className="changeLogModalContainer">
      <h2 className="changeLogModalTitle">
        <PokemonSprite
          className="changeLogMascot"
          pokemonIdentifier={changeLog[currentPage].mascot.identifier}
          gender={changeLog[currentPage].mascot.gender}
        />
        {changeLog[currentPage].version} {changeLog[currentPage].title}
      </h2>
      <div className="changeLogBody">
        <Markdown>{changeLog[currentPage].body}</Markdown>
      </div>
      <button
        aria-label="Page Left"
        className="changeLogPaginationButton"
        onClick={() => setCurrentPage((curr) => (curr <= 0 ? curr : --curr))}
      >
        <FontAwesomeIcon icon={faCaretLeft} />
      </button>
      <span className="paginationLabel">
        Page:{" "}
        <span>
          {currentPage + 1} of {changeLog.length}
        </span>
      </span>
      <button
        aria-label="Page Right"
        className="changeLogPaginationButton"
        onClick={() =>
          setCurrentPage((curr) =>
            curr + 1 >= changeLog.length ? curr : ++curr,
          )
        }
      >
        <FontAwesomeIcon icon={faCaretRight} />
      </button>
    </div>
  );
};
