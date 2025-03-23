import { Dex } from "@pkmn/dex";
import './PokemonMoveChoices.css';

interface PokemonMoveChoicesProps {
  moves: string[];
  onMoveSelect: (move: string) => void;
}

const PokemonMoveChoices = ({ moves, onMoveSelect }: PokemonMoveChoicesProps) => {

  return (
    <div className='movesContainer'>
      {moves.map((move, index) => (
        <button key={index} className='moveButton' onClick={() => {onMoveSelect(move)}}>
          {Dex.moves.get(move).name}
          <span className='moveTooltip'>{Dex.moves.get(move).shortDesc}</span>
        </button>
      ))}
    </div>
  )
}

export default PokemonMoveChoices;
