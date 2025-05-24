import express, { Request, Response } from "express";

import { TwilioClient } from "../services/twilio-client";
import { ActiveCalls } from "../services/active-calls";
import { authenticateUser } from "../middlewares";
import { normalizePhone } from "../utils/normilizePhone";

import config from "../config";

const router = express.Router();
router.use(authenticateUser);

// TO-DO error handling

router.post("/call-campaign", async (req: Request, res: Response) => {
  const { contacts } = req.body;
  const userId = req.user!.id;

  const client = TwilioClient.getClient();
  const callerIds = (config.callerIds as string).split(",");
  // TO DO -- change any to Contact

  await Promise.all(
    // TO DO change any to Contact
    contacts.map(async (contact: any, i: number) => {
      console.log("contact.mobile_phone: ", contact.mobile_phone);
      const call = await client.calls.create({
        url: `https://p1.echo-o.com/api/twilio/status-callback?userId=${userId}&contactId=${contact._id}`,
        to: normalizePhone(contact.mobile_phone) as string,
        from: callerIds[i],
        statusCallback: `https://p1.echo-o.com/api/twilio/status-callback?userId=${userId}`,
        statusCallbackEvent: [
          "initiated",
          "ringing",
          "in-progress",
          "completed",
          "busy",
          "no-answer",
          "failed",
        ],
        statusCallbackMethod: "POST",
        machineDetection: "Enable",
      });

      ActiveCalls.addCall(call.sid, contact.mobile_phone);
    }),
  );

  const activeCalls = ActiveCalls.getCalls();
  console.log("activeCalls: ", activeCalls);
  res.status(200).json(activeCalls);
});

router.post("/stop-campaign", async (req, res) => {
  const activeCalls = ActiveCalls.getCalls();
  const client = TwilioClient.getClient();

  for (let { callSid } of activeCalls) {
    await client.calls(callSid).update({ status: "completed" });
  }

  ActiveCalls.resetCalls();

  res.json({ message: "Campaign succesfully terminated!" });
});

router.get("/campaign-status", (req, res) => {
  const activeCalls = ActiveCalls.getCalls();
  res.json({ activeCalls: activeCalls.length });
});

export { router as campaignRouter };
