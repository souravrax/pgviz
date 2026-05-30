import {
  DiamondIcon,
  FingerprintPatternIcon,
  HashIcon,
  KeyIcon,
  LinkIcon,
  ZapIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ColumnTypeDef {
  id: string
  label: string
  icon: LucideIcon
}

export const columnTypeDefinitions: ColumnTypeDef[] = [
  { id: 'pk', label: 'Primary Key', icon: KeyIcon },
  { id: 'fk', label: 'Foreign Key', icon: LinkIcon },
  { id: 'identity', label: 'Identity', icon: HashIcon },
  { id: 'unique', label: 'Unique', icon: FingerprintPatternIcon },
  { id: 'indexed', label: 'Indexed', icon: ZapIcon },
  { id: 'nullable', label: 'Nullable', icon: DiamondIcon },
  { id: 'nonNullable', label: 'Non-Nullable', icon: DiamondIcon },
]

export const PkIcon = KeyIcon
export const FkIcon = LinkIcon
export const IdentityIcon = HashIcon
export const UniqueIcon = FingerprintPatternIcon
export const IndexedIcon = ZapIcon
export const NullableIcon = DiamondIcon
