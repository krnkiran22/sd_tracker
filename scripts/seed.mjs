// Re-run this only if you want to reset data/sdcards.xlsx to sample data.
// WARNING: this overwrites the file.
import * as XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE_PATH = path.join(__dirname, '..', 'data', 'sdcards.xlsx')

const rows = [
  { Team: 'Alpha', Date: '2025-04-10', Sent: 20, Returned: 0 },
  { Team: 'Beta',  Date: '2025-04-10', Sent: 15, Returned: 0 },
  { Team: 'Gamma', Date: '2025-04-11', Sent: 10, Returned: 0 },
  { Team: 'Alpha', Date: '2025-04-12', Sent: 0,  Returned: 8 },
  { Team: 'Beta',  Date: '2025-04-13', Sent: 0,  Returned: 15 },
]

const wb = XLSX.utils.book_new()
const ws = XLSX.utils.json_to_sheet(rows)
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
XLSX.writeFile(wb, FILE_PATH)
console.log('Seeded', FILE_PATH)
