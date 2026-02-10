const getDateRange =(range,startDate,endDate)=>{
    let from = new Date();
    let to = new Date();


    if(range==="daily"){
        from.setHours(0,0,0,0);
    }else if(range==="weekly"){
        from.setDate(from.getDate()-7);
    }else if(range ==="yearly"){
        from =new Date(new Date().getFullYear(),0,1);
    }else if(range ==="custom" && startDate && endDate){
        from= new Date(startDate);
        to =new Date(endDate);
    }

    return {from ,to};
}
export default getDateRange; 