export function generateProjectMd(name: string, description: string, date: string): string {
  const descBlock = description ? `${description}\n\n` : "";
  return (
    `# ${name}\n\n` +
    descBlock +
    `**Phase:** initialized\n` +
    `**Created:** ${date}\n\n` +
    `---\n\n` +
    `## Activity Log\n\n` +
    `- ${date} — Project created\n`
  );
}
