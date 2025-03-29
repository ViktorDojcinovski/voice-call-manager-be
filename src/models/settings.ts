import mongoose, { Model, Document, Schema } from "mongoose";

import { phoneSettingsSchema } from "../schemas/phone-settings-schema";

export interface SettingCategory {
  [key: string]: string | number | boolean | Object;
}

interface SettingsAttrs {
  user: mongoose.Types.ObjectId;
  "General Settings": SettingCategory;
  "Notifications Settings": SettingCategory;
  "Phone Settings": typeof phoneSettingsSchema;
}

interface SettingsDoc extends Document {
  user: mongoose.Types.ObjectId;
  "General Settings": SettingCategory;
  "Notifications Settings": SettingCategory;
  "Phone Settings": typeof phoneSettingsSchema;
}

interface SettingsModel extends Model<SettingsDoc> {
  build(attrs: SettingsAttrs): SettingsDoc;
}

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    "General Settings": {
      type: Schema.Types.Mixed,
      default: {},
    },
    "Notifications Settings": {
      type: Schema.Types.Mixed,
      default: {},
    },
    "Phone Settings": {
      type: phoneSettingsSchema,
      default: {},
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

settingsSchema.statics.build = (attrs: SettingsAttrs) => {
  return new Settings(attrs);
};

const Settings = mongoose.model<SettingsDoc, SettingsModel>(
  "Settings",
  settingsSchema,
);

export default Settings;
