#!/bin/sh
set -e

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "gh-pages" == "$branch" ]; then
    exit
fi

echo Updating gh-pages for branch $branch

git checkout gh-pages
git fetch
git merge origin/gh-pages
git checkout $branch -- dist
git rm --ignore-unmatch -rf $branch
rm -rf $branch
mv -f dist $branch
git rm -rf --ignore-unmatch dist
git add $branch
git describe --always | git commit -m "Publish new $branch version"
git checkout $branch
