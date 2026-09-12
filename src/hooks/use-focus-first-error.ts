"use client";

import { useEffect, useRef } from "react";

export function useFocusFirstError(signal: unknown) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!signal) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [signal]);

  return formRef;
}
