const express = require("express");
const bcrypt = require("bcryptjs");
const supabase = require("../supabase");
const { signUser } = require("../utils/auth");

const router = express.Router();
const allowedRoles = ["donor", "recipient", "volunteer"];

router.post("/register", async (req,res,next)=>{
  try{
    const {name,email,password,role} = req.body;
    if(!name || !email || !password || !role) return res.status(400).json({message:"Name, email, password and role are required."});
    if(!allowedRoles.includes(role)) return res.status(400).json({message:"Invalid role."});
    if(password.length < 6) return res.status(400).json({message:"Password must be at least 6 characters."});
    const normalized=email.trim().toLowerCase();
    const {data:existing,error:checkError}=await supabase.from("profiles").select("id").eq("email",normalized).maybeSingle();
    if(checkError) throw checkError;
    if(existing) return res.status(409).json({message:"An account with this email already exists."});
    const password_hash=await bcrypt.hash(password,12);
    const {data:user,error}=await supabase.from("profiles").insert({name:name.trim(),email:normalized,password_hash,role}).select("id,name,email,role").single();
    if(error) throw error;
    res.status(201).json({user,token:signUser(user)});
  }catch(e){next(e)}
});

router.post("/login", async (req,res,next)=>{
  try{
    const {email,password}=req.body;
    if(!email || !password) return res.status(400).json({message:"Email and password are required."});
    const {data:user,error}=await supabase.from("profiles").select("id,name,email,role,password_hash,active").eq("email",email.trim().toLowerCase()).maybeSingle();
    if(error) throw error;
    if(!user || !user.active || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({message:"Invalid email or password."});
    const safe={id:user.id,name:user.name,email:user.email,role:user.role};
    res.json({user:safe,token:signUser(safe)});
  }catch(e){next(e)}
});

module.exports=router;
