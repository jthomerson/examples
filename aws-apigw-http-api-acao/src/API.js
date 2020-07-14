module.exports = {
   handler: (evt, context, cb) => {
      cb(null, {
         statusCode: 200,
         headers: {
            'X-Powered-By': process.env.AWS_LAMBDA_FUNCTION_NAME,
            'Access-Control-Allow-Origin': '*',
         },
         body: JSON.stringify({
            message: 'pong',
            time: new Date().toISOString(),
            service: process.env.AWS_LAMBDA_FUNCTION_NAME,
         }),
      });
   },
};
