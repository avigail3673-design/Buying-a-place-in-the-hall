const EXPRESS=require('express');
const app=EXPRESS();
const mongoose=require('mongoose');

const env=require('dotenv')
env.config();
const routerUser=require('./routes/userRouter')
const routerEvent = require('./routes/eventRouter');
const routerTicket = require('./routes/ticketRouter');
const conectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
mongoose.connect(process.env.CONECTION_STRING,conectionParams)
.then(()=>{console.log("conected to db")})
.catch((err)=>{console.log(err)})

app.listen(4000,()=>{
    console.log('you are listening to port 4000')
})
const cors = require('cors');

app.use(cors()); 
app.use(EXPRESS.json());
app.use(routerUser)
app.use(routerEvent);
app.use(routerTicket);
