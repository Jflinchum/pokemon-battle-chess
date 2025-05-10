import { useMemo } from "react";
import { Dex } from "@pkmn/dex";
import { getRandomPokemonOfTheDay } from './PokemonOfTheDayUtil';
import { generateDailyNumber } from "../../../utils";
import { PokemonSprite } from "../../common/Pokemon/PokemonSprite/PokemonSprite";
import './PokemonOfTheDay.css';

const PokemonOfTheDay = ({ className = '' }: { className?: string }) => {
  const randPokemon = useMemo(() => getRandomPokemonOfTheDay(), []);
  const dexPokemon = Dex.species.get(randPokemon);

  return (
    randPokemon ?
    (
      <div className={`${className} pokemonOfTheDay`}>
        <b>Pokemon of the day!</b>
        <span>{dexPokemon.name}</span>
        <PokemonSprite pokemonIdentifier={randPokemon} shiny={generateDailyNumber(1, 4096) === 1} />
      </div>
    ) :
    (
      null
    )
  );
};

export default PokemonOfTheDay;