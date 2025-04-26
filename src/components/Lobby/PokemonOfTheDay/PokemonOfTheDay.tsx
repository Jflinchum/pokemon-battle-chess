import { useMemo } from "react";
import { Sprites } from "@pkmn/img";
import { Dex } from "@pkmn/dex";
import { getRandomPokemonOfTheDay } from './PokemonOfTheDayUtil';
import { generateDailyNumber } from "../../../utils";
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
        <img src={Sprites.getPokemon(dexPokemon.id, { shiny: generateDailyNumber(1, 4096) === 1 }).url} />
      </div>
    ) :
    (
      null
    )
  );
};

export default PokemonOfTheDay;