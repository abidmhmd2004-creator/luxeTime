import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            unique: true,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                product: { type: mongoose.Schema.ObjectId, ref: "Product" },
                variant: { type: mongoose.Schema.ObjectId, ref: "Variant" },
                itemStatus: {
                    type: String,
                    enum: ["ACTIVE", "CANCELLED", "RETURN_REQUESTED", "RETURNED","RETURN_REJECTED"],
                    default: "ACTIVE"
                },
                quantity: Number,
                price: Number,
                returnReason: String,
                returnRequestedAt: Date

            }
        ],
        shippingAddress: {
            fullName: String,
            phone: String,
            pincode: String,
            streetAddress: String,
            city: String,
            state: String,
            addressType: String
        },
        paymentMethod: {
            type: String,
            enum: ["RAZORPAY", "WALLET", "COD"],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING"
        },
        orderStatus: {
            type: String,
            enum: ["PLACED", "CONFIRM", "SHIPPED", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED"],
            default: "PLACED"
        },
        returnReason: String,
        returnRequestedAt: Date,
        subtotal: Number,
        discount: Number,
        tax: Number,
        totalAmount: Number
    }, { timestamps: true }
)

export default mongoose.model("Order", orderSchema);