import type { VRChat } from ".";

export class Pipeline {
  websocket: WebSocket | null = null;
  closed = false;
  constructor(public vrchat: VRChat) { }

  async connect(force = false) {
    if (this.closed && !force) return;
    this.closed = false;

    if (this.websocket) return;
    if (!(await this.vrchat.auth.isLoggedIn())) return;

    const account = (await this.vrchat.api.config.vrchatAccounts.getSelectedAccount())!;
    this.websocket = new WebSocket(`${this.vrchat.api.constants.VRChatPipelineUrl}?authToken=${account.auth_cookie?.value}`);

    this.websocket.onopen = () => {
      this.vrchat.api.logger.info("VRChat", "WebSocket connected");
    };

    this.websocket.onclose = () => {
      this.websocket = null;
      this.vrchat.api.logger.info("VRChat", "WebSocket disconnected");
      setTimeout(() => {
        if (!this.closed) {
          this.vrchat.api.logger.info("VRChat", "Reconnecting WebSocket...");
          this.connect(true);
        }
      }, 5000);
    };

    this.websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.vrchat.api.events.emit("VRChatPipelineMessage", { message });
        if (message.content) {
          try {
            const content = JSON.parse(message.content);
            this.vrchat.api.events.emit("VRChatPipelineMessageContent", { type: message.type, content });
            this.vrchat.api.logger.debug("VRChat", `WebSocket message content:`, { type: message.type, content });
          } catch (error) {
            this.vrchat.api.logger.error("VRChat", `WebSocket message content error: ${error}`);
          }
        } else {
          this.vrchat.api.logger.debug("VRChat", `WebSocket message:`, message);
        }
      } catch (error) {
        this.vrchat.api.logger.error("VRChat", `WebSocket message error: ${error}`);
        return;
      }
    }

    this.websocket.onerror = (error) => {
      this.vrchat.api.logger.error("VRChat", `WebSocket error: ${error}`);
    };
  }

  close() {
    this.closed = true;
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  init() {
    // TODO: toggle when needed
    this.connect();
  }

  destroy() {
    this.close();
  }
}