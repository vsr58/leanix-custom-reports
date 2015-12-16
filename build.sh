#!/bin/sh
set -e

function build_report {
  echo "building $1"
  cd $1
  gulp
  cd ..
}

build_report bubbles