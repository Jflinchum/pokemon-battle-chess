import { Sprites } from "@pkmn/img";
import { getRandomPokemonOfTheDay } from './PokemonOfTheDayUtil';
import './PokemonOfTheDay.css';
import { speciesOverride } from "../../BattleChessGame/ChessManager/util";

const PokemonOfTheDay = ({ className = '' }: { className?: string }) => {
  const randPokemon = getRandomPokemonOfTheDay();
  return (
    randPokemon ?
    (
      <div className={`${className} pokemonOfTheDay`}>
        <b>Pokemon of the day!</b>
        <span>{randPokemon}</span>
        <img src={Sprites.getPokemon(speciesOverride(randPokemon)).url} />
      </div>
    ) :
    (
      null
    )
  );
};

export default PokemonOfTheDay;