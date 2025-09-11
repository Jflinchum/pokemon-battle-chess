import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Button from "../../../Button/Button";
import "./CreditsModal.css";

const CreditsModal = () => {
  return (
    <div className="creditsModalContainer">
      <h2 className="creditsModalTitle">Credits</h2>
      <div className="creditsModalBody">
        <p>
          Pokemon Gambit is a non profit, open source project. All rights to The
          Pokémon Company®
        </p>
        <p>
          Created and developed by{" "}
          <a href="https://jflinchum.github.io/personal-webapp/">
            Jonathan Flinchum
          </a>
          <span className="creditsModalSubtext">
            If you're looking to hire a software engineer and like what you see,
            consider reaching out!
          </span>
        </p>
        <p>
          Huge thanks to Pokemon Showdown for their open source Pokemon Battle
          Simulator.
        </p>
        <p>
          <span>Chess Assets - Cburnett</span>
          <br />
          <span>Chess Engine - https://github.com/jhlywa/chess.js</span>
        </p>

        <div>
          {
            // TODO - make this an a tag
          }
          <Button
            onClick={() =>
              (window.location.href =
                "https://github.com/Jflinchum/pokemon-battle-chess")
            }
            className="creditsGithubButton"
          >
            <FontAwesomeIcon icon={faGithub} size="3x" />
            <span>Github</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreditsModal;
