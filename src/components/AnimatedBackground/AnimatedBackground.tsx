import { useMemo, useState } from 'react';
import { Sprites } from '@pkmn/img';
import ChessPieceSprite from '../BattleChessGame/ChessManager/ChessBoard/ChessPieceSprite/ChessPieceSprite';
import { getRandomPokemon } from '../Lobby/PokemonOfTheDay/PokemonOfTheDayUtil';
import './AnimatedBackground.css';
import { Color, PieceSymbol } from 'chess.js';

const getRandomChessPiece = () => {
  const chessPieces: PieceSymbol[] = ['p', 'b', 'n', 'r', 'k', 'q'];
  const chessColor: Color[] = ['w', 'b'];

  const randomPiece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
  const randomColor = chessColor[Math.floor(Math.random() * chessColor.length)];

  return {
    piece: randomPiece,
    color: randomColor,
    left: `${Math.random() * 95}%`,
    bottom: `${Math.floor((Math.random() * -300) - 300)}px`,
    scale: (Math.random() * 2) + 1,
    rotation: `${(Math.random() > 0.5 ? 1 : -1) * ((Math.random() * 60) + 20)}deg`,
  };
};

const getRandomBackgroundPokemon = (availablePokemon: string[]) => {
  let randomPokemon = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];

  return {
    pkmn: randomPokemon,
    shiny: Math.random() < 0.004096,
    left: `${Math.random() * 95}%`,
    bottom: `${Math.floor((Math.random() * -300) - 300)}px`,
    scale: (Math.random() * 2) + 1,
    rotation: `${(Math.random() > 0.5 ? 1 : -1) * ((Math.random() * 60) + 20)}deg`,
  };
};

const RandomPokemonBackground = ({ delay, availablePokemon }: { delay: number, availablePokemon: string[] }) => {
  const [pkmn, setPkmn] = useState(getRandomBackgroundPokemon(availablePokemon));

  return (
    <img
      onAnimationIteration={() => setPkmn(getRandomBackgroundPokemon(availablePokemon))}
      style={{
        left: pkmn.left,
        bottom: pkmn.bottom,
        '--scale': pkmn.scale,
        '--rotation': pkmn.rotation,
        animationDelay: `${delay}s`,
        zIndex: -1 * Math.floor(pkmn.scale) - 1,
      } as React.CSSProperties}
      src={Sprites.getDexPokemon(pkmn.pkmn, { shiny: pkmn.shiny }).url}
      className='float backgroundPokemon'
    />
  );
};

const RandomChessPieceBackground = ({ delay }: { delay: number }) => {
  const [piece, setPiece] = useState(getRandomChessPiece());

  return (
    <ChessPieceSprite
      onAnimationIteration={() => setPiece(getRandomChessPiece())}
      style={{
        left: piece.left,
        bottom: piece.bottom,
        '--scale': piece.scale,
        '--rotation': piece.rotation,
        animationDelay: `${delay}s`,
        zIndex: -1 * Math.floor(piece.scale) - 1,
      } as React.CSSProperties}
      type={piece.piece} color={piece.color}
      className='float backgroundChess'
    />
  );
};

const AnimatedBackground = () => {
  // Doing this so we're not constantly fetching all 1000 pokemon images to save client bandwidth
  const availablePokemon = useMemo(() => {
    let pkmn = [];
    for (let i = 0; i < 50; i++) {
      pkmn.push(getRandomPokemon());
    }
    return pkmn;
  }, []);

  return (
    <div className='backgroundContainer'>
      {
        [...Array(6)].map((_, index) => (
          <RandomPokemonBackground availablePokemon={availablePokemon} delay={-5 + (index * 3) - 1} key={index}/>
        ))
      }
      {
        [...Array(6)].map((_, index) => (
          <RandomChessPieceBackground delay={-5 + index * 3} key={index}/>
        ))
      }
    </div>
  );
};

export default AnimatedBackground;