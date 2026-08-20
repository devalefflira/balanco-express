import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const pdfText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(errData.parserError || errData);
      });

      pdfParser.on('pdfParser_dataReady', () => {
        const rawText = (pdfParser as any).getRawTextContent();
        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({ text: pdfText });
  } catch (error: any) {
    console.error('Erro ao extrair texto do PDF:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o arquivo PDF: ' + (error.message || error) },
      { status: 500 }
    );
  }
}