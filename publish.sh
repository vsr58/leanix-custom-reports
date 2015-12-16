#!/bin/sh
set -e

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "gh-pages" == "$branch" ]; then
    exit
fi

rm -rf dist && broccoli build 'dist'

echo Updating gh-pages for branch $branch

git checkout gh-pages
git checkout $branch -- dist
mkdir -p $branch
git rm --ignore-unmatch -rf $branch
mv -f dist $branch
git rm -rf --ignore-unmatch dist
git add $branch
git describe --always | git commit -m -

pause
git checkout $branch
