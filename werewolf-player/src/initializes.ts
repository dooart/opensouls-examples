import {
  ChatMessageRoleEnum,
  CortexStep,
  decision,
  externalDialog,
  internalMonologue,
  mentalQuery,
  questionMemory,
} from "socialagi";
import { MentalProcess, Subroutine } from "soul-engine";
import murders from "./murders.js";
import {
  Player,
  PlayerRoles,
  isPlayerRole,
  isValidPlayer,
  loadPlayerState,
  loadValidPlayerState,
  updatePlayerState,
} from "./player.js";
import { prompt } from "./prompt.js";
import sleeps from "./sleeps.js";
import { SOUL } from "./soul.js";
import votes from "./votes.js";

const initializes: MentalProcess = async ({ step: initialStep, subroutine }) => {
  const { useActions, useProcessManager, useCycleMemory } = subroutine;
  const { log } = useActions();
  const { setNextProcess } = useProcessManager();
  const cycleMemory = useCycleMemory();

  const playerFromEnv = cycle.env.player as Player;
  if (isValidPlayer(playerFromEnv)) {
    log("Player information was provided via env vars.");
    await updatePlayerState(cycleMemory, playerFromEnv);

    setNextProcess(votes, { player: playerFromEnv });

    return initialStep;
  }

  let player = { ...playerFromEnv, ...(await loadPlayerState(cycleMemory)) };

  let step = initialStep;

  if (!isValidPlayer(player)) {
    step = step.withMemory([
      {
        role: ChatMessageRoleEnum.Assistant,
        content: prompt`${SOUL} remembers that they're talking to the Moderator, who will provide 3 pieces of information:
        - ${SOUL}'s role
        - ${SOUL}'s nickname
        - the other players' nicknames`,
      },
    ]);

    step = await step.next(
      internalMonologue(
        `${SOUL} thinks about what pieces of information are still missing. ${SOUL} is NOT supposed to know the other players' roles yet. Here's what ${SOUL} remembers: ${JSON.stringify(
          player
        )}`
      )
    );
  }

  if (!player.nickname) {
    step = await step.next(mentalQuery(`Did ${SOUL} get a nickname assigned by the Moderator?`));
    if (!step.value) {
      log("No nickname was assigned.");

      return await requestNickname(step, subroutine);
    } else {
      step = await step.next(
        questionMemory(`What nickname was assigned to ${SOUL}? Reply ONLY with the nickname.`)
      );

      log("Nickname assigned:", step.value);
      player = { ...player, nickname: step.value };
      await updatePlayerState(cycleMemory, player);
    }
  }

  if (!player.role) {
    step = await step.next(
      decision(`What was the role assigned to ${SOUL}?`, [...PlayerRoles, "unknown"])
    );
    if (!isPlayerRole(step.value)) {
      log("Role assignment was invalid:", step.value);

      return await requestRole(step, subroutine);
    } else {
      log("Assigned role:", step.value);

      player = { ...player, role: step.value };
      await updatePlayerState(cycleMemory, player);
    }
  }

  if (!player.otherPlayers || player.otherPlayers.length === 0) {
    step = await step.next(
      internalMonologue(`${SOUL} tries to make a mental list of the other player's nicknames`)
    );

    step = await step.next(
      mentalQuery(
        `Does ${SOUL}, playing as ${player.nickname}, know the names of the other players?`
      )
    );
    if (!step.value) {
      log("No information about other players was provided.");

      return await requestOtherPlayerNames(step, subroutine);
    } else {
      step = await step.next(
        questionMemory(
          `What are the names of the other players? Reply ONLY with the names, separated by commas.`
        )
      );
      log("Other players:", step.value);

      player = {
        ...player,
        otherPlayers: (step.value as string).split(",").map((name) => name.trim()),
      };
      await updatePlayerState(cycleMemory, player);
    }
  }

  return await joinsGame(step, subroutine);
};

const requestRole = async (step: CortexStep<any>, { useActions }: Subroutine) => {
  const { speak } = useActions();

  step = await step.next(
    internalMonologue(
      `${SOUL} remembers the role MUST be ${PlayerRoles.join(" or ")}. No other roles are allowed.`
    )
  );

  const { stream, nextStep } = await step.next(
    externalDialog(`${SOUL} asks whether their role is ${PlayerRoles.join(" or ")}.`),
    { stream: true }
  );
  speak(stream);

  return nextStep;
};

const requestNickname = async (step: CortexStep<any>, { useActions }: Subroutine) => {
  const { speak } = useActions();

  step = await step.next(
    internalMonologue(
      `${SOUL} remembers a nickname is strictly required for participation in the game.`
    )
  );

  const { stream, nextStep } = await step.next(externalDialog(`${SOUL} asks for a nickname.`), {
    stream: true,
  });
  speak(stream);

  return nextStep;
};

const requestOtherPlayerNames = async (step: CortexStep<any>, { useActions }: Subroutine) => {
  const { speak } = useActions();

  step = await step.next(
    internalMonologue(
      `${SOUL} thinks that it is impossible to play the game without knowing who the other players are.`
    )
  );

  const { stream, nextStep } = await step.next(
    externalDialog(`${SOUL} asks for the names of the other players.`),
    { stream: true }
  );
  speak(stream);

  return nextStep;
};

const joinsGame = async (
  step: CortexStep<any>,
  { useActions, useProcessManager, useCycleMemory }: Subroutine
) => {
  const { log } = useActions();
  const { setNextProcess } = useProcessManager();

  log("Joining game.");
  log("cycle memory: " + (await useCycleMemory().get("playerState"))?.content);

  const player = await loadValidPlayerState(useCycleMemory());

  if (player.role === "Werewolf") {
    setNextProcess(murders, { player });
  } else {
    setNextProcess(sleeps, { player });
  }

  return step;
};

export default initializes;
