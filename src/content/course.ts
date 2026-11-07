/** Course map: 19 lessons in book order. Source: docs/lesson-design/lesson-design.md, lesson headings (the frames use them). */
export interface CourseLesson {
  id: string;
  chapter: 1 | 2 | 3 | 4;
  title: string;
  sections: string;
  minutes: number;
}

export const CHAPTER_TITLES: Record<number, string> = {
  1: "Numbers",
  2: "Linear equations",
  3: "Real numbers",
  4: "Quadratic equations",
};

export const COURSE: CourseLesson[] = [
  { id: "1.1", chapter: 1, title: "Numbers on a line", sections: "§1", minutes: 8 },
  { id: "1.2", chapter: 1, title: "Undo moves: add minus numbers", sections: "§1–2", minutes: 13 },
  { id: "1.3", chapter: 1, title: "Minus times minus", sections: "§3", minutes: 12 },
  { id: "1.4", chapter: 1, title: "Powers and three famous formulas", sections: "§3", minutes: 12 },
  { id: "1.5", chapter: 1, title: "Even, odd and divisibility", sections: "§4", minutes: 10 },
  { id: "1.6", chapter: 1, title: "Fractions", sections: "§5", minutes: 12 },
  { id: "1.7", chapter: 1, title: "Square root of 2 is not a fraction", sections: "§5", minutes: 10 },
  { id: "1.8", chapter: 1, title: "Division and inverses", sections: "§6", minutes: 14 },
  { id: "2.1", chapter: 2, title: "Two equations, two unknowns", sections: "§1", minutes: 12 },
  { id: "2.2", chapter: 2, title: "Three equations, three unknowns", sections: "§2", minutes: 10 },
  { id: "2.3", chapter: 2, title: "The general system", sections: "§1, ex. 9–11", minutes: 10 },
  { id: "3.1", chapter: 3, title: "The real numbers", sections: "§1", minutes: 8 },
  { id: "3.2", chapter: 3, title: "Positive numbers and square roots", sections: "§2", minutes: 12 },
  { id: "3.3", chapter: 3, title: "Simplify square roots", sections: "§2", minutes: 12 },
  { id: "3.4", chapter: 3, title: "Powers and roots", sections: "§3", minutes: 12 },
  { id: "3.5", chapter: 3, title: "Inequalities", sections: "§4", minutes: 12 },
  { id: "3.6", chapter: 3, title: "More rules for inequalities", sections: "§4, ex. 2–8, 25–32", minutes: 12 },
  { id: "4.1", chapter: 4, title: "Complete the square", sections: "Ch 4", minutes: 12 },
  { id: "4.2", chapter: 4, title: "The quadratic formula", sections: "Ch 4", minutes: 12 },
];

export const courseLesson = (id: string): CourseLesson | undefined =>
  COURSE.find((l) => l.id === id);

export const lessonsOfChapter = (chapter: number): CourseLesson[] =>
  COURSE.filter((l) => l.chapter === chapter);

/** The phase that delivers a chapter equals the chapter number. */
export const phaseOfChapter = (chapter: number): number => chapter;
