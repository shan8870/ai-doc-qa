export type ParsePdfResult = {
  text: string;
  pageCount: number;
};

export async function parsePdf(buffer: Buffer): Promise<ParsePdfResult> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);

  return {
    text: data.text.trim(),
    pageCount: data.numpages,
  };
}
