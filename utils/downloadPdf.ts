/**
 * downloadPdf.ts
 * 
 * All PDF download/generation logic lives here.
 * Generates an IMAGE-based PDF (non-editable, non-malicious, fully fresh).
 * 
 * Features:
 *   - Image-type PDF (html2canvas → jsPDF) — text is burned into image
 *   - Full BLACK font — clean, professional, like a printed document
 *   - Left-aligned text with proper margins (like the reference image)
 *   - AI-response aware: tables rendered only when markdown contains them
 *   - Unremovable "X-GPT" watermark in black, burned into canvas image
 *   - Multi-page support for long content
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface PdfOptions {
    content: string;
    title: string;
    containerElement: HTMLDivElement;
}

// ─────────────────────────────────────────────
// PDF Export Styles — ALL BLACK FONT, left-aligned, clean margins
// ─────────────────────────────────────────────
export const PDF_STYLES = `
    .pdf-export-container {
        width: 794px;
        background: #ffffff;
        color: #000000;
        font-family: 'Georgia', 'Times New Roman', Times, serif;
        padding: 60px 65px 90px 65px;
        box-sizing: border-box;
        min-height: 1123px;
        position: relative;
        margin: 0 auto;
        line-height: 1.75;
        font-size: 15px;
    }

    /* ── Header ── */
    .pdf-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 20px;
        margin-bottom: 30px;
        border-bottom: 2px solid #000000;
    }
    .pdf-header-logo {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        background: #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .pdf-header-logo svg {
        width: 22px;
        height: 22px;
    }
    .pdf-header-text h2 {
        margin: 0;
        font-weight: 800;
        font-size: 26px;
        letter-spacing: -0.5px;
        color: #000000;
    }
    .pdf-header-text p {
        margin: 2px 0 0 0;
        font-size: 11px;
        color: #555555;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        font-weight: 500;
    }

    /* ── Content base — ALL BLACK, left aligned, proper margins ── */
    .pdf-content {
        font-size: 15px;
        line-height: 1.8;
        color: #000000;
        text-align: left;
    }

    /* ── Headings — ALL BLACK ── */
    .pdf-content h1 {
        font-size: 24px;
        font-weight: 800;
        color: #000000;
        text-align: left;
        margin: 30px 0 14px 0;
        text-transform: none;
        letter-spacing: 0;
        border-bottom: 1.5px solid #000000;
        padding-bottom: 6px;
    }
    .pdf-content h2 {
        font-size: 20px;
        font-weight: 700;
        color: #000000;
        text-align: left;
        margin: 26px 0 12px 0;
        border-bottom: 1px solid #cccccc;
        padding-bottom: 4px;
    }
    .pdf-content h3 {
        font-size: 17px;
        font-weight: 700;
        color: #000000;
        margin: 22px 0 10px 0;
        text-align: left;
    }
    .pdf-content h4 {
        font-size: 15px;
        font-weight: 700;
        color: #000000;
        margin: 18px 0 8px 0;
    }
    .pdf-content h5, .pdf-content h6 {
        font-size: 14px;
        font-weight: 700;
        color: #000000;
        margin: 16px 0 6px 0;
    }

    /* ── Paragraphs — black, left aligned ── */
    .pdf-content p {
        margin: 0 0 14px 0;
        text-indent: 0;
        color: #000000;
        text-align: left;
    }

    /* ── Bold / Italic — ALL BLACK ── */
    .pdf-content strong {
        font-weight: 700;
        color: #000000;
    }
    .pdf-content em {
        font-style: italic;
        color: #000000;
    }

    /* ── Tables — clean black style ── */
    .pdf-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 14px;
        border: 1.5px solid #000000;
    }
    .pdf-content thead th {
        background: #000000;
        color: #ffffff;
        font-weight: 700;
        padding: 10px 12px;
        text-align: center;
        border: 1px solid #000000;
        font-size: 13px;
    }
    .pdf-content th {
        background: #000000;
        color: #ffffff;
        font-weight: 700;
        padding: 10px 12px;
        text-align: center;
        border: 1px solid #000000;
        font-size: 13px;
    }
    .pdf-content tbody td {
        padding: 9px 12px;
        border: 1px solid #333333;
        color: #000000;
        text-align: left;
        vertical-align: top;
    }
    .pdf-content td {
        padding: 9px 12px;
        border: 1px solid #333333;
        color: #000000;
        text-align: left;
        vertical-align: top;
    }
    .pdf-content tbody tr:nth-child(even) {
        background: #f5f5f5;
    }
    .pdf-content tbody tr:nth-child(odd) {
        background: #ffffff;
    }
    .pdf-content tr:nth-child(even) {
        background: #f5f5f5;
    }

    /* ── Lists — black ── */
    .pdf-content ul, .pdf-content ol {
        margin: 10px 0 16px 0;
        padding-left: 24px;
        color: #000000;
    }
    .pdf-content li {
        margin-bottom: 6px;
        color: #000000;
    }

    /* ── Code blocks — clean ── */
    .pdf-content pre {
        background: #f7f7f7;
        padding: 14px 18px;
        border: 1px solid #dddddd;
        border-left: 4px solid #000000;
        border-radius: 4px;
        margin: 18px 0;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #000000;
        line-height: 1.5;
        overflow-x: hidden;
    }
    .pdf-content code {
        font-family: 'Consolas', 'Courier New', monospace;
        background: #f0f0f0;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 12px;
        color: #000000;
    }
    .pdf-content pre code {
        background: none;
        padding: 0;
        color: #000000;
    }

    /* ── Blockquote ── */
    .pdf-content blockquote {
        border-left: 4px solid #000000;
        margin: 16px 0;
        padding: 10px 18px;
        background: #f9f9f9;
        color: #000000;
        font-style: italic;
    }
    .pdf-content blockquote p {
        margin: 0;
        color: #000000;
    }

    /* ── Horizontal rule ── */
    .pdf-content hr {
        border: none;
        border-top: 1px solid #cccccc;
        margin: 24px 0;
    }

    /* ── Links ── */
    .pdf-content a {
        color: #000000;
        text-decoration: underline;
    }

    /* ── Footer ── */
    .pdf-footer {
        margin-top: 40px;
        padding-top: 16px;
        border-top: 1px solid #cccccc;
        text-align: center;
        font-size: 10px;
        color: #888888;
        letter-spacing: 1px;
    }
