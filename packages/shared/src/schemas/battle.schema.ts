import { z } from "zod";
import { HINTS_PER_PUZZLE } from "../constants";

export const battleDifficultySchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "MASTER",
]);

export const pingMessageSchema = z
  .object({
    timestamp: z.number().int().nonnegative().optional(),
  })
  .strict();

export const joinLobbyMessageSchema = z
  .object({
    lobbyId: z.string().min(1).optional(),
    puzzleDifficulty: battleDifficultySchema.optional(),
  })
  .strict();

export const leaveLobbyMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
  })
  .strict();

export const playerReadyMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
    isReady: z.boolean(),
  })
  .strict();

export const progressUpdateMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
    progress: z.number().min(0).max(100),
    correctCharacters: z.number().int().min(0),
    totalCharacters: z.number().int().min(0),
    hintsUsed: z.number().int().min(0).max(HINTS_PER_PUZZLE),
  })
  .strict();

export const submitSolutionMessageSchema = z
  .object({
    lobbyId: z.string().min(1),
    solution: z.string().min(1).max(5000),
    timeElapsed: z.number().int().min(0),
  })
  .strict();

export type PingMessage = z.infer<typeof pingMessageSchema>;
export type JoinLobbyMessage = z.infer<typeof joinLobbyMessageSchema>;
export type LeaveLobbyMessage = z.infer<typeof leaveLobbyMessageSchema>;
export type PlayerReadyMessage = z.infer<typeof playerReadyMessageSchema>;
export type ProgressUpdateMessage = z.infer<typeof progressUpdateMessageSchema>;
export type SubmitSolutionMessage = z.infer<typeof submitSolutionMessageSchema>;
