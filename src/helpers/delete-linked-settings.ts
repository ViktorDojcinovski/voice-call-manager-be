import mongoose from "mongoose";

async function deleteLinkedDocument(
  doc: { [key: string]: mongoose.Types.ObjectId },
  propertyName: string,
  targetModel: mongoose.Model<any>,
) {
  if (doc && doc[propertyName]) {
    await targetModel.findByIdAndDelete(doc[propertyName]);
  }
}

export { deleteLinkedDocument };
