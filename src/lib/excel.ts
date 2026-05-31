import ExcelJS from 'exceljs'

const XLSX_PATH = process.env.XLSX_PATH!
const SHEET_ACERTO = process.env.SHEET_ACERTO ?? 'Acerto Gabi'

export async function openWorkbook(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(XLSX_PATH)
  return wb
}

export async function saveWorkbook(wb: ExcelJS.Workbook): Promise<void> {
  await wb.xlsx.writeFile(XLSX_PATH)
}

export function getAcertoSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet = wb.getWorksheet(SHEET_ACERTO)
  if (!sheet) throw new Error(`Sheet "${SHEET_ACERTO}" not found`)
  return sheet
}

export function getCellText(row: ExcelJS.Row, col: number): string {
  const cell = row.getCell(col)
  const v = cell.value
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'object' && 'richText' in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('').trim()
  }
  if (typeof v === 'object' && 'formula' in v) {
    const res = (v as ExcelJS.CellFormulaValue).result
    return res !== null && res !== undefined ? String(res).trim() : ''
  }
  return String(v).trim()
}

export function getCellNumber(row: ExcelJS.Row, col: number): number {
  const cell = row.getCell(col)
  const v = cell.value
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'object' && 'formula' in v) {
    const res = (v as ExcelJS.CellFormulaValue).result
    return typeof res === 'number' ? res : 0
  }
  return parseFloat(String(v)) || 0
}

export function getCellFormula(row: ExcelJS.Row, col: number): string | null {
  const cell = row.getCell(col)
  const v = cell.value
  if (v && typeof v === 'object' && 'formula' in v) {
    return (v as ExcelJS.CellFormulaValue).formula ?? null
  }
  return null
}
