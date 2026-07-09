const express = require('express');
const app=express();
const mongoose=require('mongoose');
const path = require('path');
const env=require('dotenv')
env.config();
app.use(express.static('../client'));
const routerUser=require('./routes/userRouter')
const routerEvent = require('./routes/eventRouter');
const routerTicket = require('./routes/ticketRouter');
// ייבוא הראוטר החדש (תוסיפי למעלה בשרת הראשי)
const routertransaction = require('./routes/transactionRouter');


const conectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
mongoose.connect(process.env.CONECTION_STRING,conectionParams)
.then(()=>{console.log("conected to db")})
.catch((err)=>{console.log(err)})

const cors = require('cors');
app.use(express.json());
app.use(cors()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(routerUser)
app.use(routerEvent);
app.use(routerTicket);
app.use(routertransaction);
app.listen(4000,()=>{
    console.log('you are listening to port 4000')
})