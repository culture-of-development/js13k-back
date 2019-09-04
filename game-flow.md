
# Backprop Game Flow

## Game start

1. land on the screen
2. shown really basic instructions, e.g. right click to see minion info, etc
3. click start game to start
4. set human player to choose minion first
5. swap to minion selection scene

## Minion selection

1. show character select screen with 2 weighted random characters
2. drag minion to one of your spots or press pass button
3. repeat for opponent
4. swap to game scene

## Minion placement

1. initiate placement timer for 15 seconds
2. players can move their characters around on the board or from/to reserve
3. at end of timer, all draggable disabled
4. initiate combat phase

## Combat phase

1. combat automagically resolved
2. damage dealt to hero
3. check winner, proceed to game end if one player is done
4. set lowest remaining health hero choses first
5. show minion selection scene

## Game End

1. show popup
2. animate the winner/loser
3. make it clear who won or lost
4. button to start a new game
