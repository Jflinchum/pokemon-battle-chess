import { Pokemon } from "@pkmn/client";
import { Move } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import PokemonMoveButton from "../../../../common/PokemonMoveButton/PokemonMoveButton";
import { PokemonMoveTooltip } from "../PokemonMoveTooltip/PokemonMoveTooltip";
import {
  doesMoveDoDamage,
  getTypeEffectiveness,
} from "./../../../../../util/pokemonUtil";
import "./PokemonMoveInfoButton.css";

interface PokemonMoveInfoButtonProps {
  move: string;
  disabled?: boolean;
  pp?: number;
  maxpp?: number;
  onMoveSelect?: (move: string) => void;
  currentPokemon?: Pokemon | null;
  opponentPokemon?: Pokemon | null;
}

const getMoveButtonColor = (moveType: Move["type"]) => {
  switch (moveType) {
    case "Normal":
      return "#aca596";
    case "Water":
      return "#508dd6";
    case "Grass":
      return "#8fcb63";
    case "Fire":
      return "#e55e3f";
    case "Electric":
      return "#f7c753";
    case "Rock":
      return "#b8a038";
    case "Flying":
      return "#9eaef1";
    case "Poison":
      return "#a960a1";
    case "Bug":
      return "#b0bb44";
    case "Psychic":
      return "#f85888";
    case "Dark":
      return "#705848";
    case "Ground":
      return "#d1b568";
    case "Ice":
      return "#a1d8d5";
    case "Dragon":
      return "#7668df";
    case "Ghost":
      return "#705898";
    case "Steel":
      return "#adadc4";
    case "Fighting":
      return "#903028";
    case "Fairy":
      return "#e58fe1";
    default:
      return "#d8d5de";
  }
};

const PokemonMoveInfoButton = ({
  move,
  pp,
  maxpp,
  disabled,
  onMoveSelect = () => {},
  currentPokemon,
  opponentPokemon,
}: PokemonMoveInfoButtonProps) => {
  const dexMoveInfo = Dex.moves.get(move);
  const { effectiveness, notImmune } = getTypeEffectiveness(
    dexMoveInfo,
    currentPokemon,
    opponentPokemon,
  );

  return (
    <PokemonMoveButton
      id={move}
      disabled={disabled}
      colorPrimary={getMoveButtonColor(dexMoveInfo.type)}
      onClick={() => {
        onMoveSelect(move);
      }}
      toolTip={PokemonMoveTooltip({ move })}
    >
      <p className="pokemonMoveName">{dexMoveInfo.name}</p>

      <div className="pokemonMoveSubInfo">
        {dexMoveInfo.type && (
          <span className="pokemonMoveTyping">{dexMoveInfo.type}</span>
        )}

        {effectiveness !== undefined &&
        notImmune !== undefined &&
        doesMoveDoDamage(dexMoveInfo) ? (
          <TypeEffectiveness
            effectiveness={effectiveness}
            notImmune={notImmune}
          />
        ) : (
          <span />
        )}

        {pp && maxpp && (
          <span className="pokemonMovePP">
            {pp}/{maxpp}
          </span>
        )}
      </div>
    </PokemonMoveButton>
  );
};

const getEffectivenessLabel = (effectiveness: number) => {
  if (effectiveness === 0) {
    return "Effective";
  }
  if (effectiveness > 0) {
    return "Super effective";
  }
  if (effectiveness < 0) {
    return "Not very effective";
  }
};

const TypeEffectiveness = ({
  effectiveness,
  notImmune,
}: {
  effectiveness?: number;
  notImmune?: boolean;
}) => {
  if (!notImmune) {
    return <span className="pokemonMoveTypeEffectiveness">Has no effect</span>;
  }

  if (effectiveness !== undefined) {
    return (
      <span className="pokemonMoveTypeEffectiveness">
        {getEffectivenessLabel(effectiveness)}
      </span>
    );
  }
};

export default PokemonMoveInfoButton;
