import genderF from "../../../assets/pokemonAssets/gender/gender-f.png";
import genderM from "../../../assets/pokemonAssets/gender/gender-m.png";

export const GenderIcon = ({ gender }: { gender?: string }) => {
  if (gender === "M") {
    return <img src={genderM} alt="Male" />;
  } else if (gender === "F") {
    return <img src={genderF} alt="Female" />;
  } else {
    return null;
  }
};
