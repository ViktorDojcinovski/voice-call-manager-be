import mongoose, { Document, Model } from "mongoose";

export interface ContactAttrs {
  userId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  email: string;
  [key: string]: any;
}

interface ContactDoc extends Document {
  userId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  email: string;
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
    lead_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    phone: { type: String },
    organization: { type: String },
    // TO-DO: add other fields based on the CSV structure
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
