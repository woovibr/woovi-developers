#!/usr/bin/env bash
set -x #echo on

if [ -d ../openpix-developers ]; then
  dir='openpix-developers'
else
  dir='developers'
fi

rsync -av --delete "../$dir/docs" ./ --exclude docs/ecommerce/magento1
rsync -av --delete "../$dir/static" ./ --exclude static/magento1

find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/OpenPix/Woovi/g'
find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/openpix.com.br/woovi.com/g'
find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/openpix.com/woovi.com/g'
find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/X-Woovi-Signature/X-OpenPix-Signature/g'