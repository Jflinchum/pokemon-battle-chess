import { PRNG } from "@pkmn/sim";
import { useMemo } from "react";
import bgAquaCordeTown from "../../../../../../assets/pokemonAssets/background/bg-aquacordetown.png";
import bgBeach from "../../../../../../assets/pokemonAssets/background/bg-beach.png";
import bgCity from "../../../../../../assets/pokemonAssets/background/bg-city.png";
import bgDampCave from "../../../../../../assets/pokemonAssets/background/bg-dampcave.png";
import bgDarkBeach from "../../../../../../assets/pokemonAssets/background/bg-darkbeach.png";
import bgDarkCity from "../../../../../../assets/pokemonAssets/background/bg-darkcity.png";
import bgDarkMeadow from "../../../../../../assets/pokemonAssets/background/bg-darkmeadow.png";
import bgDeepSea from "../../../../../../assets/pokemonAssets/background/bg-deepsea.png";
import bgDesert from "../../../../../../assets/pokemonAssets/background/bg-desert.png";
import bgEarthyCave from "../../../../../../assets/pokemonAssets/background/bg-earthycave.png";
import bgForest from "../../../../../../assets/pokemonAssets/background/bg-forest.png";
import bgIceCave from "../../../../../../assets/pokemonAssets/background/bg-icecave.png";
import bgMeadow from "../../../../../../assets/pokemonAssets/background/bg-meadow.png";
import bgSkyPillar from "../../../../../../assets/pokemonAssets/background/bg-skypillar.png";
import "./PokemonBattleBackground.css";

const bgImageArray = [
  bgAquaCordeTown,
  bgBeach,
  bgCity,
  bgDampCave,
  bgDarkBeach,
  bgDarkCity,
  bgDarkMeadow,
  bgDeepSea,
  bgDesert,
  bgEarthyCave,
  bgForest,
  bgIceCave,
  bgMeadow,
  bgSkyPillar,
];

export const PokemonBattleBackground = ({
  prng,
  children,
}: {
  prng: PRNG;
  children: React.ReactNode;
}) => {
  const bgIndex = useMemo(() => prng.random(0, bgImageArray.length), [prng]);

  return (
    <div
      className="pokemonBattleBackground"
      style={{
        backgroundImage: `url(${bgImageArray[bgIndex]})`,
      }}
    >
      {children}
    </div>
  );
};
