import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Captures rendered HTML element sheets and exports them directly to a crisp A4 PDF.
 * If container contains .report-page-sheet elements, each sheet will be exported as its own A4 page.
 */
export async function exportSheetsToPdf(containerElement: HTMLElement, filename: string) {
  const sheets = containerElement.querySelectorAll<HTMLElement>('.report-page-sheet')
  const targetSheets = sheets.length > 0 ? Array.from(sheets) : [containerElement]

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pdfWidth = 210 // A4 width in mm
  const pdfHeight = 297 // A4 height in mm

  for (let i = 0; i < targetSheets.length; i++) {
    const sheet = targetSheets[i]
    if (!sheet) continue
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    if (i > 0) {
      pdf.addPage()
    }

    const imgHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight))
  }

  pdf.save(filename)
}
