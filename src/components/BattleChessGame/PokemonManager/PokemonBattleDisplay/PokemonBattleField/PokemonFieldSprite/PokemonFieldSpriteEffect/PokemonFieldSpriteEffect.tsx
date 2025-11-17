import { Pokemon } from "@pkmn/client";
import { SideID } from "@pkmn/data";
import { isPokemonProtected } from "../../../../../../../util/pokemonUtil";
import "./PokemonFieldSpriteEffect.css";

interface PokemonFieldSpriteEffect {
  pokemon: Pokemon;
  side: SideID;
}

type ScreenEffectIds = ["protect", "lightscreen", "reflect"];

const screenEffectToColor: Record<ScreenEffectIds[number], string> = {
  protect: "blue",
  lightscreen: "pink",
  reflect: "purple",
};

export const PokemonFieldSpriteEffect = ({
  pokemon,
  side,
}: PokemonFieldSpriteEffect) => {
  const screenEffects: ScreenEffectIds[number][] = [];
  if (pokemon.side.sideConditions["lightscreen"]) {
    screenEffects.push("lightscreen");
  }
  if (pokemon.side.sideConditions["reflect"]) {
    screenEffects.push("reflect");
  }
  if (isPokemonProtected(pokemon)) {
    screenEffects.push("protect");
  }

  if (screenEffects.length > 0) {
    const screenElements = screenEffects.map((screenEffect, i) => (
      <PokemonScreenEffect
        key={screenEffect}
        color={screenEffectToColor[screenEffect]}
        index={i}
        side={side}
      />
    ));

    if (side === "p1") {
      /**
       * Add the elements in reverse order to the dom for proper layering
       */
      screenElements.reverse();
    }

    return (
      <div className={`pokemonScreenContainer ${side}`}>{screenElements}</div>
    );
  }
  return null;
};

const SCREEN_OFFSET_PX = 20;

const PokemonScreenEffect = ({
  color,
  index,
  side,
}: {
  color: string;
  index: number;
  side: SideID;
}) => {
  const initialOffset = side === "p1" ? 20 : -20;
  const additionalOffset = index * SCREEN_OFFSET_PX * (side === "p1" ? 1 : -1);
  return (
    <div
      className="pokemonScreenEffect"
      style={{
        backgroundColor: color,
        left: `${initialOffset + additionalOffset}px`,
      }}
    />
  );
};
