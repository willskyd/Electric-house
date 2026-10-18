'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrototypeBranch, PrototypeTransfer, StoreReceivingRecord } from './types'
import { STORE_TRANSFERS_STORAGE_KEY } from '@/lib/store-transfers-prototype'

type StoreTransferState = { receivingRecords: StoreReceivingRecord[]; branches: PrototypeBranch[]; transfers: PrototypeTransfer[] }
const EMPTY: StoreTransferState = { receivingRecords: [], branches: [], transfers: [] }

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'message' in result && typeof result.message === 'string' ? result.message : fallback
    throw new Error(message)
  }
  return result as T
}

export function useStoreTransfersPrototype() {
  const [state, setState] = useState<StoreTransferState>(EMPTY)
  const [hydrated, setHydrated] = useState(false)
  const [persistenceError, setPersistenceError] = useState('')
  const editRequestKeys = useRef(new Map<string, string>())

  const getEditRequestKey = useCallback((signature: string) => {
    const known = editRequestKeys.current.get(signature)
    if (known) return known
    const key = crypto.randomUUID()
    editRequestKeys.current.set(signature, key)
    return key
  }, [])

  const reload = useCallback(async () => {
    const [receiptsResponse, branchesResponse, transfersResponse] = await Promise.all([
      fetch('/api/store', { cache: 'no-store' }),
      fetch('/api/branches', { cache: 'no-store' }),
      fetch('/api/transfers', { cache: 'no-store' }),
    ])
    const [receivingRecords, branches, transfers] = await Promise.all([
      readJson<StoreReceivingRecord[]>(receiptsResponse, 'Store records are unavailable'),
      readJson<PrototypeBranch[]>(branchesResponse, 'Branches are unavailable'),
      readJson<PrototypeTransfer[]>(transfersResponse, 'Transfer history is unavailable'),
    ])
    if (!Array.isArray(receivingRecords) || !Array.isArray(branches) || !Array.isArray(transfers)) throw new Error('The server returned invalid Store or Transfer records')
    setState({ receivingRecords, branches, transfers })
  }, [])

  useEffect(() => {
    let cancelled = false
    try {
      const raw = window.localStorage.getItem(STORE_TRANSFERS_STORAGE_KEY)
      if (raw) {
        const legacy: unknown = JSON.parse(raw)
        if (typeof legacy === 'object' && legacy !== null) {
          const old = legacy as Record<string, unknown>
          const count = (Array.isArray(old.receivingRecords) ? old.receivingRecords.length : 0) + (Array.isArray(old.transfers) ? old.transfers.length : 0)
          if (count) setPersistenceError(`${count} earlier browser-only Store/Transfer record(s) remain in this browser. They were not imported because their stock effects were never verified.`)
        }
      }
    } catch {
      setPersistenceError('Earlier browser-only Store/Transfer data could not be read. Server records are loaded separately.')
    }
    void reload().catch((error: unknown) => {
      if (!cancelled) setPersistenceError(error instanceof Error ? error.message : 'Store and Transfer records could not be loaded')
    }).finally(() => { if (!cancelled) setHydrated(true) })
    return () => { cancelled = true }
  }, [reload])

  const addReceivingRecord = useCallback(async (record: StoreReceivingRecord) => {
    const response = await fetch('/api/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...record, idempotencyKey: record.id }) })
    const saved = await readJson<StoreReceivingRecord>(response, 'Store receipt could not be saved')
    setState((current) => ({ ...current, receivingRecords: [saved, ...current.receivingRecords.filter((item) => item.id !== saved.id)] }))
    return saved
  }, [])

  const updateReceivingRecord = useCallback(async (id: string, record: StoreReceivingRecord, expectedRevision: number) => {
    const signature = JSON.stringify({ id, expectedRevision, record })
    const response = await fetch(`/api/store/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...record, expectedRevision, idempotencyKey: getEditRequestKey(signature) }) })
    const saved = await readJson<StoreReceivingRecord>(response, 'Store receipt could not be updated')
    setState((current) => ({ ...current, receivingRecords: current.receivingRecords.map((item) => item.id === saved.id ? saved : item) }))
    return saved
  }, [getEditRequestKey])

  const addTransfer = useCallback(async (transfer: PrototypeTransfer) => {
    const response = await fetch('/api/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...transfer, idempotencyKey: transfer.id }) })
    const saved = await readJson<PrototypeTransfer>(response, 'Transfer could not be saved')
    setState((current) => ({ ...current, transfers: [saved, ...current.transfers.filter((item) => item.id !== saved.id)] }))
    return saved
  }, [])

  const updateTransfer = useCallback(async (id: string, transfer: PrototypeTransfer, expectedRevision: number) => {
    const signature = JSON.stringify({ id, expectedRevision, transfer })
    const response = await fetch(`/api/transfers/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...transfer, expectedRevision, idempotencyKey: getEditRequestKey(signature) }) })
    const saved = await readJson<PrototypeTransfer>(response, 'Transfer could not be updated')
    setState((current) => ({ ...current, transfers: current.transfers.map((item) => item.id === saved.id ? saved : item) }))
    return saved
  }, [getEditRequestKey])

  const addBranch = useCallback(async (name: string): Promise<string | null> => {
    const id = crypto.randomUUID()
    const response = await fetch('/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name }) })
    try {
      const branch = await readJson<PrototypeBranch>(response, 'Branch could not be saved')
      setState((current) => ({ ...current, branches: [...current.branches.filter((item) => item.id !== branch.id), branch] }))
      return null
    } catch (error) { return error instanceof Error ? error.message : 'Branch could not be saved' }
  }, [])

  const renameBranch = useCallback(async (id: string, name: string): Promise<string | null> => {
    const response = await fetch(`/api/branches/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    try {
      const branch = await readJson<PrototypeBranch>(response, 'Branch could not be renamed')
      setState((current) => ({ ...current, branches: current.branches.map((item) => item.id === branch.id ? branch : item) }))
      return null
    } catch (error) { return error instanceof Error ? error.message : 'Branch could not be renamed' }
  }, [])

  return {
    receivingRecords: state.receivingRecords,
    branches: state.branches,
    transfers: state.transfers,
    persistenceError,
    hydrated,
    addReceivingRecord,
    updateReceivingRecord,
    addTransfer,
    updateTransfer,
    addBranch,
    renameBranch,
    reload,
  }
}
