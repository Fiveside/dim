FROM dockcross/browser-asmjs

MAINTAINER Erich Healy <ErichRHealy@gmail.com>

ENV LIBARCHIVE_VERSION=3.2.0

RUN apt update && apt install -y \
  nettle-dev \
  openssl \
  libssl-dev \
  libxml2-dev \
  liblzo2-dev \
  lzop \
  libbz2-dev \
  git

ADD https://github.com/libarchive/libarchive/archive/v3.2.0.tar.gz /work/
COPY compile.sh /work/
COPY exported.js /work/
COPY libarchive-3.2.0.patch /work/
COPY pre.js /work/
