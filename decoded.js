require('dotenv').config();
const jwt= require("jsonwebtoken")

module.exports = function (req,res,next){
    const token = req.header("x-auth-token");

    if(!token){
        return res.status(400), res.send("400")
    }

    const decoded = jwt.verify(token, process.env.secretKey);
    req.user = decoded.user;
    next();
}