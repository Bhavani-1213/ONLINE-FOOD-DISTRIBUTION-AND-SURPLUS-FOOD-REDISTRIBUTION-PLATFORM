const express=require("express");
const supabase=require("../supabase");
const {requireAuth}=require("../middleware/auth");
const router=express.Router();

router.patch("/:id/cancel",requireAuth,async(req,res,next)=>{
  try{
    const {data:claim,error}=await supabase.from("claims").select("id,recipient_id,status").eq("id",req.params.id).maybeSingle();
    if(error)throw error;
    if(!claim)return res.status(404).json({message:"Request not found."});
    if(claim.recipient_id!==req.user.sub)return res.status(403).json({message:"You cannot cancel another user's request."});
    if(claim.status!=="requested")return res.status(409).json({message:"Only requested claims can be cancelled."});
    const {data,error:updateError}=await supabase.from("claims").update({status:"cancelled"}).eq("id",claim.id).select("*").single();
    if(updateError)throw updateError;
    res.json({claim:data});
  }catch(e){next(e)}
});
module.exports=router;
