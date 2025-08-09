import { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";
import PulsoidSocket from '@pulsoid/socket';

export class ChatboxPulsoidModule extends ChatboxModule {
  socket: PulsoidSocket | null = null;
  heartRates: number[] = [0];
  lastToken: string | null = null;
  constructor(public modules: Modules) {
    super(modules, "pulsoid", "Pulsoid", {
      is_premium: true,
      description: "Pulsoid module, used to display heart rate and other health metrics.",
      inputs: [
        {
          type: "Text",
          id: "auth_token",
          name: "Auth Token",
          description: "Your Pulsoid auth token. You can find it in your Pulsoid account settings.",
          default_value: "",
          secret: true
        }
      ],
      example_placeholders: [
        {
          placeholder: "heart_rate",
          description: "Heart Rate",
        },
        {
          placeholder: "heart_rate_lowest",
          description: "Lowest Heart Rate",
        },
        {
          placeholder: "heart_rate_highest",
          description: "Highest Heart Rate",
        },
        {
          placeholder: "heart_rate_average",
          description: "Average Heart Rate",
        },
        {
          placeholder: "is_connected",
          description: "Is Connected to Pulsoid Socket",
        },
        {
          placeholder: "is_online",
          description: "Is Online on Pulsoid Socket",
        }
      ]
    });
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.modules.chatbox.api.logger.debug("Pulsoid", "Disconnected from Pulsoid socket.");
      this.socket = null;
      this.heartRates = [];
      this.lastToken = null;
    }
  }

  updateSocket() {
    const authToken = this.getInputValue("auth_token");
    if (!authToken) {
      this.disconnectSocket();
      return;
    }

    if (this.socket) this.disconnectSocket();
    this.socket = new PulsoidSocket(authToken);

    this.socket.on("online", () => {
      this.modules.chatbox.api.logger.debug("Pulsoid", "Connected to Pulsoid socket.");
    });

    this.socket.on("offline", () => {
      this.modules.chatbox.api.logger.debug("Pulsoid", "Disconnected from Pulsoid socket.");
    });

    this.socket.on("heart-rate", (d) => {
      this.heartRates.push(d.heartRate);
      if (this.heartRates.length > 100) {
        this.heartRates.shift(); // Keep the last 100 heart rates
      }
    });

    this.socket.connect();
  }

  async destroy(): Promise<void> {
    this.disconnectSocket();
  }

  async getPlaceholder(key: string): Promise<string> {
    const authToken = this.getInputValue("auth_token");
    if (this.lastToken !== authToken) {
      this.lastToken = authToken;
      this.updateSocket();
    }

    switch (key) {
      case "heart_rate":
        if (!authToken) return "0";
        return this.heartRates.length > 0 ? this.heartRates[this.heartRates.length - 1].toString() : "0";
      case "heart_rate_lowest":
        if (!authToken) return "0";
        return this.heartRates.length > 0 ? Math.min(...this.heartRates).toString() : "0";
      case "heart_rate_highest":
        if (!authToken) return "0";
        return this.heartRates.length > 0 ? Math.max(...this.heartRates).toString() : "0";
      case "heart_rate_average":
        if (!authToken) return "0";
        return this.heartRates.length > 0 ? (this.heartRates.reduce((a, b) => a + b, 0) / this.heartRates.length).toFixed(2) : "0";
      case "is_connected":
        if (!authToken) return "false";
        return this.socket && this.socket.isConnected() ? "true" : "false";
      case "is_online":
        if (!authToken) return "false";
        return this.socket && this.socket.isOnline() ? "true" : "false";
    }

    return "";
  }
}