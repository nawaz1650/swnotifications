const express=require('express');
const cors=require('cors');
const webpush=require('web-push')
const App=express();
const mongoose=require('mongoose');
console.log(process.env.mongo);
App.use(express.json());
App.use(cors());
var notificationDB;
App.get('/',(req,res)=>{
    console.log(req.body);
    console.log("node api executed");
    res.sendStatus(201);
});


const vapidKeys = {
    "publicKey":process.env.publickey,
    "privateKey":process.env.privatekey
};

webpush.setVapidDetails(
    'mailto:nawaz1650@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
// mongoose.connect("mongodb://localhost:27017/notDB",{useNewUrlParser: true,useUnifiedTopology: true });
mongoose.connect(process.env.mongo,{useNewUrlParser: true,useUnifiedTopology: true });

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
    const body=JSON.parse(req.body.subs);
    console.log(process.env.publickey);
    console.log(process.env.privatekey);
    console.log(process.env.mongo);
    console.log("###############");
console.log('req body is ',req.body )
    console.log("###############");
    console.log("body obj is  ",body);
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
    const checkifexist=await Notmodel.findOne({endpoint:body.endpoint});
    console.log("check",checkifexist);
    if(checkifexist){
        console.log("subscription already exist!!");
    res.send({ok:true});
        return;
    }
    try{
        console.log("from try block");
        console.log("p25dh is ",body.keys.p256dh);
        console.log("auth is ",body.keys.auth);
    const notModel=new Notmodel({endpoint:body.endpoint,
    expirationTime:null,
    keys:{
        p256dh:body.keys.p256dh,
        auth:body.keys.auth
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
App.listen(process.env.PORT,()=>{
    console.log('Server started on',process.env.PORT );
})
