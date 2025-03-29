import { Sprites } from "@pkmn/img";
import { getRandomPokemon } from './PokemonOfTheDayUtil';
import './PokemonOfTheDay.css';

const PokemonOfTheDay = ({ className = '' }: { className?: string }) => {
  const randPokemon = getRandomPokemon();
  return (
    randPokemon ?
    (
      <div className={`${className} pokemonOfTheDay`}>
        <b>Pokemon of the day!</b>
        <span>{randPokemon}</span>
        <img src={Sprites.getPokemon(randPokemon).url} />
      </div>
    ) :
    (
      null
    )
  );
};

export default PokemonOfTheDay;