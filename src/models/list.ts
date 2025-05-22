import mongoose, { Model, Document, Schema } from "mongoose";

import {
  Filter,
  CrossFilter,
  Step,
  filterSchema,
  crossFilterSchema,
  stepSchema,
} from "../schemas/lists";

interface ListAttrs {
  user: mongoose.Types.ObjectId;
  listName: string;
  listPriority: string;
  listType: string;
  listSharing: string;
  filters: Filter[];
  crossFilters: CrossFilter[];
  exitStrategy: string;
  exitStrategyDescription: string;
  exitConditionsPositive: [String];
  exitConditionsNegative: [String];
  steps: Step[];
  contacts?: mongoose.Types.ObjectId[];
  tags?: string;
  restrictToOwnedLeads?: boolean;
  restrictToOwnedAccounts?: boolean;
  listOwner?: string;
  listActive?: boolean;
  hasExitCriteria?: boolean;
}

interface ListDoc extends Document {
  user: mongoose.Types.ObjectId;
  listName: string;
  listPriority: string;
  listType: string;
  listSharing: string;
  filters: Filter[];
  crossFilters: CrossFilter[];
  exitStrategy: string;
  exitStrategyDescription: string;
  exitConditionsPositive: [String];
  exitConditionsNegative: [String];
  steps: Step[];
  contacts: mongoose.Types.ObjectId[];
  tags?: string;
  restrictToOwnedLeads?: boolean;
  restrictToOwnedAccounts?: boolean;
  listOwner?: string;
  listActive?: boolean;
  hasExitCriteria?: boolean;
}

interface ListModel extends Model<ListDoc> {
  build(attrs: ListAttrs): ListDoc;
}

const listSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listName: { type: String, required: true },
    listPriority: { type: String, required: true },
    listType: { type: String, required: true },
    listSharing: { type: String, required: true },
    filters: { type: [filterSchema], default: [] },
    crossFilters: { type: [crossFilterSchema], default: [] },
    exitStrategy: { type: String },
    exitStrategyDescription: { type: String },
    exitConditionsPositive: { type: [String] },
    exitConditionsNegative: { type: [String] },
    steps: { type: [stepSchema], default: [] },
    contacts: [{ type: Schema.Types.ObjectId, ref: "Contact", default: [] }],
    tags: { type: String, default: "" },
    restrictToOwnedLeads: { type: Boolean, default: false },
    restrictToOwnedAccounts: { type: Boolean, default: false },
    listOwner: { type: String, default: "" },
    listActive: { type: Boolean, default: true },
    hasExitCriteria: { type: Boolean, default: false },
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

listSchema.statics.build = (attrs: ListAttrs) => {
  return new List(attrs);
};

const List = mongoose.model<ListDoc, ListModel>("List", listSchema);

export default List;
