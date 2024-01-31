import { decision, externalDialog, internalMonologue } from "socialagi";
import { MentalProcess } from "soul-engine";

import { PlayerData, isValidPlayer, updatePlayerState } from "./player.js";
import { SOUL } from "./soul.js";
import votes from "./votes.js";

const murders: MentalProcess<{ player: PlayerData }> = async ({
  step: initialStep,
  subroutine,
  params: { player },
}) => {
  // workaround for bug in soul-engine
  player = JSON.parse(JSON.stringify(player)) as PlayerData;

  const { useActions, useCycleMemory, useProcessManager } = subroutine;
  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const cycleMemory = useCycleMemory();

  log("will murder someone");
  log("cycle memory: " + (await cycleMemory.get("playerState"))?.content);

  let step = initialStep;

  // let player = await loadPlayerState(cycleMemory);
  if (!isValidPlayer(player)) {
    throw new Error("Invalid player information provided.");
  }

  const role = await player.role;
  if (role !== "Werewolf") {
    throw new Error(`Invalid mental process for role ${role}`);
  }

  step = await step.next(
    internalMonologue(
      `${SOUL} thinks about their role as ${role}, about their current strategy for winning the game, and about the last discussion the villagers had.`
    )
  );

  step = await step.next(
    decision(`Based on ${SOUL}'s thoughts, who should ${SOUL} murder?`, [...player.otherPlayers])
  );
  const playerToMurder = step.value as string;

  log(`will murder ${playerToMurder}`);

  const alivePlayers = player.otherPlayers.filter((p) => p !== playerToMurder);
  player = { ...player, otherPlayers: alivePlayers };
  await updatePlayerState(cycleMemory, player);

  log("updated list of other players: " + alivePlayers);

  const { stream, nextStep } = await step.next(
    externalDialog(`${SOUL} tells the Moderator they'll murder ${playerToMurder}.`),
    { stream: true }
  );
  speak(stream);

  setNextProcess(votes, { player });

  return nextStep;
};

export default murders;
