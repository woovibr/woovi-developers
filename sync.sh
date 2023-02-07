#!/usr/bin/env bash

cp -r ../openpix-developers/docs/* ./docs/.
cp -r ../openpix-developers/static/* ./static/.
find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/OpenPix/Woovi/g'
find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/openpix.com.br/woovi.com/g'
find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/openpix.com/woovi.com/g'
find docs -type f \( -iname \*.md -o -iname \*.mdx \) | xargs sed -i '' 's/X-Woovi-Signature/X-OpenPix-Signature/g'