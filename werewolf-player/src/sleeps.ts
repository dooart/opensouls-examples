import { decision } from "socialagi";
import { MentalProcess } from "soul-engine";

import { PlayerData, isValidPlayer, updatePlayerState } from "./player.js";
import votes from "./votes.js";

const sleeps: MentalProcess<{ player: PlayerData }> = async ({
  step: initialStep,
  subroutine,
  params: { player },
}) => {
  // workaround for bug in soul-engine
  player = JSON.parse(JSON.stringify(player)) as PlayerData;

  const { useActions, useCycleMemory, useProcessManager } = subroutine;
  const { log } = useActions();
  const { setNextProcess } = useProcessManager();
  const cycleMemory = useCycleMemory();

  log("sleeping");
  log("cycle memory: " + (await cycleMemory.get("playerState"))?.content);

  let step = initialStep;

  // let player = await loadPlayerState(cycleMemory);
  if (!isValidPlayer(player)) {
    throw new Error("Invalid player information provided.");
  }

  const role = await player.role;
  if (role !== "Villager") {
    throw new Error(`Invalid mental process for role ${role}`);
  }

  step = await step.next(decision(`Which player was just murdered?`, [...player.otherPlayers]));
  const murderedPlayer = step.value as string;

  const alivePlayers = player.otherPlayers.filter((p) => p !== murderedPlayer);
  player = { ...player, otherPlayers: alivePlayers };
  await updatePlayerState(cycleMemory, player);

  log("updated list of other players: " + alivePlayers);

  setNextProcess(votes, { player });

  return step;
};

export default sleeps;
