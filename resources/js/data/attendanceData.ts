import { Student } from '@/types/students';

export const getAttendanceData = (): Student[] => {
  return [
    { id: 11, name: "Raivo Ķinne", email: "ipa22.r.kinne@vtdt.edu.lv", time: "09:05", status: "prombūtne", class: "10A" },
    { id: 12, name: "Emils Peterson", email: "ipa22.e.petersons@vtdt.edu.lv", time: "09:05", status: "prombūtne", class: "10A" },
    { id: 13, name: "Kevin Markuss Kanalis", email: "ipa22.k.kanalis@vtdt.edu.lv", time: "09:05", status: "prombūtne", class: "10A" }
  ];
};

