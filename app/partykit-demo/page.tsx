"use client";

import { useState } from "react";
import usePartySocket from "partysocket/react";

/**
 * Shared Counter Demo Page
 *
 * Demonstrates:
 * 1. Connecting to a specific party ("counter").
 * 2. Receiving initial state from the server on connect ("sync").
 * 3. Sending JSON actions ("INCREMENT", "DECREMENT") to the server.
 * 4. Reacting to real-time broadcasts ("update") from the server.
 */
export default function CounterDemo() {
    const [count, setCount] = useState<number>(0);

    // Connect to the "counter" party defined in partykit.json
    const socket = usePartySocket({
        host: process.env.NEXT_PUBLIC_PARTYKIT_HOST, // Crucial for local dev to point to 1999
        party: "counter", // Points to 'counter' in partykit.json
        room: "demo-room", // Unique room name for state isolation
        onMessage(event) {
            const data = JSON.parse(event.data);
            console.log("Received:", data);

            if (data.type === "sync" || data.type === "update") {
                setCount(data.count);
            }
        },
    });

    const increment = () => {
        socket.send(JSON.stringify({ type: "INCREMENT" }));
    };

    const decrement = () => {
        socket.send(JSON.stringify({ type: "DECREMENT" }));
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-950 text-white font-sans">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-10 shadow-2xl text-center">
                <h1 className="text-3xl font-bold mb-2 text-white">PartyKit Shared Counter</h1>
                <p className="text-zinc-500 mb-8 text-sm">
                    Open this page in multiple tabs to see real-time state synchronization!
                </p>

                <div className="mb-10 relative">
                    <div className="text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        {count}
                    </div>
                    <div className="absolute -top-4 -right-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 animate-pulse">
                        LIVE
                    </div>
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={decrement}
                        className="h-16 w-16 text-2xl font-bold rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-white/20"
                    >
                        -
                    </button>
                    <button
                        onClick={increment}
                        className="flex-1 h-16 text-xl font-bold rounded-xl bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all outline-none"
                    >
                        Increment Shared Count
                    </button>
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-800 text-left">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-3">What's happening?</h3>
                    <ul className="space-y-2 text-xs text-zinc-400">
                        <li className="flex gap-2">
                            <span className="text-green-500">✔</span>
                            State is stored on the <strong>PartyKit Server</strong>, not your browser.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✔</span>
                            Messages are sent as <strong>JSON actions</strong>.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✔</span>
                            New players <strong>sync automatically</strong> on connect.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
