import * as pdfjsLib from 'pdfjs-dist';

// Type definition for the text item
interface TextItem {
    str: string;
    dir: string;
    width: number;
    height: number;
    transform: number[];
    fontName: string;
    hasEOL: boolean;
}

// Ensure worker is loaded - simplified for Vite
// In a real prod build we'd copy the worker file, but for this simpler setup:
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function parseFile(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
        return parsePDF(file);
    } else {
        return parseText(file);
    }
}

async function parseText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

async function parsePDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => (item as TextItem).str)
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}
