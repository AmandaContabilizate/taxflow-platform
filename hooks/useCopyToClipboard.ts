"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Copia texto al portapapeles y expone qué `key` se copió (para feedback tipo
 * "✓ copiado" por campo). Único helper de clipboard del repo — antes cada
 * pantalla repetía `navigator.clipboard.writeText` inline.
 */
export function useCopyToClipboard(resetMs = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    (value: string, key: string = value) => {
      void navigator.clipboard.writeText(value).then(() => {
        setCopiedKey(key);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), resetMs);
      });
    },
    [resetMs],
  );

  return { copy, copiedKey };
}
