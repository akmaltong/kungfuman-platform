"use client";

import { useEffect } from "react";

// Регистрирует service worker для PWA (установка на домашний экран, офлайн-шелл).
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // офлайн-режим необязателен — молча игнорируем
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
