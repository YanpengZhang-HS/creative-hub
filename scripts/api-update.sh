#!/bin/bash
if wget -q http://34.227.168.212:8000/openapi.json -O ./src/network/openapi.json; then
    echo "Get json success"
else
    echo "Get json failed" >&2
    exit 2
fi

if npx @openapitools/openapi-generator-cli generate \
    -i ./src/network/openapi.json \
    -g typescript-axios \
    -o ./src/network --skip-validate-spec; then
    echo "Api update success"
else
    echo "Api update failed" >&2
    exit 3
fi

rm ./src/network/openapi.json