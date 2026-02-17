import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
    },
    expiry: {
      type: Date,
      required: true,
    },
    maxUsage: {
      type: Number,
      default: 0,
    },
    useCount: {
      type: Number,
      default: 0,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
