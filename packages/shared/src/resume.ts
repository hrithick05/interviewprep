export const RESUME_SECTIONS = [
  "contact",
  "summary",
  "education",
  "experience",
  "projects",
  "skills",
  "certifications",
  "achievements",
  "custom",
] as const;

export type ResumeSectionId = (typeof RESUME_SECTIONS)[number];

export function reorderResumeSections(
  order: ResumeSectionId[],
  fromIndex: number,
  toIndex: number,
): ResumeSectionId[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= order.length || toIndex >= order.length) {
    return [...order];
  }
  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return [...order];
  next.splice(toIndex, 0, moved);
  return next;
}

export function moveResumeSection(
  order: ResumeSectionId[],
  id: ResumeSectionId,
  direction: "up" | "down",
): ResumeSectionId[] {
  const index = order.indexOf(id);
  if (index < 0) return [...order];
  const target = direction === "up" ? index - 1 : index + 1;
  return reorderResumeSections(order, index, target);
}
