import mongoose from "mongoose";

import { TelephonyConnection, PowerDialerMode } from "voice-javascript-common";

const sfdcFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
});

const mappedFieldsSchema = new mongoose.Schema({
  leads: { type: [sfdcFieldSchema], default: [] },
  contacts: { type: [sfdcFieldSchema], default: [] },
  accounts: { type: [sfdcFieldSchema], default: [] },
  opportunities: { type: [sfdcFieldSchema], default: [] },
});

export const phoneSettingsSchema = new mongoose.Schema(
  {
    powerDialerManagement: {
      telephonyConnection: {
        type: String,
        enum: Object.values(TelephonyConnection),
        default: TelephonyConnection.SOFT_CALL,
      },
      powerDialer: {
        mode: {
          type: String,
          enum: Object.values(PowerDialerMode),
          default: PowerDialerMode.CALL_AFTER_PERFORMED_ACTION,
        },
        waitTime: {
          type: Number,
          default: 0,
        },
      },
      personalCallId: {
        type: String,
        default: "",
      },
      identification: {
        showAssignedCallId: { type: Boolean, default: true },
        balanceBetweenAvailable: { type: Boolean, default: true },
        privateCallId: { type: Boolean, default: false },
        otherCallId: {
          type: String,
          default: "",
        },
      },
    },
    callManagement: {
      connectionDefinition: {
        callConnect: {
          type: Boolean,
          default: false,
        },
        callTime: {
          type: Number,
          default: 0,
        },
      },
      preventMultiple: {
        mode: {
          type: Boolean,
          default: false,
        },
        preventTime: {
          type: Number,
          default: 0,
        },
      },
    },
    recordingsManagement: {
      enableCallRecording: {
        type: Boolean,
        default: true,
      },
      excludePhonesStartingWith: {
        type: String,
        default: "",
      },
      includeOnlyPhonesStartingWith: {
        type: String,
        default: "",
      },
    },
    schedulesManagement: {
      type: Map,
      of: [
        {
          from: {
            type: String,
            required: true,
          },
          to: {
            type: String,
            required: true,
          },
        },
      ],
      default: {},
    },
    callResults: [
      {
        label: { type: String, required: true },
        checked: { type: Boolean, default: false },
      },
    ],
    integrationSettings: {
      type: mappedFieldsSchema,
      default: {
        leads: [],
        contacts: [],
        accounts: [],
        opportunities: [],
      },
    },
    voiceMessages: {},
    voiceMailGreetings: {},
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);
