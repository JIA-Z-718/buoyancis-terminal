// Browser Notification API utilities

export type NotificationPermissionState = 'granted' | 'denied' | 'default';

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermissionState => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission as NotificationPermissionState;
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (!isNotificationSupported()) return 'denied';
  
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

interface AlertNotificationOptions {
  title: string;
  body: string;
  severity: 'warning' | 'critical';
  onClick?: () => void;
}

interface CompletionNotificationOptions {
  title: string;
  body: string;
  type: 'success' | 'partial' | 'failure';
  onClick?: () => void;
}

export const showAlertNotification = ({
  title,
  body,
  severity,
  onClick,
}: AlertNotificationOptions): Notification | null => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  const notification = new Notification(title, {
    body,
    icon: severity === 'critical' 
      ? '/favicon.ico' // Could use different icons
      : '/favicon.ico',
    badge: '/favicon.ico',
    tag: `alert-${Date.now()}`, // Unique tag to prevent duplicate notifications
    requireInteraction: severity === 'critical', // Critical alerts stay until dismissed
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    onClick?.();
  };

  // Auto-close warning notifications after 10 seconds
  if (severity === 'warning') {
    setTimeout(() => notification.close(), 10000);
  }

  return notification;
};

export const showCompletionNotification = ({
  title,
  body,
  type,
  onClick,
}: CompletionNotificationOptions): Notification | null => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;
  // Only show if tab is not focused
  if (document.hasFocus()) return null;

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `completion-${Date.now()}`,
    requireInteraction: false,
    silent: type === 'success', // Silent for success, audible for failures
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    onClick?.();
  };

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);

  return notification;
};
