import express, { Request, Response } from "express";

import { TwilioClient } from "../services/twilio-client";
import { ActiveCalls } from "../services/active-calls";
import { authenticateUser } from "../middlewares";

import config from "../../config";

const router = express.Router();
router.use(authenticateUser);

// TO-DO error handling

router.post("/call-campaign", (req: Request, res: Response) => {
  const { phoneNumbers } = req.body;

  const client = TwilioClient.getClient();
  const callerIds = (config.callerIds as string).split(",");

  phoneNumbers.map(async (phoneNumber: string, i: number) => {
    const call = await client.calls.create({
      url: "https://ce1d-92-53-24-142.ngrok-free.app/status-callback",
      to: phoneNumber,
      from: callerIds[i],
    });

    ActiveCalls.addCall(call.sid, phoneNumber);
  });

  res.status(200).json("Call campaign started successfully");
});

router.post("/stop-campaign", async (req, res) => {
  const activeCalls = ActiveCalls.getCalls();
  const client = TwilioClient.getClient();

  for (let { callSid } of activeCalls) {
    await client.calls(callSid).update({ status: "completed" });
  }

  ActiveCalls.resetCalls();
});

export { router as campaignRouter };
