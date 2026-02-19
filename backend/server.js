import express from "express";
import cors from "cors";
import { sendSimpleAlert, requestCaregiverAssist } from './alert-handler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/alert/simple', async (req, res) => {
  const { commandId, details } = req.body;
  const result = await sendSimpleAlert(commandId, details);
  res.json(result); 
});

app.post('/alert/request', async (req, res) => {
  const { commandId } = req.body;
  const result = await requestCaregiverAssist(commandId);
  res.json(result);
});

app.get("/", (req,res)=>{
  res.send("Backend is running ✅");
});


app.listen(3000, () => console.log('Backend running on port 3000'));