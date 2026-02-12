"use client";

import { useEffect } from "react";

const KEY = "illa_keepalive_last";
const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export default function KeepAlivePing() {
    useEffect(() => {
        try {
            const last = Number(localStorage.getItem(KEY) || "0");
            const now = Date.now();
            if (now - last < COOLDOWN_MS) return;

            localStorage.setItem(KEY, String(now));
            fetch("/api/ping").catch(() => { });
        } catch {
            fetch("/api/ping").catch(() => { });
        }
    }, []);

    return null;
}
