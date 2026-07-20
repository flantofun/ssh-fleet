#!/bin/sh
set -eu

echo "host=$(hostname)"
echo "kernel=$(uname -srm)"
echo "uptime=$(uptime)"
