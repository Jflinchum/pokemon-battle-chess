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
}

export const PokemonSprite = ({ pokemonIdentifier, isSubstitute, shiny, gender, side, ...props }: PokemonSprite) => {
  const { userState } = useUserState();
  const dexPokemon = Dex.species.get(pokemonIdentifier);

  return (
    <img 
      src={
        isSubstitute ?
        Sprites.getSubstitute().url :
        Sprites.getPokemon(
          speciesOverride(dexPokemon.id), {
            gen: userState.use2DSprites ? 'gen5ani' : 'ani',
            shiny,
            gender,
            side
          }
        ).url
      }
      {...props}
    />
  );
};