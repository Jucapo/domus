import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const hues = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
]
const tierDefs = [
  { suf: '-50', bg: '50', border: '200', surfA: '50', surfB: '60' },
  { suf: '', bg: '100', border: '200', surfA: '50', surfB: '60' },
  { suf: '-200', bg: '200', border: '300', surfA: '100', surfB: '60' },
  { suf: '-300', bg: '300', border: '400', surfA: '200', surfB: '60' },
]

function textFor(hue, tierIdx) {
  if (tierIdx === 1 && hue === 'amber') return '800'
  if (tierIdx === 0 && hue === 'amber') return '800'
  if (tierIdx <= 1) return '700'
  if (tierIdx === 2) return '900'
  return '950'
}

const all = []
for (const h of hues) {
  tierDefs.forEach((t, i) => {
    const id = i === 1 ? h : h + t.suf
    const tx = textFor(h, i)
    const className = `bg-${h}-${t.bg} text-${h}-${tx} border-${h}-${t.border}`
    const surfaceClassName = `bg-${h}-${t.surfA}/${t.surfB} border-${h}-${t.border}`
    all.push({ id, className, surfaceClassName })
  })
}

const drop = new Set([
  'slate-300',
  'gray-300',
  'zinc-300',
  'neutral-300',
  'stone-300',
  'red-300',
  'orange-300',
])
const out = all.filter((o) => !drop.has(o.id))

const legacy = {
  slate: {
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    surfaceClassName: 'bg-slate-50/60 border-slate-200',
  },
  indigo: {
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    surfaceClassName: 'bg-indigo-50/60 border-indigo-200',
  },
  violet: {
    className: 'bg-violet-100 text-violet-700 border-violet-200',
    surfaceClassName: 'bg-violet-50/60 border-violet-200',
  },
  sky: {
    className: 'bg-sky-100 text-sky-700 border-sky-200',
    surfaceClassName: 'bg-sky-50/60 border-sky-200',
  },
  emerald: {
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    surfaceClassName: 'bg-emerald-50/60 border-emerald-200',
  },
  amber: {
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    surfaceClassName: 'bg-amber-50/60 border-amber-200',
  },
  rose: {
    className: 'bg-rose-100 text-rose-700 border-rose-200',
    surfaceClassName: 'bg-rose-50/60 border-rose-200',
  },
}
for (const o of out) {
  if (legacy[o.id]) Object.assign(o, legacy[o.id])
}

if (out.length !== 81) {
  console.error('Expected 81 colors, got', out.length)
  process.exit(1)
}

const body = out
  .map(
    (o) =>
      `  { id: '${o.id}', className: '${o.className}', surfaceClassName: '${o.surfaceClassName}' },`,
  )
  .join('\n')

fs.writeFileSync(path.join(__dirname, '../src/data/_colors_generated.txt'), body)
console.log('ok', out.length)
