'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'contavic-dock-pos'
const DRAG_THRESHOLD = 5
const EDGE_MARGIN = 20

interface Position {
  x: number
  y: number
}

interface StoredDock {
  side: 'left' | 'right'
  yRatio: number
}

/**
 * Calcula los límites seguros de arrastre considerando el ancho real
 * ocupado por el Sidebar (colapsado o expandido) para no ocultar el botón.
 */
function getSafeBounds(elemWidth: number, elemHeight: number) {
  if (typeof window === 'undefined') {
    return { minX: 20, maxX: 1000, minY: 70, maxY: 800 }
  }

  const mainElem = document.querySelector('main')
  const mainLeft = mainElem ? mainElem.getBoundingClientRect().left : 0

  const minX = Math.max(EDGE_MARGIN, mainLeft + EDGE_MARGIN)
  const maxX = Math.max(minX, window.innerWidth - elemWidth - EDGE_MARGIN)
  const minY = 70
  const maxY = Math.max(minY, window.innerHeight - elemHeight - EDGE_MARGIN)

  return { minX, maxX, minY, maxY, mainLeft }
}

/**
 * Hook para gestionar el arrastre fluido con acoplamiento magnético lateral,
 * preservando los clics nativos hacia enlaces externos.
 */
export function useDraggableSnap() {
  const [position, setPosition] = useState<Position | null>(null)
  const [side, setSide] = useState<'left' | 'right'>('right')
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)

  const dragStartRef = useRef<{
    pointerX: number
    pointerY: number
    initialX: number
    initialY: number
    pointerId: number
    captured: boolean
  } | null>(null)

  const currentPosRef = useRef<Position>({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement | null>(null)
  const lastDragEndRef = useRef<number>(0)

  const repositionToSide = useCallback(
    (targetSide: 'left' | 'right', yRatio?: number) => {
      if (typeof window === 'undefined') return
      const elemW = elementRef.current?.offsetWidth ?? 210
      const elemH = elementRef.current?.offsetHeight ?? 44
      const bounds = getSafeBounds(elemW, elemH)

      const x = targetSide === 'left' ? bounds.minX : bounds.maxX
      const currentY = currentPosRef.current.y
      const y =
        yRatio !== undefined
          ? Math.max(
              bounds.minY,
              Math.min(bounds.maxY, yRatio * window.innerHeight)
            )
          : Math.max(
              bounds.minY,
              Math.min(bounds.maxY, currentY || window.innerHeight - 75)
            )

      const newPos = { x, y }
      currentPosRef.current = newPos
      setPosition(newPos)
      setSide(targetSide)
    },
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadSaved = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed: StoredDock = JSON.parse(raw)
          repositionToSide(parsed.side, parsed.yRatio)
          return
        }
      } catch {
        // Fallback
      }
      repositionToSide('right', 0.88)
    }

    const timer = setTimeout(loadSaved, 60)

    const handleResize = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const currentSide = raw ? (JSON.parse(raw) as StoredDock).side : side
        repositionToSide(currentSide)
      } catch {
        repositionToSide(side)
      }
    }

    window.addEventListener('resize', handleResize)

    const observer = new ResizeObserver(() => {
      if (!dragStartRef.current) {
        handleResize()
      }
    })
    const mainElem = document.querySelector('main')
    if (mainElem) observer.observe(mainElem)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [repositionToSide, side])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialX: currentPosRef.current.x,
      initialY: currentPosRef.current.y,
      pointerId: e.pointerId,
      captured: false,
    }
    setHasMoved(false)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStartRef.current) return

      const deltaX = e.clientX - dragStartRef.current.pointerX
      const deltaY = e.clientY - dragStartRef.current.pointerY
      const distance = Math.hypot(deltaX, deltaY)

      if (distance > DRAG_THRESHOLD) {
        // Capturar puntero solo cuando realmente se arrastra
        if (!dragStartRef.current.captured) {
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragStartRef.current.captured = true
          } catch {
            // Ignorar
          }
        }

        if (!isDragging) setIsDragging(true)
        setHasMoved(true)

        const elemW = elementRef.current?.offsetWidth ?? 210
        const elemH = elementRef.current?.offsetHeight ?? 44
        const bounds = getSafeBounds(elemW, elemH)

        const rawX = dragStartRef.current.initialX + deltaX
        const rawY = dragStartRef.current.initialY + deltaY

        const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, rawX))
        const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, rawY))

        const newPos = { x: clampedX, y: clampedY }
        currentPosRef.current = newPos
        setPosition(newPos)
      }
    },
    [isDragging]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStartRef.current) return

      if (dragStartRef.current.captured) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          // Ignorar
        }
      }

      if (isDragging) {
        lastDragEndRef.current = Date.now()
        const elemW = elementRef.current?.offsetWidth ?? 210
        const elemH = elementRef.current?.offsetHeight ?? 44
        const bounds = getSafeBounds(elemW, elemH)

        const currentX = currentPosRef.current.x
        const currentY = currentPosRef.current.y

        const contentMidX = (bounds.minX + bounds.maxX) / 2
        const newSide: 'left' | 'right' =
          currentX < contentMidX ? 'left' : 'right'
        const targetX = newSide === 'left' ? bounds.minX : bounds.maxX

        const finalPos = { x: targetX, y: currentY }
        currentPosRef.current = finalPos
        setPosition(finalPos)
        setSide(newSide)
        setIsDragging(false)

        try {
          const payload: StoredDock = {
            side: newSide,
            yRatio: Math.max(0.1, Math.min(0.9, currentY / window.innerHeight)),
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        } catch {
          // Ignorar
        }
      }

      dragStartRef.current = null
    },
    [isDragging]
  )

  return {
    position,
    side,
    isDragging,
    hasMoved,
    lastDragEndRef,
    elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
