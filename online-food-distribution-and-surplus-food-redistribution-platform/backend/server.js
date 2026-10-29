require("dotenv").config();
const path=require("path");
const express=require("express");
const helmet=require("helmet");
const rateLimit=require("express-rate-limit");
const authRoutes=require("./routes/auth");
const foodRoutes=require("./routes/food");
const claimRoutes=require("./routes/claims");
const supabase=require("./supabase");

const app=express();
const PORT=process.env.PORT||3000;

app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:"20kb"}));
app.use(rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));
app.use(express.static(path.join(__dirname,"..","frontend")));

app.get("/api/health",async(req,res)=>res.json({ok:true,service:"foodshare-api"}));

app.get("/api/stats",async(req,res,next)=>{
  try{
    const [{count:availableMeals},{count:donors},{data:claims}]=await Promise.all([
      supabase.from("food_listings").select("*",{count:"exact",head:true}).eq("status","available"),
      supabase.from("profiles").select("*",{count:"exact",head:true}).eq("role","donor").eq("active",true),
      supabase.from("claims").select("quantity").eq("status","fulfilled")
    ]);
    const redistributedMeals=(claims||[]).reduce((sum,x)=>sum+Number(x.quantity||0),0);
    res.json({availableMeals:availableMeals||0,donors:donors||0,redistributedMeals});
  }catch(e){next(e)}
});

app.get("/api/dashboard",require("./middleware/auth").requireAuth,async(req,res,next)=>{
  try{
    const listingsRes=await supabase.from("food_listings").select("id,title,quantity,status,pickup_location,created_at").eq("donor_id",req.user.sub).order("created_at",{ascending:false});
    const claimsRes=await supabase.from("claims").select("id,quantity,status,food_listings(title)").eq("recipient_id",req.user.sub).order("created_at",{ascending:false});
    if(listingsRes.error)throw listingsRes.error;if(claimsRes.error)throw claimsRes.error;
    const claims=claimsRes.data.map(c=>({id:c.id,quantity:c.quantity,status:c.status,food_title:c.food_listings?.title||"Food"}));
    res.json({listings:listingsRes.data,claims});
  }catch(e){next(e)}
});

app.use("/api/auth",authRoutes);
app.use("/api/food",foodRoutes);
app.use("/api/claims",claimRoutes);

app.use("/api",(req,res)=>res.status(404).json({message:"API endpoint not found."}));
app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({message:"Something went wrong on the server. Check the server console for details."});
});

app.get("/{*splat}",(req,res)=>{
  res.sendFile(path.join(__dirname,"..","frontend","index.html"));
});

app.listen(PORT,()=>console.log(`FoodShare running at http://localhost:${PORT}`));
