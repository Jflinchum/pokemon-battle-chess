import PokemonMoveInfoButton from "./PokemonMoveInfoButton";
import './PokemonMoveChoices.css';

export interface PokemonMoveChoice {
  id: string;
  name?: string;
  disabled?: boolean;
  pp?: number;
  maxpp?: number;
}

interface PokemonMoveChoicesProps {
  moves: PokemonMoveChoice[];
  onMoveSelect?: (move: string) => void;
}

const PokemonMoveChoices = ({ moves, onMoveSelect = () => {} }: PokemonMoveChoicesProps) => {

  return (
    <div className='movesContainer'>
      <div className='subMoveContainer'>
        {moves.slice(0, 2).map((move, index) => {
          return (
            <PokemonMoveInfoButton key={index} move={move.id} pp={move.pp} maxpp={move.maxpp} disabled={move.disabled} onMoveSelect={onMoveSelect}/>
          )
        })}
      </div>
      <div className='subMoveContainer'>
        {moves.slice(2, 4).map((move, index) => {
          return (
            <PokemonMoveInfoButton key={index} move={move.id} pp={move.pp} maxpp={move.maxpp} disabled={move.disabled} onMoveSelect={onMoveSelect}/>
          )
        })}
      </div>
    </div>
  )
}

export default PokemonMoveChoices;
