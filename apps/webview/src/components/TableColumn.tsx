import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  KeyIcon,
  LinkIcon,
  ZapIcon,
  FingerprintPatternIcon,
  DiamondIcon,
  Table2Icon,
  HashIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'

interface TableColumnProps {
  name: string
  type: string
  nullable: boolean
  isPK: boolean
  isFK: boolean
  fkTargetTable?: string
  fkTargetColumn?: string
  isIdentity: boolean
  isUnique: boolean
  isIndexed: boolean
}

interface ColumnIndicator {
  id: string
  condition: boolean
  icon: LucideIcon
  tooltip: string
  className?: string
}

function TableColumn({
  name,
  type,
  nullable,
  isPK,
  isFK,
  fkTargetTable,
  fkTargetColumn,
  isIdentity,
  isUnique,
  isIndexed,
}: TableColumnProps) {
  const indicators: ColumnIndicator[] = [
    {
      id: 'identity',
      condition: isIdentity,
      icon: HashIcon,
      tooltip: 'Identity',
      className: 'text-accent-foreground',
    },
    {
      id: 'unique',
      condition: isUnique && !isPK,
      icon: FingerprintPatternIcon,
      tooltip: 'Unique',
      className: 'text-muted-foreground',
    },
    {
      id: 'indexed',
      condition: isIndexed && !isPK,
      icon: ZapIcon,
      tooltip: 'Indexed',
      className: 'text-muted-foreground/40',
    },
  ]

  return (
    <div
      className={cn(
        'px-4 py-2 flex items-center gap-3 text-[13px] relative group',
        isPK && 'bg-primary/5',
        isFK && 'bg-accent/5'
      )}
    >
      <div className="flex items-center gap-1 shrink-0 min-w-[1.25rem]">
        {isPK && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <KeyIcon className="size-3 text-primary" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Primary Key</TooltipContent>
          </Tooltip>
        )}

        {isFK && (
          <HoverCard openDelay={100} closeDelay={150}>
            <HoverCardTrigger asChild>
              <span className="cursor-pointer">
                <LinkIcon className="size-3 text-accent-foreground" />
              </span>
            </HoverCardTrigger>
            <HoverCardContent side="right" align="start" sideOffset={8} className="w-64 p-0">
              <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center gap-2">
                  <LinkIcon className="size-3.5 text-accent-foreground" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Foreign Key
                  </span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      References
                    </span>
                    <button
                      className="w-full flex items-center gap-2.5 mt-1 px-2.5 py-2 rounded-md bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors text-left group/table cursor-pointer"
                    >
                      <div className="flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary shrink-0">
                        <Table2Icon className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-sm font-medium text-primary truncate">
                          {fkTargetTable}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground truncate">
                          {fkTargetColumn}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}

        {indicators
          .filter((ind) => ind.condition)
          .map((ind) => {
            const Icon = ind.icon
            return (
              <Tooltip key={ind.id}>
                <TooltipTrigger asChild>
                  <span>
                    <Icon className={cn('size-3', ind.className)} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{ind.tooltip}</TooltipContent>
              </Tooltip>
            )
          })}
      </div>

      <span
        className={cn(
          'font-mono flex-1 truncate',
          isPK
            ? 'text-primary font-bold'
            : isFK
              ? 'text-accent-foreground font-bold'
              : 'text-foreground/80'
        )}
      >
        {name}
      </span>

      <span className="font-mono text-[11px] text-muted-foreground/60">{type}</span>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="ml-1">
            <DiamondIcon
              className="size-3 text-foreground/60"
              fill={nullable ? 'none' : 'currentColor'}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>{nullable ? 'Nullable' : 'Not Null'}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default memo(TableColumn)
