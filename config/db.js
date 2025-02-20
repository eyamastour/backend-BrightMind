const  mongoose = require('mongoose');

mongoose.connect('mongodb+srv://eyamastour:12345678eya@cluster0.noq7n.mongodb.net/', { useNewUrlParser: true })
.then(()=>{
    console.log("DB connected");
}).catch((err)=>console.log(err));
