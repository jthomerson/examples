# API Gateway HTTP API removes `access-control-allow-origin` if `origin` header is not present

## Overview

When converting from API Gateway REST APIs to HTTP APIs, we encountered what appears to be
a defect in API Gateway HTTP APIs. APIGW will remove your `Access-Control-Allow-Origin`
response header if there is no `Origin` request header.

APIGW should not remove the response header. True, you typically need an `Origin` request
header to properly set the `Access-Control-Allow-Origin` response header, but in some
cases your API sends `*` as the ACAO value, or can default to a specific domain if no
`Origin` request header is supplied. In any event, it seems counterintuitive that APIGW
would modify the response that I gave it from my Lambda function; it shouldn't do that.

Noteworthy, too, is that if you set up an APIGW HTTP API behind CloudFront and _do not_
forward the `Origin` request header (and thus you are not using the `Origin` request
header in your cache keys), then a user who curls your API or calls it from an app (and
thus does not send an `Origin` request header) can poison your CloudFront cache - later
requests that come in from a website _with_ an `Origin` request header will get the cached
response that has no `Access-Control-Allow-Origin` response header because APIGW stripped
it when responding to the earlier no-origin request. Of course, if you are varying your
response `Access-Control-Allow-Origin` based on the request `Origin` request header , then
you'll need to pass through the `Origin` request header and use it in your cache key
anyway. But, if you're not varying your response based on that header, then you otherwise
would not need to include it in the cache key or pass it to the backend API.

Thanks to @onebytegone for discovering this and putting together the bulk of this
example.


## Steps to Reproduce

```shell
git clone git@github.com:jthomerson/examples.git
cd examples/aws-apigw-http-api-acao
sls deploy --region us-east-1 --stage dev
RESTAPIID=$(aws --region us-east-1 apigateway get-rest-apis --query "items[?name=='dev-cors-api'] | [0].id" --output text)
RESTAPIURL="https://${RESTAPIID}.execute-api.us-east-1.amazonaws.com"
HTTPAPIID=$(aws --region us-east-1 apigatewayv2 get-apis --query "Items[?Name=='dev-cors-api'] | [0].ApiId" --output text)
HTTPAPIURL="https://${HTTPAPIID}.execute-api.us-east-1.amazonaws.com"
echo 'REST API - no Origin header'
curl -s -D - -o /dev/null "${RESTAPIURL}/dev/endpoint" | grep -i 'access-control-allow-origin'
echo 'REST API - with Origin header'
curl -s -D - -o /dev/null "${RESTAPIURL}/dev/endpoint" | grep -i 'access-control-allow-origin'
echo 'HTTP API - no Origin header'
curl -s -D - -o /dev/null "${HTTPAPIURL}/endpoint" | grep -i 'access-control-allow-origin'
echo 'HTTP API - with Origin header'
curl -s -D - -o /dev/null -H 'origin: https://www.example.com' "${HTTPAPIURL}/endpoint" | grep -i 'access-control-allow-origin'
```

## Output

```
REST API - no Origin header
access-control-allow-origin: *

REST API - with Origin header
access-control-allow-origin: *

HTTP API - no Origin header

HTTP API - with Origin header
access-control-allow-origin: *
```
