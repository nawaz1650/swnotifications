const express=require('express');
const cors=require('cors');
const webpush=require('web-push')
const App=express();
const mongoose=require('mongoose');

App.use(express.json());
App.use(cors());
var notificationDB;
App.get('/',(req,res)=>{
    console.log(req.body);
    console.log("node api executed");
    res.sendStatus(201);
});


const vapidKeys = {
    "publicKey":"BAOqfzYOe5SB8XuKBidsv45Jnsizc6tZAc-vlYVBHxiTrPQfjpNkeVn9U3JV253CLs8NcJpHPFRLi4AnhU2qA8k",
    "privateKey":"Pj6IqApV3ucxDOD_O70UiRT300X35meBrlI-RkiGyZI"
};

webpush.setVapidDetails(
    'mailto:nawaz1650@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
// mongoose.connect("mongodb://localhost:27017/notDB",{useNewUrlParser: true,useUnifiedTopology: true });
mongoose.connect("mongodb+srv://shahnawaz:shahnawaz@cluster0.sjpxu.mongodb.net/notDB?authSource=admin&replicaSet=atlas-5zt0b3-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true",{useNewUrlParser: true,useUnifiedTopology: true });

const notSchema=new mongoose.Schema({
    endpoint:String,
    expirationTime:String,
    keys:{
        p256dh:String,
        auth:String
    }   
   });
   const Notmodel=mongoose.model('not',notSchema);

App.route('/api/sendnots').get(sendNewsletter);

async function sendNewsletter(req, res) {

    const allSubscriptions = await Notmodel.find();
    //... get subscriptions from database 

    console.log('Total subscriptions', allSubscriptions.length);

    const notificationPayload = {
        "notification": {
            "title": "Patel water supply",
            "body": "New order arrived!",
            //"icon": "assets/main-page-logo-small-hat.png",
            "vibrate": [100, 50, 100],
            "data": {
                "dateOfArrival": Date.now(),
                "primaryKey": 1
            },
            "actions": [{
                "action": "explore",
                "title": "Go to the site"
            }]
        }
    };

    Promise.all(allSubscriptions.map(sub => webpush.sendNotification(
        sub, JSON.stringify(notificationPayload) )))
        .then(() => res.status(200).json({message: 'notification sent successfully.'}))
        .catch(err => {
            console.error("Error sending notification, reason: ", err);
            res.sendStatus(500);
        });
    }


App.post('/subs',async(req,res)=>{
    console.log(process.env.path);
    // try{
    // notificationDB =await mongoose.connect("mongodb://localhost:27017/notDB",{useNewUrlParser: true,useUnifiedTopology: true });
    // }catch(e){
    //     console.log(e);
    // }
    // const notSchema=new mongoose.Schema({
    //  endpoint:String,
    //  expirationTime:String,
    //  keys:{
    //      p256dh:String,
    //      auth:String
    //  }   
    // });
    // const Notmodel=mongoose.model('not',notSchema);
    const checkifexist=await Notmodel.findOne({endpoint:req.body.subs.endpoint});
    console.log("check",checkifexist);
    if(checkifexist){
        console.log("subscription already exist!!");
    res.send({ok:true});
        return;
    }
    try{
    const notModel=new Notmodel({endpoint:
        req.body.subs.endpoint,
    expirationTime:null,
    keys:{
        'p256dh':
        req.body.subs.keys.p256dh,
        auth:req.body.subs.keys.auth
    }
    });
     notModel.save((err)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log("saved successfully to db");
        }
    });

     
    }catch(e){
        console.log(e);
    }
    //console.log(req.body.subs);


    res.send({'ok':true})
})
App.listen(3000,()=>{
    console.log('Server started');
})