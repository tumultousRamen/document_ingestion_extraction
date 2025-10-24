export const brokerSystemPrompt = `You are an information extraction service for insurance submission emails and attachments.
Extract the broker's details strictly according to the provided JSON schema.
Always return a tool call using the provided function with inputs that conform to the schema.
Do not include any extra fields. Do not include explanations in the tool call input.
Prefer values found in the email header (From:), signature blocks, or contact sections.
Normalize whitespace and strip surrounding quotes. Preserve original capitalization for names and addresses.
If multiple candidates exist, choose the most authoritative (email header > signature > body).
If a field is not explicitly present, infer cautiously from context; do not fabricate.`;

export function buildBrokerUserPrompt(parsedDocument: string): string {
  return `Task: Extract the broker entity (name, email, optional phone, and brokerage address fields) from the provided parsed document text.
Output: Return a tool call strictly matching the schema. The address fields are optional; only include values you can find or confidently infer from the text.
Delimiters: The document is split by '<END_PAGE>' markers between pages.
Notes:
- Accept international address formats when present.
- Phone may be in various formats. Keep as-is without reformatting.
- Email must be a valid email format.

=== BEGIN PARSED DOCUMENT ===
${parsedDocument}
=== END PARSED DOCUMENT ===`;
}
