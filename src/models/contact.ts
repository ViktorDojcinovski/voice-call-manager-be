import mongoose, { Document, Model } from "mongoose";

export interface ContactAttrs {
  userId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  email: string;
  actions: {
    result: string;
    timestamp: string;
  }[];
  [key: string]: any;
}

interface ContactDoc extends Document {
  userId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  email: string;
  actions: {
    result: string;
    timestamp: string;
  }[];
  [key: string]: any;
}

interface ContactModel extends Model<ContactDoc> {
  build(attrs: ContactAttrs): ContactDoc;
}

const contactSchema = new mongoose.Schema(
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
    lead_name: { type: String },
    email: { type: String, required: true, unique: true },
    actions: {
      type: [
        {
          result: { type: String, required: true },
          timestamp: { type: String, required: true },
        },
      ],
      default: [],
    },
    corporate_phone: { type: String },
    mobile_phone: { type: String },
    organization: { type: String },
    // TO-DO: add other possible fields based on the CSV structure
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

contactSchema.statics.build = (attrs: ContactAttrs) => {
  return new Contact(attrs);
};

const Contact = mongoose.model<ContactDoc, ContactModel>(
  "Contact",
  contactSchema,
);

export default Contact;
