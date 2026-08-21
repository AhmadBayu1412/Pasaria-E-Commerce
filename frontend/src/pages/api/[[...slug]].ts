import type { NextApiRequest, NextApiResponse } from "next";
import app from "@/server/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Strip '/api' prefix so Express router (/auth, /products, /categories) matches cleanly
  if (req.url && req.url.startsWith("/api")) {
    req.url = req.url.slice(4) || "/";
  }

  return (app as any)(req, res);
}
