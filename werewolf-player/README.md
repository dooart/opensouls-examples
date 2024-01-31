## Run this soul

In this directory run

```bash
npx soul-engine dev
```

## Initialize the players

Start 6 different soul engine sessions (either run `npx soul-engine dev` 6 times or open 6 different debugger tabs updating the uuid in the url).

Type these messages, one in each tab:

- Your nickname is Alice, you're playing as a Werewolf.
- Your nickname is Bob, you're playing as a Villager.
- Your nickname is Celine, you're playing as a Villager.
- Your nickname is David, you're playing as a Villager.
- Your nickname is Esther, you're playing as a Villager.
- Your nickname is Frank, you're playing as a Villager.

## Start the game

In Alice's session, type the following message:

- Night has fallen. Choose your victim, Werewolf.

Alice will pick a victim.

Close the dead player's session. In the remaining sessions, type the following message, replacing XXXX with the name of the dead player:

- Day has come. XXXX was found dead.

Choose the first player to vote and send the following message in their session:

- Who do you think is the Werewolf?

Repeat the process until the Werewolf is found or everyone is dead.
