import * as vscode from 'vscode'
import type { Schema, Table, Column, Index, Relation } from './db.js'

export type TableDetailNode =
  | { type: 'table'; table: Table; schema: Schema }
  | { type: 'section'; label: string; table: Table; sectionType: 'columns' | 'indexes' | 'relations' | 'primaryKeys' }
  | { type: 'column'; column: Column; table: Table; isPK: boolean; isFK: boolean; fkTarget?: string }
  | { type: 'index'; index: Index }
  | { type: 'relation'; relation: Relation; direction: 'outgoing' | 'incoming' }
  | { type: 'placeholder'; message: string }

export class TableTreeProvider implements vscode.TreeDataProvider<TableDetailNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TableDetailNode | undefined | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  private currentSchema: Schema | null = null
  private rootElements: TableDetailNode[] = []

  setSchema(schema: Schema | null) {
    this.currentSchema = schema
    if (schema) {
      this.rootElements = [...schema.tables]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ type: 'table' as const, table: t, schema }))
    } else {
      this.rootElements = []
    }
    this.refresh()
  }

  getCurrentSchema(): Schema | null {
    return this.currentSchema
  }

  getTableNode(name: string): TableDetailNode | undefined {
    return this.rootElements.find((e) => e.type === 'table' && e.table.name === name)
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: TableDetailNode): vscode.TreeItem {
    switch (element.type) {
      case 'table': {
        const item = new vscode.TreeItem(
          element.table.name,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        item.iconPath = new vscode.ThemeIcon('table')
        item.description = `${element.table.columns.length} cols`
        item.contextValue = 'table'
        item.tooltip = new vscode.MarkdownString(
          `**Table:** \`${element.table.name}\`\n\n` +
          `- Columns: ${element.table.columns.length}\n` +
          `- Primary Keys: ${element.table.primaryKeys.length}\n` +
          `- Indexes: ${element.table.indexes.length}`
        )
        item.tooltip.isTrusted = true
        return item
      }
      case 'section': {
        const item = new vscode.TreeItem(
          element.label,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        const iconMap: Record<string, string> = {
          primaryKeys: 'key',
          columns: 'symbol-field',
          indexes: 'search',
          relations: 'git-compare',
        }
        item.iconPath = new vscode.ThemeIcon(iconMap[element.sectionType] || 'list-unordered')
        return item
      }
      case 'column': {
        const badges: string[] = []
        if (element.isPK) badges.push('PK')
        if (element.isFK) badges.push('FK')
        if (!element.column.nullable) badges.push('NOT NULL')
        if (element.column.defaultValue) badges.push('DEFAULT')

        const item = new vscode.TreeItem(
          element.column.name,
          vscode.TreeItemCollapsibleState.None
        )
        item.description = `${element.column.type}${badges.length ? ' | ' + badges.join(', ') : ''}`
        item.iconPath = new vscode.ThemeIcon('symbol-field')
        item.tooltip = new vscode.MarkdownString(
          `**Column:** \`${element.column.name}\`\n\n` +
          `- Type: \`${element.column.type}\`\n` +
          `- Nullable: ${element.column.nullable ? 'YES' : 'NO'}\n` +
          `- Default: ${element.column.defaultValue ?? 'none'}\n` +
          `${element.isPK ? '- **Primary Key**\n' : ''}` +
          `${element.isFK && element.fkTarget ? `- **Foreign Key** → \`${element.fkTarget}\`\n` : ''}`
        )
        item.tooltip.isTrusted = true
        return item
      }
      case 'index': {
        const item = new vscode.TreeItem(
          element.index.name,
          vscode.TreeItemCollapsibleState.None
        )
        item.description = `${element.index.unique ? 'UNIQUE | ' : ''}${element.index.columns.join(', ')}`
        item.iconPath = new vscode.ThemeIcon('search')
        item.tooltip = new vscode.MarkdownString(
          `**Index:** \`${element.index.name}\`\n\n` +
          `- Unique: ${element.index.unique ? 'YES' : 'NO'}\n` +
          `- Columns: ${element.index.columns.join(', ')}`
        )
        item.tooltip.isTrusted = true
        return item
      }
      case 'relation': {
        const rel = element.relation
        const label = element.direction === 'outgoing'
          ? `${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`
          : `${rel.fromTable}.${rel.fromColumn} → ${rel.toColumn}`
        const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None)
        item.iconPath = new vscode.ThemeIcon('arrow-swap')
        item.description = element.direction === 'outgoing' ? 'outgoing' : 'incoming'
        item.tooltip = new vscode.MarkdownString(
          `**Relation:** \`${rel.constraintName}\`\n\n` +
          `${element.direction === 'outgoing'
            ? `- \`${rel.fromTable}.${rel.fromColumn}\` → \`${rel.toTable}.${rel.toColumn}\``
            : `- \`${rel.fromTable}.${rel.fromColumn}\` → \`${rel.toTable}.${rel.toColumn}\``}`
        )
        item.tooltip.isTrusted = true
        return item
      }
      case 'placeholder': {
        const item = new vscode.TreeItem(element.message, vscode.TreeItemCollapsibleState.None)
        item.iconPath = new vscode.ThemeIcon('info')
        return item
      }
    }
  }

  getChildren(element?: TableDetailNode): TableDetailNode[] {
    if (!this.currentSchema) {
      return [{ type: 'placeholder', message: 'No schema loaded. Visualize a schema to see table details.' }]
    }

    if (!element) {
      // Root: return cached table nodes
      return this.rootElements
    }

    if (element.type === 'table') {
      const table = element.table
      const sections: TableDetailNode[] = []

      // Primary Keys section
      if (table.primaryKeys.length > 0) {
        sections.push({ type: 'section', label: `Primary Keys (${table.primaryKeys.length})`, table, sectionType: 'primaryKeys' })
      }

      // Columns section
      if (table.columns.length > 0) {
        sections.push({ type: 'section', label: `Columns (${table.columns.length})`, table, sectionType: 'columns' })
      }

      // Indexes section
      if (table.indexes.length > 0) {
        sections.push({ type: 'section', label: `Indexes (${table.indexes.length})`, table, sectionType: 'indexes' })
      }

      // Relations
      const outgoing = this.currentSchema.relations.filter((r) => r.fromTable === table.name)
      const incoming = this.currentSchema.relations.filter((r) => r.toTable === table.name)
      if (outgoing.length > 0 || incoming.length > 0) {
        sections.push({ type: 'section', label: `Relations (${outgoing.length + incoming.length})`, table, sectionType: 'relations' })
      }

      return sections
    }

    if (element.type === 'section') {
      const table = element.table
      switch (element.sectionType) {
        case 'primaryKeys':
          return table.primaryKeys.map((pk) => {
            const col = table.columns.find((c) => c.name === pk)
            return {
              type: 'column' as const,
              column: col ?? ({ name: pk, type: '?', nullable: false, defaultValue: null } as Column),
              table,
              isPK: true,
              isFK: false,
            }
          })
        case 'columns':
          return table.columns.map((col) => {
            const isPK = table.primaryKeys.includes(col.name)
            const fkRel = this.currentSchema!.relations.find(
              (r) => r.fromTable === table.name && r.fromColumn === col.name
            )
            return {
              type: 'column' as const,
              column: col,
              table,
              isPK,
              isFK: !!fkRel,
              fkTarget: fkRel ? `${fkRel.toTable}.${fkRel.toColumn}` : undefined,
            }
          })
        case 'indexes':
          return table.indexes.map((idx) => ({ type: 'index' as const, index: idx }))
        case 'relations': {
          const outgoing = this.currentSchema.relations
            .filter((r) => r.fromTable === table.name)
            .map((r) => ({ type: 'relation' as const, relation: r, direction: 'outgoing' as const }))
          const incoming = this.currentSchema.relations
            .filter((r) => r.toTable === table.name)
            .map((r) => ({ type: 'relation' as const, relation: r, direction: 'incoming' as const }))
          return [...outgoing, ...incoming]
        }
      }
    }

    return []
  }
}
