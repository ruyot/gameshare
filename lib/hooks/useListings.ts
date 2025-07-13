import { useState, useEffect, useCallback } from 'react'

export function useListings({ status = 'active', gameId, page = 0, limit = 20 }: {
  status?: string
  gameId?: string
  page?: number
  limit?: number
}) {
  const [listings, setListings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadFlag, setReloadFlag] = useState(0)

  const reload = useCallback(() => setReloadFlag(f => f + 1), [])

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (gameId) params.set('gameId', gameId)
    if (page !== undefined) params.set('page', String(page))
    if (limit !== undefined) params.set('limit', String(limit))
    fetch(`/api/listings?${params.toString()}`)
      .then(r => r.json())
      .then(res => {
        setListings(res.data || [])
        setIsLoading(false)
      })
      .catch(e => {
        setError(e.message || 'Failed to fetch listings')
        setIsLoading(false)
      })
  }, [status, gameId, page, limit, reloadFlag])

  return { listings, isLoading, error, reload }
} 