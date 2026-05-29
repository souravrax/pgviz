import { useState, useEffect } from 'react'
import SchemaGraph from './components/SchemaGraph'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createClient, type Schema } from 'api'

const client = createClient()

export default function App() {
  const [schema, setSchema] = useState<Schema | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
    client.getSchema().then((data) => {
      console.log('[pglens webview] schema tables:', data.tables?.length)
      setSchema(data)
    })
  }, [])

  if (!schema) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        {isReady ? 'Waiting for schema data...' : 'Loading...'}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <SchemaGraph schema={schema} />
    </TooltipProvider>
  )
}
