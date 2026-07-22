export interface Member {
  id: number;
  name: string;
  mistakes: number;
}

export interface DaySession {
  date: string;
  members: Member[];
  soundEnabled: boolean;
}
