import { parseDocument } from "~/foundations/reducto/reducto";
import { getPresignedUrls } from "~/foundations/aws/s3";

type ParseDocumentWithReductoArgs = {
  objectKey: string;
  delimiterStyle?: "simple" | "numbered";
};

export async function parseDocumentWithReducto({
  objectKey,
  delimiterStyle = "simple",
}: ParseDocumentWithReductoArgs): Promise<string> {
  const { GET } = await getPresignedUrls({
    key: objectKey,
  });

  const { chunks } = await parseDocument(GET, {});

  if (delimiterStyle === "numbered") {
    return chunks
      .map(
        (chunk, i) =>
          `<START_PAGE_${i + 1}>\n${chunk.content}\n<END_PAGE_${i + 1}>`,
      )
      .join("\n");
  }

  return chunks.map((chunk) => chunk.content).join("\n<END_PAGE>\n");
}
