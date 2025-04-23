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
  // TO-DO remove comment after fixing auth on dev
  // user: mongoose.Types.ObjectId;
  listName: string;
  listPriority: string;
  listType: string;
  listSharing: string;
  filters: Filter[];
  crossFilters: CrossFilter[];
  exitStrategy: string;
  exitStrategyDescription: string;
  steps: Step[];
  contacts?: mongoose.Types.ObjectId[];
}

interface ListDoc extends Document {
  // TO-DO remove comment after fixing auth on dev
  // user: mongoose.Types.ObjectId;
  listName: string;
  listPriority: string;
  listType: string;
  listSharing: string;
  filters: Filter[];
  crossFilters: CrossFilter[];
  exitStrategy: string;
  exitStrategyDescription: string;
  steps: Step[];
  contacts: mongoose.Types.ObjectId[];
}

interface ListModel extends Model<ListDoc> {
  build(attrs: ListAttrs): ListDoc;
}

const listSchema = new mongoose.Schema(
  {
    // TO-DO remove comment after fixing auth on dev
    // user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listName: { type: String, required: true },
    listPriority: { type: String, required: true },
    listType: { type: String, required: true },
    listSharing: { type: String, required: true },
    filters: { type: [filterSchema], default: [] },
    crossFilters: { type: [crossFilterSchema], default: [] },
    exitStrategy: { type: String, required: true },
    exitStrategyDescription: { type: String, required: true },
    steps: { type: [stepSchema], default: [] },
    contacts: [{ type: Schema.Types.ObjectId, ref: "Contact", default: [] }],
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
