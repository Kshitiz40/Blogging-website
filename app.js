const express = require('express')
const app = express()
const path = require('path')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const userModel = require('./models/user')
const postModel = require('./models/post')
const bcryptjs = require('bcryptjs')
const multerConfig = require("./config/multer")
const upload = require('./config/multer')

app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser())

// file{
//     originalame : "index.jpg"
// }


app.get('/',async (req,res)=>{
    let users = await userModel.find()
    res.render('index',{users})
});

app.post('/register',async (req,res)=>{
    let {username,name,age,email,password} = req.body;
    let user = await userModel.findOne({email:email})
    if(user) return res.status(500).send("user already registered");
    
    bcryptjs.genSalt(10,(err,salt)=>{
        bcryptjs.hash(password,salt,async (err,hash)=>{
            let user = await userModel.create({
                username,
                name,
                age,
                email,
                password : hash
            });
            
            let token = jwt.sign({email:email, userid: user._id},"shhhh");
            res.cookie("token",token);
            res.redirect("/profile");
        })
    })
});

app.get('/login',(req,res)=>{
    res.render('login')
})

app.post('/login',async (req,res)=>{
    let {email,password} = req.body;
    let user = await userModel.findOne({email:email})
    if(!user) return res.status(500).send("Something went wrong");

    bcryptjs.compare(password,user.password,(err,result)=>{
        if(result){ 
            let token = jwt.sign({email:email,userid:user._id},"shhhh");
            res.cookie("token",token)
            res.status(200).redirect("/profile");
        }
        else res.redirect("/login")
    })
});

app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect('/login')
})
 
app.get('/profile',isLoggedIn,async (req,res)=>{
    let user = await userModel.findOne({email : req.user.email}).populate("posts");
    res.render('profile',{user})
})

app.post("/post",isLoggedIn,async (req,res)=>{
    let user = await userModel.findOne({email : req.user.email})
    let {content} = req.body;
    let post = await postModel.create({
        user : req.user.userid,
        content : content
    })

    user.posts.push(post._id)
    await user.save()

    res.redirect("/profile")
}) 

app.get('/like/:id',isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({_id : req.params.id}).populate("user");
    
    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    await post.save();
    res.redirect("/profile")
})

app.get('/edit/:id',isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({_id : req.params.id});
    res.render('edit',{post});
})

app.post('/update/:id',isLoggedIn,async (req,res)=>{
    let post = await postModel.findOneAndUpdate({_id : req.params.id}, {content: req.body.content});
    res.redirect('/profile')
})

function isLoggedIn(req,res,next){
    if(req.cookies.token === "") res.redirect("/login")
    else{
        let data = jwt.verify(req.cookies.token,"shhhh");
        req.user = data;//data contains data from cookie i.e, email and userid
        next();
    }
}

app.get("/test",(req,res)=>{
    res.render("test");
})

app.get("/profile/upload",(req,res)=>{ 
    res.render("profile_upload")
})

app.post("/upload",isLoggedIn,multerConfig.single('image'),async (req,res)=>{
    let user = await userModel.findOneAndUpdate({_id : req.user.userid},{profilepic : req.file.filename})
    res.redirect("/profile")
})

app.listen(3000); 