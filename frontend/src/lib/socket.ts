import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      // Retrieve the token from Zustand's persisted store
      let token = '';
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          token = parsed.state?.token || '';
        }
      } catch (err) {}

      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        auth: { token }
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
      });
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = new SocketClient();
