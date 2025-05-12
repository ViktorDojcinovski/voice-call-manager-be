import { PowerDialerMode } from "voice-javascript-common";

import { SettingCategory } from "../models/settings";
import { phoneSettingsSchema } from "../schemas/phone-settings-schema";

enum TelephonyConnection {
  SOFT_CALL = "Soft call",
  PARALLEL_CALL = "Two Parallel calls",
  ADVANCED_PARALLEL_CALL = "Four Parallel calls",
}

type DefaultSettings = {
  "General Settings": SettingCategory;
  "Notifications Settings": SettingCategory;
  "Phone Settings": typeof phoneSettingsSchema;
};

export const defaultSettings: DefaultSettings = {
  "General Settings": {
    timezone: "UTC",
  },
  "Notifications Settings": {
    emailNotifications: {
      inboudEmails: { notificationstab: false, popUp: false, desktop: false },
      emailOpens: { notificationsTab: false, popUp: false, desktop: false },
      emailClicks: { notificationsTab: false, popUp: false, desktop: false },
    },
    smsNotifications: {
      inboundSMS: { popUp: false, desktop: false },
    },
    taskNotifications: {
      enableDesktop: false,
      enableSound: false,
      taskType: "All Tasks",
    },
  },
  "Phone Settings": {
    powerDialerManagement: {
      telephonyConnection: TelephonyConnection.SOFT_CALL,
      powerDialer: {
        mode: PowerDialerMode.CALL_AFTER_PERFORMED_ACTION,
        waitTime: 0,
      },
      personalCallId: "",
      identification: {
        showAssignedCallId: true,
        balanceBetweenAvailable: true,
        privateCallId: false,
        otherCallId: "",
      },
    },
    callManagement: {
      connectionDefinition: {
        callConnect: false,
        callTime: 0,
      },
      preventMultiple: {
        mode: false,
        preventTime: 0,
      },
    },
    recordingsManagement: {
      enableCallRecording: true,
      excludePhonesStartingWith: "",
      includeOnlyPhonesStartingWith: "",
    },
    schedulesManagement: {},
    callResults: [],
    integrationSettings: {},
    voiceMessages: {},
    voiceMailGreetings: {},
  } as unknown as typeof phoneSettingsSchema,
};
