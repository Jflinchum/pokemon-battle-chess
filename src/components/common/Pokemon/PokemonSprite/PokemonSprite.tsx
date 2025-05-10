import { HTMLAttributes } from "react";
import { Sprites } from "@pkmn/img";
import { Dex, GenderName } from "@pkmn/dex";
import { useUserState } from "../../../../context/UserStateContext";
import { speciesOverride } from "../../../BattleChessGame/ChessManager/util";

interface PokemonSprite extends HTMLAttributes<HTMLImageElement> {
  pokemonIdentifier: string;
  isSubstitute?: boolean;
  gender?: GenderName;
  shiny?: boolean;
  side?: 'p1' | 'p2';
  // When implemented within draggables, image dragging take priority over draggable. Use a div with a background image in those cases
  useDiv?: boolean;
}

export const PokemonSprite = ({ pokemonIdentifier, isSubstitute, shiny, gender, side, useDiv, ...props }: PokemonSprite) => {
  const { userState } = useUserState();
  const dexPokemon = Dex.species.get(pokemonIdentifier);
  const sprite = isSubstitute ?
    Sprites.getSubstitute().url :
    Sprites.getPokemon(
      speciesOverride(dexPokemon.id), {
        gen: userState.use2DSprites ? 'gen5ani' : 'ani',
        shiny,
        gender,
        side
      }
    ).url;

  if (useDiv) {
    return (
      <div style={{ backgroundImage: `url(${sprite})`, backgroundPosition: 'center', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} {...props}/>
    );
  } else {
    return (
      <img 
        src={sprite}
        {...props}
      />
    );
  }
};