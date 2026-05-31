import ExcelJS from 'exceljs'
import {
  openWorkbook,
  saveWorkbook,
  getAcertoSheet,
  getCellText,
  getCellNumber,
  getCellFormula,
} from './excel'
import type { MonthBlock, MonthSummary, ExpenseEntry } from './types'

const SENTINEL_HEADER = 'Mês Referência'
const SENTINEL_TOTAL = 'TOTAL DESCONTOS'
const SENTINEL_SALDO = 'TOTAL RESTANTE DÍVIDA'

const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatDateLabel(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v instanceof Date) {
    return `${PT_MONTHS[v.getUTCMonth()]} ${v.getUTCFullYear()}`
  }
  if (typeof v === 'object' && v !== null && 'formula' in v) {
    const result = (v as ExcelJS.CellFormulaValue).result
    if (result instanceof Date) {
      return `${PT_MONTHS[result.getUTCMonth()]} ${result.getUTCFullYear()}`
    }
    return String(result ?? '').trim()
  }
  return String(v ?? '').trim()
}

function parseExpenseRow(row: ExcelJS.Row, rowNumber: number): ExpenseEntry {
  const description = getCellText(row, 3)
  const formula = getCellFormula(row, 4)
  const resolvedValue = getCellNumber(row, 4)
  return {
    rowIndex: rowNumber,
    description,
    rawFormula: formula,
    resolvedValue,
    isFormula: formula !== null,
  }
}

function _parseBlocks(ws: ExcelJS.Worksheet): MonthBlock[] {
  const blocks: MonthBlock[] = []
  let awaitingMonthData = false
  let currentBlock: Partial<MonthBlock> | null = null
  let currentExpenses: ExpenseEntry[] = []

  ws.eachRow((row, rowNumber) => {
    const colA = getCellText(row, 1)
    const colC = getCellText(row, 3)

    // Sentinel: start of new block
    if (colA === SENTINEL_HEADER) {
      awaitingMonthData = true
      return
    }

    // First data row of the block — gives month label, valorAPagar, and is also an expense
    if (awaitingMonthData) {
      awaitingMonthData = false
      const monthLabel = formatDateLabel(row.getCell(1)) || colA
      currentBlock = {
        monthLabel,
        headerRowIndex: rowNumber,
        valorAPagar: getCellNumber(row, 2),
        valorAPagarRowIndex: rowNumber,
      }
      currentExpenses = []
      // This row is also an expense if col C and D are populated
      if (colC && colC !== SENTINEL_TOTAL && colC !== SENTINEL_SALDO) {
        currentExpenses.push(parseExpenseRow(row, rowNumber))
      }
      return
    }

    if (!currentBlock) return

    if (colC === SENTINEL_TOTAL) {
      currentBlock.totalDescontosRowIndex = rowNumber
      currentBlock.totalDescontos = getCellNumber(row, 4)
      return
    }

    if (colC === SENTINEL_SALDO) {
      currentBlock.saldoRowIndex = rowNumber
      currentBlock.saldo = getCellNumber(row, 4)
      blocks.push({ ...currentBlock, expenses: currentExpenses } as MonthBlock)
      currentBlock = null
      currentExpenses = []
      return
    }

    // Regular expense row
    if (colC) {
      currentExpenses.push(parseExpenseRow(row, rowNumber))
    }
  })

  return blocks
}

export async function getAllMonthBlocks(): Promise<MonthBlock[]> {
  const wb = await openWorkbook()
  const ws = getAcertoSheet(wb)
  return _parseBlocks(ws)
}

export async function getMonthSummaries(): Promise<MonthSummary[]> {
  const blocks = await getAllMonthBlocks()
  return blocks.map((b) => ({
    monthLabel: b.monthLabel,
    headerRowIndex: b.headerRowIndex,
    saldo: b.saldo,
    valorAPagar: b.valorAPagar,
  }))
}

export async function getMonthBlock(headerRowIndex: number): Promise<MonthBlock> {
  const blocks = await getAllMonthBlocks()
  const block = blocks.find((b) => b.headerRowIndex === headerRowIndex)
  if (!block) throw new Error(`Month block at row ${headerRowIndex} not found`)
  return block
}

export async function getLastMonthBlock(): Promise<MonthBlock | null> {
  const blocks = await getAllMonthBlocks()
  return blocks.length > 0 ? blocks[blocks.length - 1] : null
}

function rebuildTotalFormula(ws: ExcelJS.Worksheet, block: MonthBlock): void {
  // Expenses start at headerRowIndex + 1 (first data row is headerRowIndex, expenses start there too)
  // But the first expense IS the headerRowIndex row, so range is headerRowIndex:totalDescontosRowIndex-1
  const firstExpenseRow = block.headerRowIndex
  const lastExpenseRow = block.totalDescontosRowIndex - 1
  const totalRow = ws.getRow(block.totalDescontosRowIndex)
  if (firstExpenseRow > lastExpenseRow) {
    totalRow.getCell(4).value = 0
  } else {
    totalRow.getCell(4).value = {
      formula: `SUM(D${firstExpenseRow}:D${lastExpenseRow})`,
      result: block.totalDescontos,
    }
  }
  totalRow.commit()
}

