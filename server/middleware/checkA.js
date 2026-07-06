let jwt=require("jsonwebtoken")

const checkAuth=(req,res,next)=>{


    console.log(req.headers.authorization);
    let token= req.headers.authorization.split(" ")[1];
    console.log(token);
    try{
    jwt.verify(token,process.env.SECRET)
    next();
    }
    catch(err){
        console.log(err);
        res.status(401).send("authorization faild")
    }
    
}



module.exports=checkAuth