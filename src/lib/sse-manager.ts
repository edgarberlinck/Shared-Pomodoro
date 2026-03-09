// Global SSE connection manager
type SSEConnection = {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
};

class SSEManager {
  private connections = new Map<string, Set<SSEConnection>>();

  addConnection(sessionId: string, controller: ReadableStreamDefaultController, encoder: TextEncoder) {
    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }
    this.connections.get(sessionId)!.add({ controller, encoder });
  }

  removeConnection(sessionId: string, controller: ReadableStreamDefaultController) {
    const connections = this.connections.get(sessionId);
    if (connections) {
      connections.forEach((conn) => {
        if (conn.controller === controller) {
          connections.delete(conn);
        }
      });
      if (connections.size === 0) {
        this.connections.delete(sessionId);
      }
    }
  }

  broadcast(sessionId: string, data: any) {
    const connections = this.connections.get(sessionId);
    console.log(`SSEManager: Broadcasting to session ${sessionId}, ${connections?.size || 0} connections`);
    
    if (!connections || connections.size === 0) return;

    connections.forEach(({ controller, encoder }) => {
      try {
        console.log(`Sending data to connection:`, data);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      } catch (error) {
        // Connection closed, will be cleaned up
        console.error("Error broadcasting to client:", error);
      }
    });
  }

  getConnectionCount(sessionId: string): number {
    return this.connections.get(sessionId)?.size || 0;
  }
}

// Singleton instance
export const sseManager = new SSEManager();
