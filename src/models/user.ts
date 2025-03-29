import mongoose, { Document, Model } from "mongoose";
import { UserRole } from "voice-javascript-common";

import Settings from "./settings";

import { Password } from "../services/password";

interface UserAttrs {
  email: string;
  password: string;
  role: UserRole;
  settings?: mongoose.Types.ObjectId;
}

interface UserDoc extends Document {
  email: string;
  password: string;
  role: UserRole;
  settings?: mongoose.Types.ObjectId;
}

interface UserModel extends Model<UserDoc> {
  build(userAttrs: UserAttrs): UserDoc;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.USER,
    },
    settings: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Settings",
      default: null,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  },
);

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

// userSchema.pre("validate", function (next) {
//   if (this.role === UserRole.Admin && !this.settings) {
//     return next(new Error("Admin users must have settings assigned."));
//   }
//   next();
// });

userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export default User;
