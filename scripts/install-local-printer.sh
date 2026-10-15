#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
RUN_USER="${SUDO_USER:-$(stat -c '%U' "$PROJECT_DIR")}"
RUN_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
BRIDGE_DIR="$RUN_HOME/micro-mec-printer"

if [[ $EUID -ne 0 ]]; then
  exec sudo -- bash "$SCRIPT_DIR/$(basename -- "${BASH_SOURCE[0]}")" "$@"
fi

if [[ -z "$RUN_HOME" || ! -d "$RUN_HOME" ]]; then
  echo "Cannot find the home directory for $RUN_USER." >&2
  exit 1
fi
if [[ ! -f "$BRIDGE_DIR/printer-token.txt" ]]; then
  echo "Printer authorization token is missing: $BRIDGE_DIR/printer-token.txt" >&2
  echo "The bridge cannot print without its existing token." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y bluez rfkill iproute2

NODE_BIN="$(runuser -u "$RUN_USER" -- bash -lc 'command -v node' 2>/dev/null | tail -n 1)"
if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "Node.js is not installed for $RUN_USER. Install Node.js 20 or newer, then rerun this script." >&2
  exit 1
fi

install -d -o "$RUN_USER" -g "$RUN_USER" -m 0755 "$BRIDGE_DIR"
install -o "$RUN_USER" -g "$RUN_USER" -m 0644 "$SCRIPT_DIR/printer-bridge.mjs" "$BRIDGE_DIR/printer-bridge.mjs"
install -o "$RUN_USER" -g "$RUN_USER" -m 0644 "$SCRIPT_DIR/printer-discovery.mjs" "$BRIDGE_DIR/printer-discovery.mjs"
install -o "$RUN_USER" -g "$RUN_USER" -m 0644 "$SCRIPT_DIR/receipt-format.mjs" "$BRIDGE_DIR/receipt-format.mjs"
chown "$RUN_USER:$RUN_USER" "$BRIDGE_DIR/printer-token.txt"
chmod 0600 "$BRIDGE_DIR/printer-token.txt"

# Stop only a bridge process from this installation. Refuse to kill an unknown
# service that happens to own the same port.
mapfile -t PORT_PIDS < <(ss -ltnpH 'sport = :17891' 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)
for pid in "${PORT_PIDS[@]}"; do
  [[ -r "/proc/$pid/cmdline" ]] || continue
  cmdline="$(tr '\0' ' ' < "/proc/$pid/cmdline")"
  if [[ "$cmdline" == *"$BRIDGE_DIR/printer-bridge.mjs"* || "$cmdline" == *"$SCRIPT_DIR/printer-bridge.mjs"* ]]; then
    kill "$pid"
    for _ in {1..30}; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
  else
    echo "Port 17891 is being used by another process (PID $pid). Stop that application, then rerun this installer." >&2
    exit 1
  fi
done

install -d -m 0755 /usr/local/libexec
install -o root -g root -m 0755 "$SCRIPT_DIR/bluetooth-printer-autoconnect.sh" /usr/local/libexec/micro-mec-printer-autoconnect.sh

cat > /etc/systemd/system/micro-mec-printer-autoconnect.service <<'UNIT'
[Unit]
Description=Automatically connect a paired Bluetooth ESC/POS printer
After=bluetooth.service
Wants=bluetooth.service

[Service]
Type=simple
ExecStart=/usr/local/libexec/micro-mec-printer-autoconnect.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/systemd/system/micro-mec-printer-bridge.service <<UNIT
[Unit]
Description=Micro-Mec local Bluetooth receipt printer bridge
After=bluetooth.service micro-mec-printer-autoconnect.service
Wants=bluetooth.service micro-mec-printer-autoconnect.service

[Service]
Type=simple
User=$RUN_USER
Group=dialout
WorkingDirectory=$BRIDGE_DIR
ExecStart=$NODE_BIN $BRIDGE_DIR/printer-bridge.mjs
Restart=on-failure
RestartSec=3
EnvironmentFile=-$RUN_HOME/.config/micro-mec/printer-bridge.env
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now bluetooth.service
systemctl enable --now micro-mec-printer-autoconnect.service
systemctl enable --now micro-mec-printer-bridge.service

echo
echo "Local printer services installed and enabled."
echo "Node: $NODE_BIN"
echo "Bridge: $BRIDGE_DIR"
echo "Bluetooth printer auto-connect: enabled at boot"
echo
systemctl --no-pager --full status micro-mec-printer-bridge.service | sed -n '1,12p'
echo
curl --fail --silent http://127.0.0.1:17891/health || true
echo
