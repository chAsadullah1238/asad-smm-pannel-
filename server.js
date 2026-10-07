const express=require("express");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const Database=require("better-sqlite3");
const path=require("path");

const app=express();
const db=new Database("data.db");
const SECRET=process.env.JWT_SECRET;
if(!SECRET){console.error("Set JWT_SECRET before starting.");process.exit(1);}
app.use(express.json());
app.use(express.static("public"));

db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,balance REAL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders(
 id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,service TEXT NOT NULL,target TEXT NOT NULL,quantity INTEGER NOT NULL,status TEXT DEFAULT 'Pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS deposits(
 id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,method TEXT NOT NULL,amount REAL NOT NULL,transaction_id TEXT NOT NULL,status TEXT DEFAULT 'Pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

function auth(req,res,next){
 const h=req.headers.authorization||"";
 if(!h.startsWith("Bearer ")) return res.status(401).json({error:"Login required"});
 try{req.user=jwt.verify(h.slice(7),SECRET);next()}catch{return res.status(401).json({error:"Invalid session"})}
}

app.post("/api/signup",async(req,res)=>{
 const {email,password}=req.body||{};
 if(!email||!password||password.length<6)return res.status(400).json({error:"Email and password (6+ characters) required"});
 try{
  const hash=await bcrypt.hash(password,12);
  const info=db.prepare("INSERT INTO users(email,password) VALUES(?,?)").run(email.toLowerCase(),hash);
  res.json({ok:true,id:info.lastInsertRowid});
 }catch(e){res.status(409).json({error:"Email already registered"});}
});

app.post("/api/login",async(req,res)=>{
 const {email,password}=req.body||{};
 const u=db.prepare("SELECT * FROM users WHERE email=?").get((email||"").toLowerCase());
 if(!u||!(await bcrypt.compare(password||"",u.password)))return res.status(401).json({error:"Invalid email or password"});
 const token=jwt.sign({id:u.id,email:u.email},SECRET,{expiresIn:"7d"});
 res.json({token});
});

app.get("/api/me",auth,(req,res)=>{
 const u=db.prepare("SELECT id,email,balance,created_at FROM users WHERE id=?").get(req.user.id);
 res.json(u);
});

app.get("/api/orders",auth,(req,res)=>{
 res.json(db.prepare("SELECT id,service,target,quantity,status,created_at FROM orders WHERE user_id=? ORDER BY id DESC").all(req.user.id));
});

app.post("/api/orders",auth,(req,res)=>{
 const {service,target,quantity}=req.body||{};
 const q=Number(quantity);
 if(!service||!target||!Number.isInteger(q)||q<1)return res.status(400).json({error:"Invalid order"});
 const info=db.prepare("INSERT INTO orders(user_id,service,target,quantity) VALUES(?,?,?,?)").run(req.user.id,service,target,q);
 res.json({ok:true,id:info.lastInsertRowid,status:"Pending"});
});

app.post("/api/deposits",auth,(req,res)=>{
 const {method,amount,transaction_id}=req.body||{};
 const allowed=["JazzCash","Easypaisa"];
 if(!allowed.includes(method)||!Number.isFinite(Number(amount))||Number(amount)<=0||!transaction_id)
   return res.status(400).json({error:"Invalid deposit"});
 const info=db.prepare("INSERT INTO deposits(user_id,method,amount,transaction_id) VALUES(?,?,?,?)")
 .run(req.user.id,method,Number(amount),transaction_id);
 res.json({ok:true,id:info.lastInsertRowid,status:"Pending"});
});

app.get("/api/deposits",auth,(req,res)=>{
 res.json(db.prepare("SELECT id,method,amount,transaction_id,status,created_at FROM deposits WHERE user_id=? ORDER BY id DESC").all(req.user.id));
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(process.env.PORT||3000,()=>console.log("ASAD SMM server running"));
