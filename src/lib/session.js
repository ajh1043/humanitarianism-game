import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";

const pass = process.env.IRON_SESSION_PASSWORD;

const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD,
  cookieName: "myapp_cookiename",
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    
  },
};

export function withSessionRoute(handler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withSessionSsr(handler) {
  return withIronSessionSsr(handler, sessionOptions);
}
