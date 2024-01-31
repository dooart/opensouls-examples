import { decision, externalDialog, internalMonologue } from "socialagi";
import { MentalProcess } from "soul-engine";

import murders from "./murders.js";
import { PlayerData, isValidPlayer } from "./player.js";
import sleeps from "./sleeps.js";
import { SOUL } from "./soul.js";

const votes: MentalProcess = async ({ step: initialStep, subroutine, params: { player } }) => {
  // workaround for bug in soul-engine
  player = JSON.parse(JSON.stringify(player)) as PlayerData;

  const { useActions, useCycleMemory, useProcessManager } = subroutine;
  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();

  log("cycle memory: " + (await useCycleMemory().get("playerState"))?.content);

  // const player = await loadPlayerState(useCycleMemory());
  if (!isValidPlayer(player)) {
    throw new Error("Invalid player information provided.");
  }

  let step = initialStep;

  const role = await player.role;

  step = await step.next(
    internalMonologue(
      `${SOUL} thinks about their role as ${role}, about their current strategy for winning the game, and about what they've just heard.`
    )
  );

  step = await step.next(
    decision(`Based on ${SOUL}'s thoughts, who should ${SOUL} vote for?`, [...player.otherPlayers])
  );
  const votingFor = step.value as string;

  step = await step.next(
    decision(
      `Should ${SOUL} say something to influence the other players or should ${SOUL} just vote without explaining?`,
      ["Say something", "Just vote"]
    )
  );
  if (step.value === "Say something") {
    log(`will say something to influence the other players.`);

    step = await step.next(
      internalMonologue(
        `${SOUL} thinks about what they could say to influence the other players to vote for ${votingFor}.`
      )
    );

    const { stream, nextStep } = await step.next(
      externalDialog(
        `${SOUL} strategically explain their reasoning that justifies their vote, then announces their vot for ${votingFor}.`
      ),
      { stream: true }
    );
    speak(stream);

    step = await nextStep;
  } else {
    log(`will just vote without explaining.`);

    const { stream, nextStep } = await step.next(
      externalDialog(
        `${SOUL} announces that they're voting for ${votingFor}.`
      ),
      { stream: true }
    );
    speak(stream);

    step = await nextStep;
      }

  log("next round");

  if (role === "Werewolf") {
    setNextProcess(murders, { player });
  } else {
    setNextProcess(sleeps, { player });
  }

  return step;
};

export default votes;
