import { Puzzle } from '../types';

interface PuzzleCardProps {
  puzzle: Puzzle;
}

export function PuzzleCard({ puzzle }: PuzzleCardProps) {
  return (
    <div>
      <h2>{puzzle.title}</h2>
      <p>{puzzle.description}</p>
      <span>Difficulty: {puzzle.difficulty}</span>
    </div>
  );
}
