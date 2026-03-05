import type * as Party from "partykit/server";

export default class CounterServer implements Party.Server {
    // Shared state: This lives in memory on the PartyKit server.
    // It persists as long as the room is active.
    count: number = 0;

    constructor(readonly room: Party.Room) { }

    /**
     * Called when a new client connects.
     * Useful for sending the "initial state" so they aren't starting at zero
     * while everyone else is at a different number.
     */
    async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
        console.log(`Connected: ${connection.id} in room ${this.room.id}`);

        // Send the current count ONLY to the person who just joined
        connection.send(JSON.stringify({ type: "sync", count: this.count }));
    }

    /**
     * Called when any client sends a message.
     */
    async onMessage(message: string, sender: Party.Connection) {
        console.log(`Message from ${sender.id}: ${message}`);

        const data = JSON.parse(message) as { type: "INCREMENT" | "DECREMENT" };

        if (data.type === "INCREMENT") {
            this.count++;
        } else if (data.type === "DECREMENT") {
            this.count--;
        }

        // BROADCAST the new count to EVERYONE connected to this room.
        // This is the "Real-time" magic.
        this.room.broadcast(JSON.stringify({ type: "update", count: this.count }));
    }
}