`;

// ─────────────────────────────────────────────
// Watermark: Burn "X-GPT" into the canvas (UNREMOVABLE)
// ─────────────────────────────────────────────
function burnWatermark(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // 1) Subtle diagonal watermarks across the entire page
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 140px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const step = 450;
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(-Math.PI / 6);
    for (let y = -ch; y < ch * 2; y += step) {
        for (let x = -cw; x < cw * 2; x += step * 1.5) {
            ctx.fillText('X-GPT', x - cw / 2, y - ch / 2);
        }
    }
    ctx.restore();

    // 2) Strong black watermark at the bottom center — clearly visible, UNREMOVABLE
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 1;
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('X-GPT', cw / 2, ch - 35);

    // Line under watermark
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cw / 2 - 55, ch - 29);
    ctx.lineTo(cw / 2 + 55, ch - 29);
    ctx.stroke();
    ctx.restore();

    // 3) Tiny scattered micro-watermarks (extremely hard to remove)
    ctx.save();
    ctx.globalAlpha = 0.018;
    ctx.fillStyle = '#000000';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    for (let y = 80; y < ch; y += 180) {
        for (let x = 80; x < cw; x += 260) {
            ctx.fillText('X-GPT', x, y);
        }
    }
    ctx.restore();
}

// ─────────────────────────────────────────────
// Main: Generate & Download PDF
// ─────────────────────────────────────────────
export async function generateAndDownloadPdf(options: PdfOptions): Promise<void> {
    const { title, containerElement } = options;

    // IMPORTANT: Move element to document body for proper rendering
    // The hidden container needs to be in the DOM flow for html2canvas
    const originalParent = containerElement.parentElement;
    const originalDisplay = containerElement.style.display;
    const originalPosition = containerElement.style.position;

    // Position off-screen but visible for rendering
    containerElement.style.display = 'block';
    containerElement.style.position = 'fixed';
    containerElement.style.left = '-9999px';
    containerElement.style.top = '0';
    containerElement.style.zIndex = '-1';
    document.body.appendChild(containerElement);

    // Wait for fonts & styles to apply
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        // Render to high-quality canvas (IMAGE-based: all text becomes pixels)
        const canvas = await html2canvas(containerElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 794,
            allowTaint: false,
            imageTimeout: 15000,
            onclone: (clonedDoc) => {
                // Ensure all text in the cloned document is black
                const container = clonedDoc.querySelector('.pdf-export-container') as HTMLElement;
                if (container) {
                    container.style.color = '#000000';
                    // Force all children to be black
                    const allElements = container.querySelectorAll('*');
                    allElements.forEach((el) => {
                        const htmlEl = el as HTMLElement;
                        const tag = htmlEl.tagName.toLowerCase();
                        // Keep table header white text on black bg
                        if (tag === 'th') {
                            htmlEl.style.color = '#ffffff';
                            htmlEl.style.backgroundColor = '#000000';
                        } else {
                            htmlEl.style.color = '#000000';
                        }
                    });
                }
            }
        });

        // Restore element to original parent
        if (originalParent) {
            originalParent.appendChild(containerElement);
        }
        containerElement.style.display = originalDisplay || 'none';
        containerElement.style.position = originalPosition || '';
        containerElement.style.left = '';
        containerElement.style.top = '';
        containerElement.style.zIndex = '';

        // Burn watermark directly into the canvas pixels (UNREMOVABLE)
        burnWatermark(canvas);

        // Convert canvas to high quality PNG
        const imgData = canvas.toDataURL('image/png', 1.0);

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        // Additional pages if content is long
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        // Save with safe filename — use data URI to avoid "Insecure download blocked"
        const safeTitle = title
            .replace(/[^a-z0-9\u0980-\u09FF]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase() || 'xgpt_document';

        // Get PDF as blob to avoid "Insecure download blocked" which happens for large data URIs
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeTitle}_XGPT.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        // Delay cleanup to ensure download initiates properly
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 500);

    } catch (err) {
        // Restore element on error too
        if (originalParent && !originalParent.contains(containerElement)) {
            originalParent.appendChild(containerElement);
        }
        containerElement.style.display = 'none';
        containerElement.style.position = '';
        containerElement.style.left = '';
        containerElement.style.top = '';
        containerElement.style.zIndex = '';
        console.error('[X-GPT] PDF Generation Failed:', err);
        throw err;
    }
}
