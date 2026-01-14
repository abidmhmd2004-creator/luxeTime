import User from "../../models/user.model.js";
import Address from "../../models/address.model.js";

export const getAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const totalAddresses = await Address.countDocuments({ userId });

        console.log(totalAddresses);

        const address = await Address.find({ userId })
            .sort({ createdat: -1 })
            .skip(skip)
            .limit(limit)

        const totalPages = Math.ceil(totalAddresses / limit);

        res.render("user/address", {
            address,
            currentPage: page,
            totalPages
        });

    } catch (error) {
        next(error)
    }
}

    export const addAddress = async (req, res) => {
        try {
            const { fullName, phone, streetAddress, city, state, pincode, addressType } = req.body;

            const isDefault = req.body.isDefault === "on";
            await Address.create({
                userId: req.session.user.id,
                fullName,
                phone,
                streetAddress,
                city,
                state,
                pincode,
                addressType: addressType || "Home",
                isDefault
            });

        } catch (err) {
            console.error(err);
            res.status(500).send("failed to submit")
        }

        res.redirect("/address");
    }

    export const editAddress = async (req, res) => {
        const { id } = req.params;
        const isDefault = req.body.isDefault === "on";
        const { fullName, phone, streetAddress, city, state, pincode, addressType } = req.body;
        await Address.findOneAndUpdate(
            { _id: id, userId: req.session.user.id },
            {
                fullName, phone, streetAddress, city, state, pincode, addressType, isDefault
            }
        );

        res.redirect("/address");
    }


    export const deleteAddress = async (req, res) => {
        try {
            const { id } = req.params;

            await Address.findOneAndDelete({
                _id: id,
                userId: req.session.user.id
            });
            return res.json({ success: true });
        } catch (err) {
            next(err)
        }
    }