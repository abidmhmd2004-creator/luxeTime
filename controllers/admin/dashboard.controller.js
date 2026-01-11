

export const getDashboard =async (req,res)=>{
    try {
        res.render("admin/dashboard",{layout:"layouts/admin"})
    } catch (error) {
        console.log(error);
        res.status(500).send("Loading failed");
    }
}