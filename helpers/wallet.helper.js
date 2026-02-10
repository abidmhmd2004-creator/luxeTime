import Wallet from "../models/wallet.model.js";

export const creditWallet = async({userId,amount,reason,orderId})=>{
    if(amount<=0) return;

    await Wallet.findOneAndUpdate(
        {user:userId},
        {$inc:{balance:amount},
        $push:{
            transactions:{
                type:"CREDIT",
                amount,
                reason,
                orderId
            },
        }
        },{upsert:true}
    );
}

export const debitWallet =async({userId,amount,reason,orderId})=>{
    const wallet = await Wallet.findOne({user:userId});

    if(!wallet || wallet.balance <amount){
        throw new Error("Insufficient wallet balance");
    }

    await Wallet.findOneAndUpdate(
        {user:userId},
        {$inc:{balance:-amount},
        $push:{
            transactions:{
                type:"DEBIT",
                amount,
                reason,
                orderId
            }
        }}
    )
};