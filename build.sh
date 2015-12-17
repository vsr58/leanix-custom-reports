#!/bin/sh
set -e

function build_report {
  echo "building $1"
  cd $1
  gulp
  cd ..
}

# List of custom reports to be built
build_report bubbles


rm -rf dist && broccoli build 'dist'