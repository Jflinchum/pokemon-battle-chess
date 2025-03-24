import PokemonMoveButton from "./PokemonMoveButton";
import './PokemonMoveChoices.css';

interface PokemonMoveChoicesProps {
  moves: string[];
  onMoveSelect?: (move: string) => void;
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
