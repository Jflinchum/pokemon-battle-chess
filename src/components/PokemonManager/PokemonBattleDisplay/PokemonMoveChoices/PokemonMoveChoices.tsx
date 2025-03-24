import { Dex } from "@pkmn/dex";
import { Move } from "@pkmn/data";
import PokemonMoveButton from "./PokemonMoveButton";
import './PokemonMoveChoices.css';

interface PokemonMoveChoicesProps {
  moves: string[];
  onMoveSelect?: (move: string) => void;
}

const getMoveButtonColor = (moveType: Move['type']) => {
  switch (moveType) {
    case 'Normal': return '#aca596';
    case 'Water': return '#508dd6';
    case 'Grass': return '#8fcb63';
    case 'Fire': return '#e55e3f';
    case 'Electric': return '#f7c753';
    case 'Rock': return '#b8a038';
    case 'Flying': return '#9eaef1';
    case 'Poison': return '#a960a1';
    case 'Bug': return '#b0bb44';
    case 'Psychic': return '#f85888';
    case 'Dark': return '#705848';
    case 'Ground': return '#d1b568';
    case 'Ice': return '#a1d8d5';
    case 'Dragon': return '#7668df';
    case 'Ghost': return '#705898';
    case 'Steel': return '#adadc4';
    case 'Fighting': return '#903028';
    case 'Fairy': return '#e58fe1';
    default: return '#d8d5de';
  }
}

const PokemonMoveChoices = ({ moves, onMoveSelect = () => {} }: PokemonMoveChoicesProps) => {

  return (
    <div className='movesContainer'>
      <div className='subMoveContainer'>
        {moves.slice(0, 2).map((move, index) => {
          return (
            <PokemonMoveButton key={index} move={move} onMoveSelect={onMoveSelect}/>
          )
        })}
      </div>
      <div className='subMoveContainer'>
        {moves.slice(2, 4).map((move, index) => {
          return (
            <PokemonMoveButton key={index} move={move} onMoveSelect={onMoveSelect}/>
          )
        })}
      </div>
    </div>
  )
}

export default PokemonMoveChoices;
