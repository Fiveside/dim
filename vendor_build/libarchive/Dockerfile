FROM dockcross/browser-asmjs

MAINTAINER Erich Healy <ErichRHealy@gmail.com>

ENV LIBARCHIVE_VERSION=3.2.0

RUN apt update & apt install -y \
  netty-dev \
  openssl \
  libssl-dev \
  libxml2-dev \
  liblzo2-dev \
  lzop \
  libz2-dev \
  wget \
  git

COPY compile.sh /work/
