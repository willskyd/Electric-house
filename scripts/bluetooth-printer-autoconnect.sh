#!/usr/bin/env bash
set -u
export PATH=/usr/sbin:/usr/bin:/sbin:/bin

readonly PRINTER_ADDRESS='86:67:7A:92:30:AE'
readonly RETRY_SECONDS=10

modprobe rfcomm >/dev/null 2>&1 || true

while true; do
  if ! bluetoothctl show 2>/dev/null | grep -qE '^[[:space:]]*Powered: yes$'; then
    rfkill unblock bluetooth >/dev/null 2>&1 || true
    bluetoothctl power on >/dev/null 2>&1 || true
    sleep "$RETRY_SECONDS"
    continue
  fi

  device_info=$(bluetoothctl info "$PRINTER_ADDRESS" 2>/dev/null || true)
  if ! grep -qE '^[[:space:]]*Paired: yes[[:space:]]*$' <<<"$device_info"; then
    sleep "$RETRY_SECONDS"
    continue
  fi

  rfcomm_state=$(rfcomm -a 2>/dev/null || true)
  if grep -qiE "^rfcomm0:.*->[[:space:]]+$PRINTER_ADDRESS[[:space:]]+channel[[:space:]]+[0-9]+[[:space:]]+connected\\b" <<<"$rfcomm_state" && [[ -c /dev/rfcomm0 ]]; then
    sleep "$RETRY_SECONDS"
    continue
  fi

  # BlueZ can report a cached Connected: yes state after the underlying link
  # has gone away. Clear that ACL state and create a fresh link before SDP or
  # RFCOMM, otherwise both can fail with EHOSTDOWN despite the cached status.
  echo "Refreshing Bluetooth link to MPT-II ($PRINTER_ADDRESS)."
  timeout --signal=TERM --kill-after=1 5 bluetoothctl disconnect "$PRINTER_ADDRESS" >/dev/null 2>&1 || true
  sleep 1
  connect_result=0
  connect_output=$(timeout --signal=TERM --kill-after=2 10 bluetoothctl connect "$PRINTER_ADDRESS" 2>&1) || connect_result=$?
  device_info=$(bluetoothctl info "$PRINTER_ADDRESS" 2>/dev/null || true)
  if ! grep -qE '^[[:space:]]*Connected: yes[[:space:]]*$' <<<"$device_info"; then
    if [[ -n "$connect_output" ]]; then echo "$connect_output"; fi
    echo "Bluetooth link is not up (connect command exit $connect_result); retrying in ${RETRY_SECONDS}s."
    sleep "$RETRY_SECONDS"
    continue
  fi

  channel_output=$(timeout 10 sdptool search --bdaddr "$PRINTER_ADDRESS" SP 2>/dev/null || true)
  channel=$(awk '
    /^[[:space:]]*Channel[[:space:]]*:/ {
      sub(/^[^:]*:[[:space:]]*/, "")
      gsub(/[[:space:]]/, "")
      print
      exit
    }
  ' <<<"$channel_output")
  if [[ ! "$channel" =~ ^[0-9]{1,2}$ ]] || (( channel < 1 || channel > 30 )); then
    # BlueZ's RFCOMM utility uses SPP channel 1 when no channel is supplied.
    # Try the standard channel when this printer's SDP endpoint is unavailable.
    channel=1
    echo "SDP channel lookup failed; trying the standard SPP RFCOMM channel 1."
  fi

  # rfcomm connect creates /dev/rfcomm0 and owns the SPP link until it drops.
  # bluetoothctl only brings up the bounded ACL link above; rfcomm connect is
  # the operation that creates and owns the RFCOMM tty.
  rfcomm release 0 >/dev/null 2>&1 || true
  rfcomm connect 0 "$PRINTER_ADDRESS" "$channel" || true
  sleep "$RETRY_SECONDS"
done
