import mongoose, { mongo } from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Variant',
        required: true,
      },
    },
  ],
});

export default mongoose.model('Wishlist', wishlistSchema);
