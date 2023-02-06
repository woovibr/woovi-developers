#!/usr/bin/env bash

cp -r ../openpix-developers/docs/* ./docs/.
find docs -type f | xargs sed -i '' 's/OpenPix/Woovi/g'
find docs -type f | xargs sed -i '' 's/openpix.com.br/woovi.com/g'