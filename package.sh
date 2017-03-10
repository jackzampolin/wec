#!/bin/bash

REGISTRY=gcr.io
REPO=influx-perf-testing

docker build -t $REGISTRY/$REPO/wec:latest .
gcloud docker push $REGISTRY/$REPO/wec:latest