//לא שימושי אני משאירה את זה לראות בהמשך אם נתקע בפונק ויש אותם כאן....

const Order=require('../models/orderSchema')
const User=require('../models/userSchema')

let getAllOrders=async(req,res)=>{
     const O= await Order.find().populate({
        path: 'userId',
        select:{'name':-1,'age':1}
        // match:{'numOfItem':3}
      
      });
    //  console.log(U.name)
    res.status(200).json({order:O})
}

let saveNewOrder = async (req, res) => {
  const user_id = req.body.userId;
console.log(user_id);
   if (user_id) {
    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log(newOrder);
    res.send(newOrder);

    const updatedUser = await User.findOneAndUpdate(
      { _id: user_id },
      { $push: { orders: newOrder._id } },
      { new: true }
    );
    console.log('updatedUser');
  } else {
    res.send('not found');
  }
};

module.exports={getAllOrders,saveNewOrder};
