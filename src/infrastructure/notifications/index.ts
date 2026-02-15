export type NotifyPayload = {
  title: string;
  body?: string;
  tag?: string;
};

export interface NotificationsPort {
  isSupported(): boolean;
  getPermission(): NotificationPermission | "unsupported";
  requestPermission(): Promise<NotificationPermission | "unsupported">;
  notify(payload: NotifyPayload): void;
}

/** Browser Notification API adapter */
export class BrowserNotifications implements NotificationsPort {
  isSupported() {
    return typeof window !== "undefined" && "Notification" in window;
  }

  getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!this.isSupported()) return "unsupported";
    return await Notification.requestPermission();
  }

  notify(payload: NotifyPayload) {
    if (!this.isSupported()) return;
    if (Notification.permission !== "granted") return;

    // create the notification (no need to store reference for our use case)
    new Notification(payload.title, { body: payload.body, tag: payload.tag });
  }
}

/** Test/dev adapter (captures notifications in memory) */
export class MemoryNotifications implements NotificationsPort {
  public items: NotifyPayload[] = [];
  isSupported() {
    return true;
  }
  getPermission() {
    return "granted" as NotificationPermission;
  }
  async requestPermission() {
    return "granted" as NotificationPermission;
  }
  notify(payload: NotifyPayload) {
    this.items.push(payload);
  }
}
