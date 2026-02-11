import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 30,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    offerValue: {
      type: Number,
      min: 0,
      max: 90,
      default: 0,
    },
    offerExpiry: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Category", categorySchema);
