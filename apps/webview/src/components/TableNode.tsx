import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { TableNodeData } from '@/lib/transform'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useSelectedTable } from './SchemaGraph'
import {
  EllipsisVerticalIcon,
  Table2Icon,
  CopyIcon,
  CheckIcon,
} from 'lucide-react'
import { Button } from './ui/button'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { useState } from 'react'
import TableColumn from './TableColumn'

const HIGHLIGHT_STYLES = {
  selected: 'ring-2 ring-primary/70',
  outgoing: 'ring-2 ring-cyan-500 ring-offset-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
  incoming: 'ring-2 ring-pink-500 ring-offset-2 shadow-[0_0_12px_rgba(236,72,153,0.2)]',
  both: 'ring-2 ring-primary ring-offset-2 shadow-[0_0_12px_rgba(var(--primary),0.2)]',
} as const

function TableNode({ data, id }: NodeProps<TableNodeData>) {
  const { table, foreignKeys } = data
  const selectedTable = useSelectedTable()

  const isPK = (col: string) => table.primaryKeys.includes(col)
  const isIndexed = (col: string) => table.indexes.some((idx) => idx.columns.includes(col))
  const getFK = (col: string) => foreignKeys.find((fk) => fk.column === col)

  const isIdentity = (col: typeof table.columns[0]) =>
    col.defaultValue !== null && /nextval\(|generated\s+.*identity/i.test(col.defaultValue)

  const isUnique = (col: string) =>
    table.indexes.some((idx) => idx.unique && idx.columns.includes(col))

  const isSelected = selectedTable && id === selectedTable
  const [copied, setCopied] = useState<'copy_name' | 'copy_sql' | 'copy_markdown' | null>(null)

  const copy = (text: string, type: 'copy_name' | 'copy_sql' | 'copy_markdown') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 1500)
  }

  const copyName = () => copy(table.name, 'copy_name')

  const copyAsSQL = () => {
    const columns = table.columns.map((c) => `  ${c.name} ${c.type}${c.nullable ? '' : ' NOT NULL'}`).join(',\n')
    const pk = table.primaryKeys.length
      ? `  PRIMARY KEY (${table.primaryKeys.join(', ')})`
      : ''
    const sql = `CREATE TABLE ${table.name} (\n${columns}${pk ? ',\n' + pk : ''}\n);`
    copy(sql, 'copy_sql')
  }

  const copyAsMarkdown = () => {
    const header = `| Column | Type | Nullable |`
    const separator = `|--------|------|----------|`
    const rows = table.columns
      .map((c) => `| ${c.name} | ${c.type} | ${c.nullable ? 'YES' : 'NO'} |`)
      .join('\n')
    copy(`${header}\n${separator}\n${rows}`, 'copy_markdown')
  }

  return (
    <div
      className={cn(
        'min-w-[280px] rounded overflow-hidden shadow-2xl transition-all duration-300 bg-card border border-border',
        isSelected ? HIGHLIGHT_STYLES.selected : 'ring-0'
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />

      <div className="px-2.5 py-1.5 flex items-center justify-between bg-muted/30 border-b border-border">
        <div className='flex items-center gap-2'>
          <Table2Icon className="size-4" />
          <span className="text-sm text-foreground font-mono font-medium">{table.name}</span>
          <Badge variant="outline" className='h-5 px-1.5 text-[10px] font-medium bg-background/50 rounded-2xl'>
            {table.columns.length} cols
          </Badge>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-xs" className='rounded text-foreground'><EllipsisVerticalIcon className="size-4" /></Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={4}>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={copyName}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                {copied == 'copy_name' ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
                Copy name
              </button>
              <button
                onClick={copyAsSQL}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                {copied == 'copy_sql' ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
                Copy as SQL
              </button>
              <button
                onClick={copyAsMarkdown}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                {copied == 'copy_markdown' ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
                Copy as Markdown
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="py-1">
        {table.columns.map((col) => {
          const pk = isPK(col.name)
          const fk = getFK(col.name)
          const indexed = isIndexed(col.name)

          return (
            <TableColumn
              key={col.name}
              name={col.name}
              type={col.type}
              nullable={col.nullable}
              isPK={pk}
              isFK={!!fk}
              fkTargetTable={fk?.targetTable}
              fkTargetColumn={fk?.targetColumn}
              isIdentity={isIdentity(col)}
              isUnique={isUnique(col.name)}
              isIndexed={indexed}
            />
          )
        })}
      </div>

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}

export default memo(TableNode)
