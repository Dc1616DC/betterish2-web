import taskSuggestions from "@/constants/tasks";

export function getTodayTasks() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const randomFrom = (arr, n) =>
    [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

  return [
    ...randomFrom(taskSuggestions.baby, 1),
    ...randomFrom(taskSuggestions.household, 2),
    ...randomFrom(taskSuggestions.relationship, 1),
    ...randomFrom(taskSuggestions.personal, 1),
  ];
}