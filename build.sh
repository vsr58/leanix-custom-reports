#!/bin/bash
set -e

function build_report {
  echo "building $1"
  cd $1
  npm install
  gulp
  cd ..
  mkdir -p dist/$1
  cp -R $1/dist/* dist/$1
}

npm install

# List of custom reports to be built
#build_report bubbles
#build_report circle
build_report tables
