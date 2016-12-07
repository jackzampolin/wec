#!/bin/bash

docker build -t gcr.io/influx-perf-testing/wec:latest .
gcloud docker push gcr.io/influx-perf-testing/wec:latest