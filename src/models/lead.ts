import mongoose, { Document, Model } from "mongoose";

export interface LeadAttrs {
  userId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  email: string;
  actions: {
    result: string;
    timestamp: string;
  }[];
  [key: string]: any;
}

interface LeadDoc extends Document {
  userId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  email: string;
  actions: {
    result: string;
    timestamp: string;
  }[];
  [key: string]: any;
}

interface LeadModel extends Model<LeadDoc> {
  build(attrs: LeadAttrs): LeadDoc;
}

const leadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    name: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, required: true, unique: true },
    company: { type: String },
    corporate_phone: { type: String },
    mobile_phone: { type: String },
    organization: { type: String },
    actions: {
      type: [
        {
          result: { type: String, required: true },
          timestamp: { type: String, required: true },
        },
      ],
      default: [],
    },
    // TO-DO: add other possible fields based on the Lead bussiness logic
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

leadSchema.statics.build = (attrs: LeadAttrs) => {
  return new Lead(attrs);
};

const Lead = mongoose.model<LeadDoc, LeadModel>("Lead", leadSchema);

export default Lead;
