# Shield Card Game Rules

## Introduction

The game requires at least two and up to 8 players. It is a realtime, turn based card game using a regular card 52-cards deck (no jokers allowed).

## Card values

- Ace: 1 point
- Number cards (2-9): card value (nothing specific)
- Jack: 11 points
- Queen: 12 points
- King: 13 points

## Setting up

The game starts with each player recieving 4 cards (value not shown). Before the first turn, players need to decide which of the 4 cards they will use as a "shield". Once the shield is selected, the other 3 cards are defined as HP. The layout is 3 cards (HP) next to each other and 1 card (shield) on top on them (first row one card, second row 3 cards).

The setup part does not need to be turn based, it can be done by players simultaneously. Players will need to confirm their layout before the game can actually start.

## Start order

The player with the lowest HP starts first. Then, turns are clockwise.

For example:

- Player 1 hand: ace, 3, 1 and jack as shield => 5 HP
- Player 2 hand: 10, king, 5 and 6 as shield => 28 HP
- Player 3 hand: ace, ace, queen and 10 as shield => 14 HP

In this scenario, player 1 starts.

## Actions

For each turn, a player can choose to perform one of the following actions:

1. Change their shield: draw a card and replace their shield with the drawn card.
2. Change another player's shield: draw a card and replace another player's shield.
3. Store a card: draw a card without knowing its value and store it to use later.
4. Attack a player: see next section
5. Give a card to another player: after performing an action, a player with one or more stored cards has the opportunity to give one or more of their stored cards to another or multiple players.

Note: players need to choose their action before actually performing it. It is forbidden to draw a card, check its value and decide the next action based on the value of the card.

Giving stored cards examples:

**Example 1**:
- Player 1 has 2 stored cards. After a succesfull attack, they decide to give their 2 stored cards to player 3.

**Example 2**:
- Player 1 has 2 stored cards. After a succesfull attack, they decide to give 1 stored card to player 3 and keep the other one.

**Example 3**:
- Player 1 has 2 stored cards. After a succesfull attack, they decide to give 1 stored card to player 3 and give the other one to player 1.

Note: giving a stored card is only to try creating alliances. It is not a necessary step and is part of a player's strategy. There is no maximum limit of stored cards. However, the more stored cards a player has, the more likely they will be targeted by other players.

### Attacking a player

#### Default case

When a player decides to attack another one, they draw a card and its value is revealed. Then, there are a few cases:

1. Drawn card value is <= attacked player's shield: nothing happens, the drawn card is stored on the pile.
2. Drawn card is > attacked player's shield: damage is equal to card value - shield value. The attacked player's HP are then replaced with either available cards from the discard or draw pile.

**Example 1**:
- Player 1 hand: ace, 3, 1 and jack as shield => 5 HP
- Player 2 hand: 10, king, 5 and 6 as shield => 28 HP
- Player 3 hand: ace, ace, queen and 10 as shield => 14 HP

- Player 1 decides to attack player 2.
- Player 1 draws a 3 of diamonds.
- 3 (drawn card value) < 6 (attacked player's shield).
- Attack failed, the 3 of diamonds goes to the discard pile.

**Example 2**:
- Player 1 hand: ace, 3, 1 and jack as shield => 5 HP
- Player 2 hand: 10, king, 5 and 6 as shield => 28 HP
- Player 3 hand: ace, ace, queen and 10 as shield => 14 HP

- Player 2 decides to attack player 3.
- Player 2 draws a jack of spades.
- Jack (drawn card value, 11) >= 10 (attacked player's shield).
- Attack succeeded, calculating damage: 11 - 10 = 1.
- Player 3 looses 1 HP.
- The easiest possibility here, is to remove one of the aces from player's 3 HP.
- The jack of spades (drawn card) goes to the discard pile.

#### With stored cards

As explained in the actions section, players have the possiblity to store a card. When attacking another player, they can add one or more stored cards to add power to their attack.

**Example 1**:
- Player 1 hand: ace, 3, 1 and jack as shield => 5 HP + 1 stored card
- Player 2 hand: 10, king, 5 and 6 as shield => 28 HP
- Player 3 hand: ace, ace, queen and 10 as shield => 14 HP

- Player 1 attacks player 2.
- Player 1 draws a 6 of diamonds.
- 6 <= 6, attack failed.
- Player 1 decides to use their stored card.
- The stored card value is revealed: 3 of hearts.
- The new attack power is 6 + 3 = 9.
- 9 > 6 (player 2's shield).
- Attack succeeded, calculating damage: 9 - 6 = 3.
- Player 2 HP are now 28 - 3 = 25 HP.
- From the discard (first) or draw (if nothing found) pile, replace the cards defining HP to match the new 25 HP.
- Example: player 2's hand can become 7, king, 5 and 6 as shield.

Note: the shield stays the same when attacked. If an attack is successfull and the attacked user had stores cards, they are discarded.