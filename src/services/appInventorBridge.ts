import { AppInventorBridgeLog } from '../types';

declare global {
  interface Window {
    AppInventor?: {
      setWebViewString: (value: string) => void;
      getWebViewString?: () => string;
    };
    sendToAppInventor?: (action: string, payload: any) => void;
    receiveFromAppInventor?: (message: string) => void;
  }
}

class AppInventorBridgeService {
  private logs: AppInventorBridgeLog[] = [];
  private listeners: ((log: AppInventorBridgeLog) => void)[] = [];
  private commandHandlers: ((action: string, data: any) => void)[] = [];
  private lastPolledString: string = '';
  private pollingInterval: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Expose helpers globally so App Inventor can call them via RunJavaScript block if preferred
    if (typeof window !== 'undefined') {
      window.sendToAppInventor = (action: string, payload: any) => {
        this.send(action, payload);
      };

      window.receiveFromAppInventor = (message: string) => {
        this.processIncoming(message);
      };

      // Start polling for WebViewer.WebViewString changes from App Inventor
      this.startPolling();
    }
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.AppInventor && typeof window.AppInventor.setWebViewString === 'function');
  }

  public getStatusText(): { available: boolean; description: string } {
    if (this.isAvailable()) {
      return {
        available: true,
        description: 'Connesso ad App Inventor (window.AppInventor attivo)'
      };
    }
    return {
      available: false,
      description: 'Modalità Browser / Simulatore (App Inventor pronto al caricamento)'
    };
  }

  public send(action: string, data: any): void {
    const payloadObject = {
      action,
      data,
      timestamp: new Date().toISOString(),
      sender: 'PromoManager_WebView'
    };
    const jsonString = JSON.stringify(payloadObject);

    // Call window.AppInventor if available
    try {
      if (this.isAvailable() && window.AppInventor) {
        window.AppInventor.setWebViewString(jsonString);
      }
    } catch (e) {
      console.warn('[AppInventorBridge] Error calling setWebViewString:', e);
    }

    // Record log
    const logEntry: AppInventorBridgeLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      direction: 'sent',
      action,
      payload: jsonString
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs.pop();
    this.notifyLogListeners(logEntry);
  }

  public processIncoming(rawMessage: string): void {
    if (!rawMessage || rawMessage.trim() === '') return;

    let action = 'UNKNOWN';
    let data: any = rawMessage;

    try {
      const parsed = JSON.parse(rawMessage);
      if (parsed.action) {
        action = parsed.action;
        data = parsed.data !== undefined ? parsed.data : parsed;
      }
    } catch {
      // Raw string format: "ACTION:value"
      if (rawMessage.includes(':')) {
        const parts = rawMessage.split(':');
        action = parts[0].trim();
        data = parts.slice(1).join(':').trim();
      }
    }

    const logEntry: AppInventorBridgeLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      direction: 'received',
      action,
      payload: rawMessage
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs.pop();
    this.notifyLogListeners(logEntry);

    // Trigger registered command handlers
    this.commandHandlers.forEach(handler => {
      try {
        handler(action, data);
      } catch (err) {
        console.error('[AppInventorBridge] Handler error:', err);
      }
    });
  }

  private startPolling() {
    if (typeof window === 'undefined') return;

    // Check if App Inventor updated the WebViewString from the App side
    this.pollingInterval = window.setInterval(() => {
      try {
        if (window.AppInventor && typeof window.AppInventor.getWebViewString === 'function') {
          const current = window.AppInventor.getWebViewString();
          if (current && current !== this.lastPolledString) {
            this.lastPolledString = current;
            this.processIncoming(current);
          }
        }
      } catch {
        // ignore polling error
      }
    }, 600);
  }

  public onCommand(handler: (action: string, data: any) => void): () => void {
    this.commandHandlers.push(handler);
    return () => {
      this.commandHandlers = this.commandHandlers.filter(h => h !== handler);
    };
  }

  public onLog(listener: (log: AppInventorBridgeLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyLogListeners(log: AppInventorBridgeLog) {
    this.listeners.forEach(l => l(log));
  }

  public getLogs(): AppInventorBridgeLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

export const appInventorBridge = new AppInventorBridgeService();
