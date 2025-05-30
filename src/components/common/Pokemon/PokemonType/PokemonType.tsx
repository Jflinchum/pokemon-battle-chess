import { TypeName } from "@pkmn/data";
import bugType from "../../../../assets/pokemonAssets/types/bugType.png";
import darkType from "../../../../assets/pokemonAssets/types/darkType.png";
import dragonType from "../../../../assets/pokemonAssets/types/dragonType.png";
import electricType from "../../../../assets/pokemonAssets/types/electricType.png";
import fairyType from "../../../../assets/pokemonAssets/types/fairyType.png";
import fightingType from "../../../../assets/pokemonAssets/types/fightingType.png";
import fireType from "../../../../assets/pokemonAssets/types/fireType.png";
import flyingType from "../../../../assets/pokemonAssets/types/flyingType.png";
import ghostType from "../../../../assets/pokemonAssets/types/ghostType.png";
import grassType from "../../../../assets/pokemonAssets/types/grassType.png";
import groundType from "../../../../assets/pokemonAssets/types/groundType.png";
import iceType from "../../../../assets/pokemonAssets/types/iceType.png";
import normalType from "../../../../assets/pokemonAssets/types/normalType.png";
import poisonType from "../../../../assets/pokemonAssets/types/poisonType.png";
import psychicType from "../../../../assets/pokemonAssets/types/psychicType.png";
import rockType from "../../../../assets/pokemonAssets/types/rockType.png";
import steelType from "../../../../assets/pokemonAssets/types/steelType.png";
import waterType from "../../../../assets/pokemonAssets/types/waterType.png";
import "./PokemonType.css";

const getTypeSource = (type: TypeName) => {
  switch (type) {
    case "Bug":
      return bugType;
    case "Dark":
      return darkType;
    case "Dragon":
      return dragonType;
    case "Electric":
      return electricType;
    case "Fairy":
      return fairyType;
    case "Fighting":
      return fightingType;
    case "Fire":
      return fireType;
    case "Flying":
      return flyingType;
    case "Ghost":
      return ghostType;
    case "Grass":
      return grassType;
    case "Ground":
      return groundType;
    case "Ice":
      return iceType;
    case "Normal":
      return normalType;
    case "Poison":
      return poisonType;
    case "Psychic":
      return psychicType;
    case "Rock":
      return rockType;
    case "Steel":
      return steelType;
    case "Water":
      return waterType;
    default:
      return bugType;
  }
};

const PokemonType = ({
  type,
  className,
  ...props
}: {
  type?: TypeName;
  className?: string;
}) => {
  if (!type) {
    return null;
  }

  return (
    <img
      {...props}
      aria-label={type}
      className={`type ${className}`}
      src={getTypeSource(type)}
    />
  );
};

export default PokemonType;