export async function addExpenseToSheet(
  headerRowIndex: number,
  description: string,
  value: number,
  formulaString?: string
): Promise<void> {
  const wb = await openWorkbook()
  const ws = getAcertoSheet(wb)
  const blocks = _parseBlocks(ws)
  const block = blocks.find((b) => b.headerRowIndex === headerRowIndex)
  if (!block) throw new Error(`Block not found at row ${headerRowIndex}`)

  // Insert a new row just before TOTAL DESCONTOS
  ws.spliceRows(block.totalDescontosRowIndex, 0, [])

  // The new row is now at block.totalDescontosRowIndex (TOTAL moved to +1)
  const newRow = ws.getRow(block.totalDescontosRowIndex)
  // Copy col A and B from the header row (month label and valorAPagar)
  const headerRow = ws.getRow(block.headerRowIndex)
  newRow.getCell(1).value = headerRow.getCell(1).value
  newRow.getCell(2).value = headerRow.getCell(2).value
  newRow.getCell(3).value = description
  if (formulaString) {
    newRow.getCell(4).value = { formula: formulaString, result: value }
  } else {
    newRow.getCell(4).value = value
  }
  newRow.commit()

  // TOTAL DESCONTOS is now at totalDescontosRowIndex + 1
  const updatedBlock = { ...block, totalDescontosRowIndex: block.totalDescontosRowIndex + 1 }
  rebuildTotalFormula(ws, updatedBlock)

  // Update SALDO formula reference
  const saldoRow = ws.getRow(updatedBlock.saldoRowIndex + 1)
  saldoRow.getCell(4).value = {
    formula: `B${updatedBlock.headerRowIndex}-D${updatedBlock.totalDescontosRowIndex}`,
    result: updatedBlock.valorAPagar - updatedBlock.totalDescontos,
  }
  saldoRow.commit()

  await saveWorkbook(wb)
}

export async function updateExpenseInSheet(
  rowIndex: number,
  description?: string,
  value?: number,
  formulaString?: string
): Promise<void> {
  const wb = await openWorkbook()
  const ws = getAcertoSheet(wb)
  const row = ws.getRow(rowIndex)
  if (description !== undefined) row.getCell(3).value = description
  if (value !== undefined) {
    if (formulaString) {
      row.getCell(4).value = { formula: formulaString, result: value }
    } else {
      row.getCell(4).value = value
    }
  }
  row.commit()
  await saveWorkbook(wb)
}

export async function deleteExpenseFromSheet(rowIndex: number): Promise<void> {
  const wb = await openWorkbook()
  const ws = getAcertoSheet(wb)
  const blocks = _parseBlocks(ws)

  const block = blocks.find(
    (b) => rowIndex >= b.headerRowIndex && rowIndex < b.totalDescontosRowIndex
  )
  if (!block) throw new Error(`Row ${rowIndex} is not an expense row in any block`)

  ws.spliceRows(rowIndex, 1)

  // Splice shifted totalDescontosRowIndex by -1
  const updatedBlock = {
    ...block,
    totalDescontosRowIndex: block.totalDescontosRowIndex - 1,
    saldoRowIndex: block.saldoRowIndex - 1,
  }
  rebuildTotalFormula(ws, updatedBlock)

  await saveWorkbook(wb)
}

export async function createNewMonthInSheet(monthLabel: string): Promise<void> {
  const wb = await openWorkbook()
  const ws = getAcertoSheet(wb)
  const blocks = _parseBlocks(ws)
  if (blocks.length === 0) throw new Error('No existing blocks found')

  const last = blocks[blocks.length - 1]
  const lastRow = ws.rowCount

  // Blank spacer
  ws.getRow(lastRow + 1).commit()

  // Sentinel header row
  const sentinelRowNum = lastRow + 2
  const sr = ws.getRow(sentinelRowNum)
  sr.getCell(1).value = 'Mês Referência'
  sr.getCell(2).value = 'Valor a Pagar'
  sr.getCell(3).value = 'Descontos Valor a Pagar'
  sr.getCell(4).value = 'Valor (R$)'
  sr.commit()

  // First data row (also the "header" for this block in our model)
  // Col B references the TOTAL RESTANTE of the last block
  const dataRowNum = lastRow + 3
  const dr = ws.getRow(dataRowNum)
  dr.getCell(1).value = monthLabel
  dr.getCell(2).value = { formula: `D${last.saldoRowIndex}`, result: last.saldo }
  dr.getCell(3).value = ''
  dr.getCell(4).value = ''
  dr.commit()

  // TOTAL DESCONTOS row (no expenses yet)
  const totalRowNum = lastRow + 4
  const tr = ws.getRow(totalRowNum)
  tr.getCell(1).value = monthLabel
  tr.getCell(2).value = { formula: `D${last.saldoRowIndex}`, result: last.saldo }
  tr.getCell(3).value = SENTINEL_TOTAL
  // Empty sum range (dataRowNum to dataRowNum since no real expenses)
  tr.getCell(4).value = { formula: `SUM(D${dataRowNum}:D${dataRowNum})`, result: 0 }
  tr.commit()

  // TOTAL RESTANTE DÍVIDA row
  const saldoRowNum = lastRow + 5
  const slr = ws.getRow(saldoRowNum)
  slr.getCell(1).value = monthLabel
  slr.getCell(2).value = { formula: `D${last.saldoRowIndex}`, result: last.saldo }
  slr.getCell(3).value = SENTINEL_SALDO
  slr.getCell(4).value = { formula: `B${dataRowNum}-D${totalRowNum}`, result: last.saldo }
  slr.commit()

  await saveWorkbook(wb)
}
