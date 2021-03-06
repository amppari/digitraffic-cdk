#!/usr/bin/env bash

# Runs all tests or tests for a specific workspace

# exit on any error
set -e

if [ -z "$1" ]
then
  yarn workspace cloudwatch-logs-recipient run test
  yarn workspace swagger-joiner run test
else
  yarn workspace $1 run test
fi
