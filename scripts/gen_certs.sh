#!/usr/bin/env bash
set -euo pipefail

OUT_DIR=${1:-"/workspace/certs"}
mkdir -p "$OUT_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$OUT_DIR/localhost.key" \
  -out "$OUT_DIR/localhost.crt" \
  -subj "/C=IN/ST=Kerala/L=Trivandrum/O=KeralaHealth/OU=IT/CN=localhost"

echo "Self-signed certs created at $OUT_DIR"