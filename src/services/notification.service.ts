import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
  AuthorizationStatus,
} from '@notifee/react-native';

const WORKOUT_REMINDER_ID = 'workout-reminder';
const EVENING_NUDGE_ID = 'evening-nudge';
const ANDROID_CHANNEL_ID = 'running-app';

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  }

  private async ensureChannel(): Promise<void> {
    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Running Reminders',
      importance: AndroidImportance.HIGH,
    });
  }

  /**
   * Schedule a recurring daily workout reminder at the given HH:MM time.
   * Cancels any existing reminder first.
   */
  async scheduleWorkoutReminder(time: string): Promise<void> {
    await this.cancelWorkoutReminder();
    await this.ensureChannel();

    const [hours, minutes] = time.split(':').map(Number);
    const trigger = new Date();
    trigger.setHours(hours, minutes, 0, 0);
    if (trigger <= new Date()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await notifee.createTriggerNotification(
      {
        id: WORKOUT_REMINDER_ID,
        title: '🏃 Time to run!',
        body: "Check today's workout and keep your training on track.",
        android: { channelId: ANDROID_CHANNEL_ID, pressAction: { id: 'default' } },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: trigger.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      }
    );
  }

  /**
   * Schedule an evening nudge at 9 PM to log today's workout.
   * Call this each morning (or when the app opens), cancel after check-in.
   */
  async scheduleEveningNudge(): Promise<void> {
    await this.cancelEveningNudge();
    await this.ensureChannel();

    const trigger = new Date();
    trigger.setHours(21, 0, 0, 0);
    if (trigger <= new Date()) {
      // Already past 9 PM — skip today
      return;
    }

    await notifee.createTriggerNotification(
      {
        id: EVENING_NUDGE_ID,
        title: "Don't break your streak! 🔥",
        body: "Log today's workout to keep your progress going.",
        android: { channelId: ANDROID_CHANNEL_ID, pressAction: { id: 'default' } },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: trigger.getTime(),
      }
    );
  }

  async cancelWorkoutReminder(): Promise<void> {
    await notifee.cancelNotification(WORKOUT_REMINDER_ID);
  }

  async cancelEveningNudge(): Promise<void> {
    await notifee.cancelNotification(EVENING_NUDGE_ID);
  }

  async cancelAll(): Promise<void> {
    await notifee.cancelAllNotifications();
  }
}

export default new NotificationService();
