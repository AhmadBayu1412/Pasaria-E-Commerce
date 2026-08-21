import serverlessExpress from "@vendia/serverless-express";
import app from "@/server/app";

const handler = serverlessExpress({
    app
});

export {
    handler as GET,
    handler as POST,
    handler as PUT,
    handler as PATCH,
    handler as DELETE,
    handler as OPTIONS
};
