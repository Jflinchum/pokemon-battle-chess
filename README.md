# Pokemon Gambit

A mixture between Pokemon and Chess! Each chess piece gets assigned a Pokemon, which you can then do battle with when you attempt to take a piece!

You can view it live, here: https://pokemon-gambit.com/

## How to Run

- Before running this project, you'll want to set up some localhost certs for running https locally.
  - Place the certificate under `nginx/tls.crt` and the private key under `nginx/tls.key`
- Install Docker
- Run docker compose build
- Run docker compose up

## Credits

Chess Assets - Cburnett https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces

Chess Engine - https://github.com/jhlywa/chess.js

Pokemon Engine - https://github.com/pkmn/ps
