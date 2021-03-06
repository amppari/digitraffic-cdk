#!/usr/bin/env bash

# Updates all CDK dependencies to the newest version

# exit on any error
set -ex

PACKAGE=${1:-@aws-cdk}

function updateInDirectory() {
    cd "$1"

    if [ -f package.json ]; then
      ncu -f /$PACKAGE/ -u >ncu.log
    fi

    cd ..
}

function updateAllInDirectory() {
  cd "$1"

  for d in $(find ./* -maxdepth 0 -type d); do
    updateInDirectory $d
  done

  cd ..
}

updateInDirectory common
updateInDirectory cloudfront
updateInDirectory elasticsearch
updateInDirectory es-key-figures
updateInDirectory user-management
updateInDirectory status
updateInDirectory swagger-joiner

updateAllInDirectory road
updateAllInDirectory marine