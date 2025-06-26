import { taskSuggestions } from "@/constants/tasks";

export function generateDailyTasks(kidAgeGroup = "1-3y", userId = "") {
  const selectedTasks = [];

  const addMeta = (task) => ({
    ...task,
    userId,
    createdAt: new Date(),
    completedAt: null,
  });

  const household = shuffle(taskSuggestions.household).slice(0, 2);
  const baby = taskSuggestions.baby[kidAgeGroup]
    ? shuffle(taskSuggestions.baby[kidAgeGroup]).slice(0, 2)
    : [];
  const relationship = shuffle(taskSuggestions.relationship).slice(0, 1);
  const personal = shuffle(taskSuggestions.personal).slice(0, 1);

  selectedTasks.push(...household, ...baby, ...relationship, ...personal);

  return shuffle(selectedTasks).slice(0, 5).map(addMeta);
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}