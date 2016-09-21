#!/usr/bin/env bash
set -euxo pipefail

# dockcross recommends using the /work directory
cd /work

root="/work"

# Emscripten export symbols
TO_EXPORT=$(node exported.js)

fname="v$LIBARCHIVE_VERSION.tar.gz"
#       libarchive-3.2.0
folder="libarchive-$LIBARCHIVE_VERSION"
tar xvf "$fname"

# Create a symlink for easy use outside of the container
ln -s "$folder" libarchive

cd "$folder"

# By default, the library has some warnings defined as errors.  Because we're
# building for emscripten, these will often get triggered.  Patch em away.
patch -s -p0 < "../$folder.patch"

autoreconf -i
emconfigure ./configure
emmake make

cd .libs

# Do not use a memory-init-file because we don't yet have a way of notifying
# the user when the memory init file is loaded (we don't run main())
emcc -O3 \
  --memory-init-file 0 \
  libarchive.a \
  -o libarchive.js \
  --pre-js "$root/pre.js" \
  -s EXPORTED_FUNCTIONS="$TO_EXPORT" \
  -s RESERVED_FUNCTION_POINTERS=20 \
  -s ASSERTIONS=2
