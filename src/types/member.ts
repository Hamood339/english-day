export interface Member {
  id: number;
  name: string;
  mistakes: number;
  paidMistakes: number;
  unpaidMistakes: number;
}

export interface DaySession {
  date: string;
  members: Member[];
  soundEnabled: boolean;
}
