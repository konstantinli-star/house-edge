"use client";

import { useEffect, useState } from "react";
import { loadSubscription, saveSubscription } from "@/lib/pricing";

// Starts the test-mode subscription checkout and confirms it on return.
export function SubscribeButton() {
  const [status, setStatus] = useState<"idle" | "busy" | "active" | "confirming">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (sessionId) {
      setStatus("confirming");
      fetch(`/api/checkout/subscription/confirm?session_id=${encodeURIComponent(sessionId)}`)
        .then(async (r) => {
          if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error);
          saveSubscription();
          setStatus("active");
          window.history.replaceState(null, "", "/pricing");
        })
        .catch((e: Error) => {
          setError(e.message || "Could not confirm the subscription.");
          setStatus("idle");
        });
    } else if (loadSubscription()) {
      setStatus("active");
    }
  }, []);

  async function subscribe() {
    setStatus("busy");
    setError("");
    try {
      const res = await fetch("/api/checkout/subscription", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout is unavailable right now.");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout is unavailable right now.");
      setStatus("idle");
    }
  }

  if (status === "active") {
    return (
      <p role="status" className="rounded-md border border-accent/40 px-4 py-3 text-sm text-accent">
        Subscribed in test mode. No real money moved.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={subscribe}
        disabled={status !== "idle"}
        className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90 disabled:opacity-60"
      >
        {status === "confirming" ? "Confirming…" : status === "busy" ? "Opening test checkout…" : "Subscribe in test mode"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      )}
    </div>
  );
}
