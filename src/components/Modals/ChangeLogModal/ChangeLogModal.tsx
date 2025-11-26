import { useState } from "react";
import Markdown from "react-markdown";
import ButtonLink from "../../common/Button/ButtonLink";
import { PokemonSprite } from "../../common/Pokemon/PokemonSprite/PokemonSprite";
import { changeLog } from "./ChangeLogData/changeLog";
import "./ChangeLogModal.css";

export const ChangeLogModal = () => {
  const [currentPatchNoteIndex, setCurrentPatchNoteIndex] = useState<
    number | null
  >(0);
  return (
    <div className="changeLogModalContainer">
      {currentPatchNoteIndex === null ? (
        <>
          <h2 className="changeLogModalTitle">Previous Patch Notes</h2>
          <div>
            <ul className="changeLogList">
              {changeLog.map((log, index) => {
                return (
                  <li key={index}>
                    <ButtonLink
                      className="changeLogLink"
                      color="light"
                      onClick={() => setCurrentPatchNoteIndex(index)}
                    >
                      {log.version} - {log.title}
                    </ButtonLink>
                    <PokemonSprite
                      className="changeLogLinkMascot"
                      pokemonIdentifier={log.mascot.identifier}
                      gender={log.mascot.gender}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <>
          <h2 className="changeLogModalTitle">
            <PokemonSprite
              className="changeLogMascot"
              pokemonIdentifier={
                changeLog[currentPatchNoteIndex].mascot.identifier
              }
              gender={changeLog[currentPatchNoteIndex].mascot.gender}
            />
            {changeLog[currentPatchNoteIndex].version}{" "}
            {changeLog[currentPatchNoteIndex].title}
          </h2>
          <div className="changeLogBody">
            <Markdown>{changeLog[currentPatchNoteIndex].body}</Markdown>
          </div>
          <ButtonLink
            role="button"
            color="light"
            className="changeLogViewAll"
            onClick={() => setCurrentPatchNoteIndex(null)}
          >
            View Previous Patch Notes
          </ButtonLink>
        </>
      )}
    </div>
  );
};
