#!/usr/bin/env bash
set -euxo pipefail

# Expect the following environment variables to already be defined:
# LIBARCHIVE_VERSION - version of libarchive to use. ex: 3.2.0
# ZLIB_VERSION - version of zlib to use. ex: 1.2.8

# dockcross recommends using the /work directory
cd /work

root="/work"

# Emscripten export symbols
TO_EXPORT=$(node exported.js)

# Set some useful environment variables
PRE_JS="$root/pre.js"

ZLIB_ROOT="$root/zlib-$ZLIB_VERSION"
ZLIB_PACKAGE="$root/zlib-$ZLIB_VERSION.tar.gz"
ZLIB_INCLUDE="$ZLIB_ROOT"
ZLIB_LINK_FOLDER="$ZLIB_ROOT"

LIBARCHIVE_ROOT="$root/libarchive-$LIBARCHIVE_VERSION"
LIBARCHIVE_PATCH="$root/libarchive-$LIBARCHIVE_VERSION.patch"
# LIBARCHIVE_LINK="$root/libarchive"
LIBARCHIVE_PACKAGE="$root/v$LIBARCHIVE_VERSION.tar.gz"
LIBARCHIVE_LINK_FOLDER="$LIBARCHIVE_ROOT/.libs"


# Build dependencies.
# build zlib against emscripten
tar xvf "$ZLIB_PACKAGE"
pushd "$ZLIB_ROOT"
emcmake cmake .
emmake make
popd

# libmd
# https://www.hadrons.org/software/libmd/
# port this to remove __P macro (does nothing), __BEGIN_DECLS, __END_DECLS, and sys/cdefs.h
# this allows it to build against musl

# nettle
# https://ftp.gnu.org/gnu/nettle/nettle-3.2.tar.gz
# https://git.lysator.liu.se/nettle/nettle/repository/archive.zip?ref=nettle_3.2_release_20160128
# Edit configure file to remove -ggdb3
# emconfigure ./configure --disable-openssl --disable-assembler
# need to move headers to their own folder structure /<whatever>/nettle/includes.h
# and mark that for inclusion instead

# finally, build libarchive
# By default, the library has some warnings defined as errors.  Because we're
# building for emscripten, these will often get triggered.  Patch em away.
tar xvf "$LIBARCHIVE_PACKAGE"
pushd "$LIBARCHIVE_ROOT"
patch -s -p0 < "$LIBARCHIVE_PATCH"
autoreconf -i
CFLAGS="-I$ZLIB_INCLUDE" \
  CPPFLAGS="-I$ZLIB_INCLUDE" \
  CXXFLAGS="-I$ZLIB_INCLUDE" \
  LDFLAGS="-L$ZLIB_LINK_FOLDER -static" \
  emconfigure ./configure --disable-bsdcat --disable-bsdtar --disable-bsdcpio
emmake make
popd

# compile to emscripten module.
# Do not use a memory-init-file because we don't yet have a way of notifying
# the user when the memory init file is loaded (we don't run main())
emcc -O3 --memory-init-file 0 \
  "$LIBARCHIVE_ROOT/.libs/libarchive.a" \
  "$ZLIB_ROOT/libz.a" \
  -o "/work/libarchive.js" \
  --pre-js "$PRE_JS" \
  -s EXPORTED_FUNCTIONS="$TO_EXPORT" \
  -s RESERVED_FUNCTION_POINTERS=20 \
  -s ASSERTIONS=2

# fname="v$LIBARCHIVE_VERSION.tar.gz"
# #       libarchive-3.2.0
# folder="libarchive-$LIBARCHIVE_VERSION"
# tar xvf "$fname"

# # Create a symlink for easy use outside of the container
# ln -s "$folder" libarchive

# cd "$folder"

# patch -s -p0 < "../$folder.patch"

# autoreconf -i
# emconfigure ./configure
# emmake make

# cd .libs

# Scratchpad!
# libarchive cmake line
# emcmake cmake \
# -DENABLE_LibGCC=false \
# -DENABLE_PCREPOSIX=false \
# -DENABLE_ACL=false \
# -DLIBMD_LIBRARY=/work/libmd/src/.libs/libmd.a \
# -DZLIB_LIBRARY=/work/zlib-1.2.8/libz.a \
# -DZLIB_INCLUDE_DIR=/work/zlib-1.2.8 \
# -DNETTLE_INCLUDE_DIR=/work/nettle-3.2/nettle/ \
# -DNETTLE_LIBRARY=/work/nettle-3.2/nettle/libnettle.a \
# .
#
# CFLAGS="-I/work/zlib-1.2.8" \
# CPPFLAGS="-I/work/zlib-1.2.8" \
# CXXFLAGS="-I/work/zlib-1.2.8" \
# LDFLAGS="-L/work/zlib-1.2.8 -static" \
# emconfigure ./configure --disable-bsdcat --disable-bsdtar --disable-bsdcpio
#
#
# zlib line
# emcmake cmake .
#
#
# apt-get install libc6-dev-i386 (required for libmd)
# god how the hell do you build this mess (depends on sys/cdefs.h, which appears to be missing?)
# need to port libmd to musl
