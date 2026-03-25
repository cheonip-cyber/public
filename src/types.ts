export type Rank = "9급 서기보" | "8급 서기" | "7급 주사보" | "6급 주사" | "5급 사무관" | "시장";

export interface ActionCard {
  label: string;
  type: string;
}

export interface NPC {
  id: number;
  name: string;
  trait: string;
  issue: string;
  bg: "counter" | "parking" | "pantry";
  avatar: string;
  imageUrl: string;
}

export interface Message {
  role: 'user' | 'npc';
  text: string;
  mood?: string;
  point?: number;
}

export type GameState = 'INTRO' | 'PLAY' | 'ENDING';
