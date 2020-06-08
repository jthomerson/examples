# Demonstrate `/ping` Route Takeover By API Gateway

## Overview

The root of any API Gateway API appears to takeover the `/ping` route on all APIs, even if
you have defined an explict `/ping` route. This does not appear to be documented
anywhere*.

Using the Serverless Framework and **REST APIs**, this is not a huge deal because the
framework automatically creates a stage for you, and your stage is at the root of the URL
(i.e. the `dev` stage results in URLs like `/dev/ping`, so you never actually hit `/ping`
at the API root).

However, using the HTTP API, the Serverless Framework defaults to the `$default` stage,
which puts your API at the actual root of the API domain. That means your `/ping` route is
actually available at `/ping`. But, your `/ping` route _is not_ available because AWS has
hijacked this route for their own use, and you can't use it.

\* At the time of this writing. It should also be noted that it's possible that it's
documented, but totally impossible to find because searching Google (or the AWS docs)for
"http api" is not exactly helpful.


## Steps to Reproduce

```shell
git clone git@github.com:jthomerson/examples.git
cd examples/aws-apigw-ping-route
sls deploy --region us-east-1 --stage dev
RESTAPIID=$(aws --region us-east-1 apigateway get-rest-apis --query "items[?name=='dev-pingable-api'] | [0].id" --output text)
RESTAPIURL="https://${RESTAPIID}.execute-api.us-east-1.amazonaws.com"
HTTPAPIID=$(aws --region us-east-1 apigatewayv2 get-apis --query "Items[?Name=='dev-pingable-api'] | [0].ApiId" --output text)
HTTPAPIURL="https://${HTTPAPIID}.execute-api.us-east-1.amazonaws.com"
echo 'REST API - root path (without stage) - /ping'
curl -s "${RESTAPIURL}/ping" && echo
echo 'REST API - path with stage - /dev/ping'
curl -s "${RESTAPIURL}/dev/ping" && echo
echo 'HTTP API - $default stage - /ping'
curl -s "${HTTPAPIURL}/ping" && echo
echo 'HTTP API - $default stage - /other'
curl -s "${HTTPAPIURL}/other" && echo
```

## Output

```
REST API - root path (without stage) - /ping
healthy

REST API - path with stage - /dev/ping
{"message":"pong","time":"2020-06-08T21:44:38.352Z","service":"pingable-api-rest-api"}

HTTP API - $default stage - /ping
Healthy Connection

HTTP API - $default stage - /other
{"message":"pong","time":"2020-06-08T21:45:12.850Z","service":"pingable-api-http-api"}
```
