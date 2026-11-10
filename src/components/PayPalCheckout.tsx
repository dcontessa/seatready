import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Quote } from "../types";
type PayPalSDK = {
  createInstance: (options: unknown) => Promise<{
    findEligibleMethods: () => Promise<{
      isEligible: (name: string) => boolean;
    }>;
    createPayPalOneTimePaymentSession: (callbacks: unknown) => Promise<{
      start: (
        options: unknown,
        order: Promise<{ orderId: string }>,
      ) => Promise<void>;
    }>;
  }>;
};
declare global {
  interface Window {
    paypal?: PayPalSDK;
  }
}
let sdkPromise: Promise<PayPalSDK> | null = null;
function loadSdk() {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.sandbox.paypal.com/web-sdk/v6/core";
    script.async = true;
    script.onload = () =>
      window.paypal
        ? resolve(window.paypal)
        : reject(new Error("PayPal could not load."));
    script.onerror = () => {
      script.remove();
      sdkPromise = null;
      reject(new Error("PayPal could not load. Please check your connection."));
    };
    document.head.append(script);
  });
  return sdkPromise;
}
export function PayPalCheckout({
  quote,
  clientId,
  onPaid,
}: {
  quote: Quote;
  clientId: string;
  onPaid: (q: Quote) => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Loading PayPal sandbox…");
  const [retry, setRetry] = useState(false);
  const [ready, setReady] = useState(false);
  const startCheckout = useRef<((mode: "auto" | "modal") => void) | null>(null);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;
  async function confirm() {
    try {
      setError("");
      setMessage("Checking PayPal’s payment confirmation…");
      const q = await api<Quote>(`/quotes/${quote.id}/capture`, {});
      setRetry(false);
      setMessage("Sandbox payment confirmed.");
      onPaidRef.current(q);
    } catch (e) {
      setMessage("");
      setError((e as Error).message);
      setRetry(true);
    }
  }
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const element = mount.current;
    let button: HTMLElement | null = null;
    (async () => {
      try {
        const sdk = await loadSdk();
        const instance = await sdk.createInstance({
          clientId,
          components: ["paypal-payments"],
        });
        const eligibility = await instance.findEligibleMethods();
        if (cancelled) return;
        if (!eligibility.isEligible("paypal"))
          throw new Error(
            "PayPal sandbox checkout is unavailable in this browser.",
          );
        const session = await instance.createPayPalOneTimePaymentSession({
          onApprove: async () => {
            if (!cancelled) await confirm();
          },
          onCancel: () => {
            if (!cancelled) {
              setMessage("Checkout cancelled. No booking was confirmed.");
              setError("");
            }
          },
          onError: () => {
            if (!cancelled) {
              setError("PayPal could not complete checkout. Please try again.");
              setMessage("");
            }
          },
        });
        if (cancelled) return;
        button = document.createElement("paypal-button");
        const start = (presentationMode: "auto" | "modal") => {
          setError("");
          const order = api<{ id: string }>(
            `/quotes/${quote.id}/order`,
            {},
          ).then((r) => ({ orderId: r.id }));
          session.start({ presentationMode }, order).catch((e) => {
            if (!cancelled)
              setError((e as Error).message || "Checkout could not start.");
          });
        };
        startCheckout.current = start;
        button.addEventListener("click", () => start("auto"));
        element?.append(button);
        setReady(true);
        setMessage(
          "Use a PayPal sandbox buyer account. No real money is charged.",
        );
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setMessage("");
        }
      }
    })();
    return () => {
      cancelled = true;
      startCheckout.current = null;
      button?.remove();
    };
  }, [quote.id, clientId]);
  return (
    <div>
      <div ref={mount} className="paypal-mount" />
      <p className="fine-print" role="status">
        {message}
      </p>
      {ready && (
        <button
          className="text-button"
          onClick={() => startCheckout.current?.("modal")}
        >
          PayPal window didn’t open? Use checkout on this page
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {retry && (
        <button className="secondary" onClick={() => void confirm()}>
          Check payment status again
        </button>
      )}
    </div>
  );
}
