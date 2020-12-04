//importting
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from 'pusher';
import cors from 'cors';


const app= express();
const port=process.env.PORT||3000;
const connection_url="mongodb+srv://shagun1099:Sh@gun1099@cluster1.v6gva.mongodb.net/whatsappdb?retryWrites=true&w=majority";

const pusher = new Pusher({
  appId: "1112898",
  key: "bdda380e465474b93c9e",
  secret: "c3c696fbc732835aeb74",
  cluster: "ap2",
  useTLS: true
});

//middlewares
app.use(express.json());

app.use(cors());
var corsOptions = {
  origin: 'https://whatsapp-mern-byshagun.web.app',
  methods: "GET,HEAD,PUT,PATCH,POST",
  optionsSuccessStatus: 201// some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use((req,res,next),()=>{
	res.setHeader('Access-Control-Allow-Origin','*');
	res.setHeader('Access-Control-Allow-Headers','*');
	next();
   }); 

mongoose.connect(connection_url,{
	useCreateIndex:true,
	useNewUrlParser:true,
	useUnifiedTopology:true
})

const db=mongoose.connection;

db.once("open",() =>{
  console.log("DB connected");
  const msgCollection=db.collection("messagecontents");
  const changeStream=msgCollection.watch();

  changeStream.on('change',(change)=>{
	  
	  if(change.operationType==="insert"){
		  const messageDetails=change.fullDocument;
		  pusher.trigger('messages','inserted',
						{
			               name:messageDetails.name,
			               message:messageDetails.message,
			               timestamp:messageDetails.timestamp,
			               received:messageDetails.received
		                });
	  }else{
		  console.log("Error triggering pusher");
	  }
  });
});

app.get("/",(req,res)=>res.status(200).send("welcome to my whstapp backend"));

app.get("/messages/sync",cors(corsOptions),(req,res)=>{
	Messages.find((err,data)=>{
		if(err){
			res.status(500).send(err);
		}else{
			res.status(200).send(data);
		}
	});
});

app.post("/messages/new",cors(corsOptions),(req,res)=>{
	const dbMessage=req.body;
	
	Messages.create(dbMessage,(err,data)=>{
		if(err){
			res.status(500).send(err);
		}else{
			res.status(201).send(`new message created: \n ${data}`);
		}
	});
});

app.listen(port,()=>console.log(`listening on localhost:${port}`));