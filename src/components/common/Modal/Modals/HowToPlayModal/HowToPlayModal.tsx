import './HowToPlayModal.css';

const HowToPlayModal = () => {
  return (
    <div className='howToPlayModalContainer'>
      <h2 className='howToPlayTitle'>How To Play</h2>
      <div>
        <i>Under construction.</i>
        <p>
          Welcome to Pokemon Chess Arena!
        </p>
        <p>
          This game makes an attempt to merge both Pokemon's battle system and Chess together
          to create a layered strategy game. A game will start off as any normal Chess game,
          except <b>each Chess piece will be assigned a Pokemon.</b>
        </p>
        <p>
          Whenever you attempt to
          attack another Chess piece with your piece, <b>you will first need to win a Pokemon
          battle!</b> If you win, you successfully take the piece. However, if you lose, <b>your
          Chess piece will be taken instead!</b>
        </p>
      </div>
    </div>
  )
};

export default HowToPlayModal;