

export const getDashboard =async (req,res)=>{
    try {
        res.render("admin/dashboard",{layout:"layouts/admin"})
    } catch (error) {
        next(error)
    }
}