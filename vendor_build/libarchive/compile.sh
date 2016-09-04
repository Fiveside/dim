#!/usr/bin/env bash
set -euxo pipefail

# dockcross recommends using the /work directory
cd /work

fname="v$LIBARCHIVE_VERSION.tar.gz"
#       libarchive-3.2.0
folder="libarchive-$LIBARCHIVE_VERSION"
dlink="https://github.com/libarchive/libarchive/archive/$fname"
wget dlink
tar xvf "$fname"
cd "$folder"

autoreconf -i
emconfigure ./configure
emmake make

cd .libs
emcc -O2 libarchive.a -o libarchive.js -s EXPORTED_FUNCTIONS="['_archive_read_new']"
