export async function greetActivity(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

export type Activities = {
  greetActivity: typeof greetActivity;
};
