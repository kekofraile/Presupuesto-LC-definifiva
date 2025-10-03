#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "node_modules" ]; then
  echo "==> Instalando dependencias (npm install)"
  npm install
else
  echo "==> Dependencias detectadas, omitiendo npm install"
fi

echo "==> Iniciando servidor de desarrollo (npm run dev)"
npm run dev
