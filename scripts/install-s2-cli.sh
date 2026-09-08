#!/usr/bin/env bash
# Install the S2 CLI (`s2`) for local s2-lite / demo sync.
#
# Default prefix:
#   $FLOX_ENV_CACHE/s2   (inside flox)
#   $HOME/.s2            (otherwise)
#
# Override with S2_INSTALL_PREFIX=/some/path
# Pin with VERSION=0.42.7 (or s2-cli-v0.42.7)
#
# Does not modify shell profile files — callers should put $PREFIX/bin on PATH.
set -euo pipefail

PREFIX="${S2_INSTALL_PREFIX:-${FLOX_ENV_CACHE:+$FLOX_ENV_CACHE/s2}}"
PREFIX="${PREFIX:-$HOME/.s2}"
BIN_DIR="$PREFIX/bin"
REPO="${S2_REPO:-s2-streamstore/s2}"

if command -v s2 >/dev/null 2>&1; then
  echo "S2 CLI already available: $(command -v s2) ($(s2 --version 2>/dev/null | head -1 || echo ok))"
  exit 0
fi

if [ -x "$BIN_DIR/s2" ]; then
  echo "S2 CLI already installed at $BIN_DIR/s2 (not yet on PATH)"
  exit 0
fi

OS="$(uname -s)"
ARCH="$(uname -m)"

needs_musl() {
  if ! command -v ldd >/dev/null 2>&1; then
    return 1
  fi
  if ldd --version 2>&1 | grep -q musl; then
    return 0
  fi
  local glibc_version major minor
  glibc_version="$(ldd --version 2>/dev/null | sed -n '1s/.* \([0-9][0-9]*\.[0-9][0-9]*\)$/\1/p')"
  glibc_version="${glibc_version:-0.0}"
  major="${glibc_version%%.*}"
  minor="${glibc_version#*.}"
  minor="${minor%%.*}"
  if [ "${major:-0}" -lt 2 ] 2>/dev/null; then
    return 0
  fi
  if [ "${major:-0}" -eq 2 ] && [ "${minor:-0}" -lt 38 ] 2>/dev/null; then
    return 0
  fi
  return 1
}

TARGET=
case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64|amd64)
        if needs_musl; then TARGET="s2-x86_64-unknown-linux-musl.zip"
        else TARGET="s2-x86_64-unknown-linux-gnu.zip"
        fi
        ;;
      aarch64|arm64)
        if needs_musl; then TARGET="s2-aarch64-unknown-linux-musl.zip"
        else TARGET="s2-aarch64-unknown-linux-gnu.zip"
        fi
        ;;
    esac
    ;;
  Darwin)
    case "$ARCH" in
      x86_64|amd64) TARGET="s2-x86_64-apple-darwin.zip" ;;
      aarch64|arm64) TARGET="s2-aarch64-apple-darwin.zip" ;;
    esac
    ;;
esac

if [ -z "$TARGET" ]; then
  echo "Platform not supported for automatic S2 CLI install: $OS $ARCH" >&2
  echo "See https://s2.dev/docs/cli/installation" >&2
  exit 1
fi

for cmd in curl unzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
done

if [ -n "${VERSION:-}" ]; then
  case "$VERSION" in
    s2-cli-v*) TAG="$VERSION" ;;
    v*) TAG="s2-cli-$VERSION" ;;
    *) TAG="s2-cli-v$VERSION" ;;
  esac
else
  TAG="$(
    curl -fsSL "https://github.com/${REPO}/releases?q=s2-cli&expanded=true" \
      | grep -o 'releases/tag/s2-cli-v[^"]*' \
      | head -1 \
      | grep -o 's2-cli-v[^"]*' || true
  )"
  if [ -z "$TAG" ]; then
    echo "Failed to determine latest s2-cli release." >&2
    exit 1
  fi
fi

URL="https://github.com/${REPO}/releases/download/${TAG}/${TARGET}"
mkdir -p "$BIN_DIR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Installing S2 CLI ($TAG) → $BIN_DIR/s2"
curl -fsSL "$URL" -o "$TMP/s2.zip"
unzip -o -d "$BIN_DIR" "$TMP/s2.zip" >/dev/null
chmod a+x "$BIN_DIR/s2"

# Receipt expected by the official CLI self-updater.
printf '{"install_path":"%s"}\n' "$BIN_DIR/s2" >"$BIN_DIR/s2-receipt.json"

echo "Installed: $BIN_DIR/s2"
"$BIN_DIR/s2" --version || true
echo "Add to PATH if needed: export PATH=\"$BIN_DIR:\$PATH\""
