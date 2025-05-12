import mongoose from "mongoose";

interface Filter {
  field: string;
  operator: string;
  value: string;
}

interface CrossFilter {
  field?: string;
  operator?: string;
  value?: string;
}

interface Step {
  gap: string;
  gapUnit: string;
  stepName: string;
  stepPriority: string;
  defaultAction: string;
  eligibleActionsForNextStep: string[];
}

const filterSchema = new mongoose.Schema<Filter>(
  {
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const crossFilterSchema = new mongoose.Schema<CrossFilter>(
  {
    field: { type: String },
    operator: { type: String },
    value: { type: String },
  },
  { _id: false },
);

const stepSchema = new mongoose.Schema<Step>(
  {
    gap: { type: String, required: true },
    gapUnit: { type: String, required: true },
    stepName: { type: String, required: true },
    stepPriority: { type: String, required: true },
  },
  { _id: false },
);

export {
  Filter,
  CrossFilter,
  Step,
  filterSchema,
  crossFilterSchema,
  stepSchema,
};
