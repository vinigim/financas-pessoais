/**
 * One-time migration: reads the Excel file and imports all data into Neon Postgres.
 * Run once: npx tsx src/lib/migrate-excel-to-db.ts
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import ExcelJS from 'exceljs'

const FILE = process.env.XLSX_PATH ?? 'C:\\Users\\vfgim\\OneDrive\\Documentos\\Controle Aluguel Antonieta Vilella.xlsx'
const SHEET = process.env.SHEET_ACERTO ?? 'Acerto Gabi'

const SENTINEL_HEADER = 'Mês Referência'
const SENTINEL_TOTAL = 'TOTAL DESCONTOS'
const SENTINEL_SALDO = 'TOTAL RESTANTE DÍVIDA'

const PT_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function getCellText(row: ExcelJS.Row, col: number): string {
  const cell = row.getCell(col)
  const v = cell.value
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'object' && 'richText' in v) return (v as ExcelJS.CellRichTextValue).richText.map(r => r.text).join('').trim()
  if (typeof v === 'object' && 'formula' in v) {
    const res = (v as ExcelJS.CellFormulaValue).result
    return res !== null && res !== undefined ? String(res).trim() : ''
  }
  return String(v).trim()
}

function getCellNumber(row: ExcelJS.Row, col: number): number {
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

function getCellFormula(row: ExcelJS.Row, col: number): string | null {
  const cell = row.getCell(col)
  const v = cell.value
  if (v && typeof v === 'object' && 'formula' in v) return (v as ExcelJS.CellFormulaValue).formula ?? null
  return null
}

function formatDateLabel(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v instanceof Date) return `${PT_MONTHS[v.getUTCMonth()]} ${v.getUTCFullYear()}`
  if (typeof v === 'object' && v !== null && 'formula' in v) {
    const result = (v as ExcelJS.CellFormulaValue).result
    if (result instanceof Date) return `${PT_MONTHS[result.getUTCMonth()]} ${result.getUTCFullYear()}`
    return String(result ?? '').trim()
  }
  return String(v ?? '').trim()
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log('Creating schema...')
  await sql`CREATE TABLE IF NOT EXISTS months (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    position INTEGER NOT NULL,
    initial_valor_a_pagar NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS months_position_idx ON months(position)`
  await sql`CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    value NUMERIC(12,2) NOT NULL DEFAULT 0,
    formula_string TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`

  console.log('Clearing existing data...')
  await sql`TRUNCATE months CASCADE`
  await sql`ALTER SEQUENCE months_id_seq RESTART WITH 1`
  await sql`ALTER SEQUENCE expenses_id_seq RESTART WITH 1`

  console.log('Reading Excel file:', FILE)
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(FILE)
  const ws = wb.getWorksheet(SHEET)!

  type RawBlock = {
    label: string
    valorAPagar: number
    expenses: { description: string; value: number; formula: string | null }[]
  }

  const blocks: RawBlock[] = []
  let awaitingData = false
  let current: Partial<RawBlock> | null = null

  ws.eachRow((row, _) => {
    const colA = getCellText(row, 1)
    const colC = getCellText(row, 3)

    if (colA === SENTINEL_HEADER) { awaitingData = true; return }

    if (awaitingData) {
      awaitingData = false
      const label = formatDateLabel(row.getCell(1)) || colA
      current = { label, valorAPagar: getCellNumber(row, 2), expenses: [] }
      if (colC && colC !== SENTINEL_TOTAL && colC !== SENTINEL_SALDO) {
        current.expenses!.push({ description: colC, value: getCellNumber(row, 4), formula: getCellFormula(row, 4) })
      }
      return
    }

    if (!current) return

    if (colC === SENTINEL_SALDO) {
      blocks.push(current as RawBlock)
      current = null
      return
    }

    if (colC === SENTINEL_TOTAL) return

    if (colC) {
      current.expenses!.push({ description: colC, value: getCellNumber(row, 4), formula: getCellFormula(row, 4) })
    }
  })

  console.log(`Found ${blocks.length} blocks in Excel. Importing...`)

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const [month] = await sql`
      INSERT INTO months (label, position, initial_valor_a_pagar)
      VALUES (${b.label}, ${i + 1}, ${i === 0 ? b.valorAPagar : 0})
      RETURNING id
    `
    for (let j = 0; j < b.expenses.length; j++) {
      const e = b.expenses[j]
      await sql`
        INSERT INTO expenses (month_id, description, value, formula_string, position)
        VALUES (${month.id}, ${e.description}, ${e.value}, ${e.formula}, ${j + 1})
      `
    }
    console.log(`  [${i + 1}/${blocks.length}] ${b.label} — ${b.expenses.length} despesas`)
  }

  console.log('Migration complete!')
}

main().catch(console.error)
