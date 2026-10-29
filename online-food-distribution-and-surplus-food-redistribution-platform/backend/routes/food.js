const express=require("express");
const supabase=require("../supabase");
const {requireAuth,requireRole}=require("../middleware/auth");
const router=express.Router();

router.get("/",async(req,res,next)=>{
  try{
    const {search="",status="available"}=req.query;
    let q=supabase.from("food_listings").select("id,donor_id,title,category,quantity,expiry_at,pickup_location,description,status,created_at").order("created_at",{ascending:false});
    if(status) q=q.eq("status",status);
    if(search) q=q.or(`title.ilike.%${search}%,category.ilike.%${search}%,pickup_location.ilike.%${search}%`);
    const {data,error}=await q.limit(100); if(error)throw error;
    res.json({items:data});
  }catch(e){next(e)}
});

router.post("/",requireAuth,requireRole("donor"),async(req,res,next)=>{
  try{
    const {title,category,quantity,expiry_at,pickup_location,description}=req.body;
    if(!title||!category||!quantity||!expiry_at||!pickup_location)return res.status(400).json({message:"All required food fields must be provided."});
    if(!Number.isInteger(Number(quantity))||Number(quantity)<1)return res.status(400).json({message:"Quantity must be a positive whole number."});
    if(new Date(expiry_at)<=new Date())return res.status(400).json({message:"Expiry time must be in the future."});
    const {data,error}=await supabase.from("food_listings").insert({
      donor_id:req.user.sub,title:title.trim(),category,quantity:Number(quantity),expiry_at,
      pickup_location:pickup_location.trim(),description:(description||"").trim()
    }).select("*").single();
    if(error)throw error; res.status(201).json({item:data});
  }catch(e){next(e)}
});

router.post("/:id/claim",requireAuth,requireRole("recipient","volunteer"),async(req,res,next)=>{
  try{
    const id=req.params.id;
    const {data:food,error:foodError}=await supabase.from("food_listings").select("id,quantity,status").eq("id",id).maybeSingle();
    if(foodError)throw foodError;
    if(!food)return res.status(404).json({message:"Food listing not found."});
    if(food.status!=="available")return res.status(409).json({message:"This food is no longer available."});
    const {data:old}=await supabase.from("claims").select("id").eq("food_id",id).eq("recipient_id",req.user.sub).eq("status","requested").maybeSingle();
    if(old)return res.status(409).json({message:"You already requested this listing."});
    const {data,error}=await supabase.from("claims").insert({food_id:id,recipient_id:req.user.sub,quantity:food.quantity}).select("*").single();
    if(error)throw error;
    res.status(201).json({claim:data});
  }catch(e){next(e)}
});

module.exports=router;
