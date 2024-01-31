import { Subroutine } from "soul-engine";

export const PlayerRoles = ["Villager", "Werewolf"] as const;

export type PlayerRole = (typeof PlayerRoles)[number];

export type PlayerData = {
  role: PlayerRole;
  nickname: string;
  otherPlayers: string[];
};

export type Player = Partial<PlayerData>;

export function isValidPlayer(player?: Player): player is PlayerData {
  if (!player) {
    return false;
  }

  return (
    isPlayerRole(player.role) &&
    (player?.nickname ?? "").length > 0 &&
    (player.otherPlayers ?? []).length > 0
  );
}

export function isPlayerRole(role?: string): role is PlayerRole {
  return PlayerRoles.includes((role ?? "") as PlayerRole);
}

export async function loadPlayerState(cycleMemory: ReturnType<Subroutine["useCycleMemory"]>) {
  const state = (await cycleMemory.get("playerState"))?.content;
  if (!state) {
    return {} as Player;
  }

  return JSON.parse(state) as Player;
}

export async function loadValidPlayerState(cycleMemory: ReturnType<Subroutine["useCycleMemory"]>) {
  const player = await loadPlayerState(cycleMemory);
  if (!isValidPlayer(player)) {
    throw new Error("Invalid player information provided.");
  }

  return player;
}

export async function updatePlayerState(
  cycleMemory: ReturnType<Subroutine["useCycleMemory"]>,
  player: Player
) {
  await cycleMemory.set("playerState", JSON.stringify(player));
}
