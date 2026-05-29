export type Column = {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
}

export type Index = {
  name: string
  columns: string[]
  unique: boolean
}

export type Table = {
  name: string
  columns: Column[]
  primaryKeys: string[]
  indexes: Index[]
}

export type Relation = {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  constraintName: string
}

export type Schema = {
  name: string
  tables: Table[]
  relations: Relation[]
}
