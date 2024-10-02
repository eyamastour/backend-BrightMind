const  mongoose = require('mongoose');

mongoose.connect('mongodb+srv://anisammar:Xe3t7HaJdzWOzlJP@cluster0.he4bt.mongodb.net/', { useNewUrlParser: true })
.then(()=>{
    console.log("DB connected");
}).catch((err)=>console.log(err));
