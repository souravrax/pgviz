import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSchema,
  listSchemas,
  queryTable,
  executeSql,
  explainSql,
  getMetadata,
  listExtensions,
  installExtension,
  dropExtension,
  getDatabases,
  addDatabase,
  removeDatabase,
  activateLicense,
  getLicense,
  deactivateLicense,
} from '@/lib/tauri-api'
import type { QueryResult, ExecuteResult, ExplainPlan, Metadata, ExtensionsResult } from '@/lib/tauri-api'

// ── Schema ──────────────────────────────────────────────────────────────────

export function useSchema(url: string | undefined, schema: string) {
  return useQuery({
    queryKey: ['schema', url, schema],
    queryFn: () => getSchema(url!, schema),
    enabled: !!url,
  })
}

export function useSchemas(url: string | undefined) {
  return useQuery({
    queryKey: ['schemas', url],
    queryFn: () => listSchemas(url!),
    enabled: !!url,
  })
}

// ── Table Data ──────────────────────────────────────────────────────────────

export function useTableData(
  url: string | undefined,
  table: string,
  schema: string,
  page: number,
  pageSize: number,
  sort?: { column: string; direction: 'asc' | 'desc' }[],
  filters?: Record<string, unknown>,
) {
  const sortStr = sort ? JSON.stringify(sort) : undefined
  const filtersStr = filters ? JSON.stringify(filters) : undefined
  return useQuery<QueryResult>({
    queryKey: ['table', url, schema, table, page, pageSize, sortStr, filtersStr],
    queryFn: () => queryTable(url!, table, schema, page, pageSize, sortStr, filtersStr),
    enabled: !!url && !!table,
  })
}

// ── SQL ─────────────────────────────────────────────────────────────────────

export function useExecuteSql() {
  const queryClient = useQueryClient()
  return useMutation<ExecuteResult, Error, { url: string; sql: string }>({
    mutationFn: ({ url, sql }) => executeSql(url, sql),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table'] })
    },
  })
}

export function useExplainSql() {
  return useMutation<ExplainPlan, Error, { url: string; sql: string; analyze: boolean; buffers: boolean }>({
    mutationFn: ({ url, sql, analyze, buffers }) => explainSql(url, sql, analyze, buffers),
  })
}

// ── Metadata ────────────────────────────────────────────────────────────────

export function useMetadata(url: string | undefined, schema: string) {
  return useQuery<Metadata>({
    queryKey: ['metadata', url, schema],
    queryFn: () => getMetadata(url!, schema),
    enabled: !!url,
  })
}

// ── Extensions ──────────────────────────────────────────────────────────────

export function useExtensions(url: string | undefined) {
  return useQuery<ExtensionsResult>({
    queryKey: ['extensions', url],
    queryFn: () => listExtensions(url!),
    enabled: !!url,
  })
}

export function useInstallExtension() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { url: string; name: string; schema?: string; version?: string }>({
    mutationFn: ({ url, name, schema, version }) => installExtension(url, name, schema, version),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['extensions', vars.url] })
    },
  })
}

export function useDropExtension() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { url: string; name: string }>({
    mutationFn: ({ url, name }) => dropExtension(url, name),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['extensions', vars.url] })
    },
  })
}

// ── Databases ───────────────────────────────────────────────────────────────

export function useDatabases() {
  return useQuery({
    queryKey: ['databases'],
    queryFn: getDatabases,
  })
}

export function useAddDatabase() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; name: string; url: string; createdAt: number }>({
    mutationFn: ({ id, name, url, createdAt }) => addDatabase(id, name, url, createdAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}

export function useRemoveDatabase() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => removeDatabase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}

// ── License ─────────────────────────────────────────────────────────────────

export function useLicense() {
  return useQuery({
    queryKey: ['license'],
    queryFn: getLicense,
  })
}

export function useActivateLicense() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { key: string; productId: string }>({
    mutationFn: ({ key, productId }) => activateLicense(key, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license'] })
    },
  })
}

export function useDeactivateLicense() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: deactivateLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license'] })
    },
  })
}
