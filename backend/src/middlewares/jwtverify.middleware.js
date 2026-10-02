import jwt from "jsonwebtoken"
const verifyjwt=(req,res,next)=>{
    try {
        const authheader=req.headers.authorization;
        if(!authheader||!authheader.startsWith("Bearer")){
            return res.status(401).json({
                message:"unauthorized"
            });
        }
        const token=authheader.split(" ")[1];
        const decodedtoken=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decodedtoken;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "unauthorized: invalid or expired token"
        });
    }
};
export default verifyjwt;