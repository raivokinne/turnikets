import { User } from "./auth";

export interface Student {
  id: number;
  status: string;
  class: string;
  user: User;
}

