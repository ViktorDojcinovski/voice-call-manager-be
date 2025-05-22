import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import * as cookie from "cookie";
import jwt, { JwtPayload } from "jsonwebtoken";

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void,
) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error("No cookie found"));
    }

    const cookies = cookie.parse(cookieHeader);
    const sessionCookie = cookies.session;
    if (!sessionCookie) {
      return next(new Error("Session cookie not found"));
    }
    try {
      const base64 = decodeURIComponent(sessionCookie);
      const dec = Buffer.from(base64, "base64").toString("utf8");

      const parsedSession = JSON.parse(dec);

      const token = parsedSession.jwt;
      if (!token) {
        return next(new Error("JWT not found in session"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      console.log("decoded: ", decoded);

      // Attach user to the socket
      socket.data.user = decoded;

      console.log("socket.data.user: ", socket.data.user);
    } catch (err) {
      console.error("Failed to parse session:", sessionCookie);
      console.error("Error details:", err);
      return next(new Error("Malformed session cookie"));
    }

    next();
  } catch (error) {
    next(new Error("Socket authentication failed"));
  }
};
