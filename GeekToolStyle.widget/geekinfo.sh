#!/bin/bash
# GeekTool-style system info - outputs JSON for Übersicht widget
# Based on sysinfo.sh, topCpu.rb, topMem.rb logic

TOP=$(top -l 1)

# CPU: user + system
myCPU=$(echo -n "$TOP" | awk '/CPU usage/ {print $3}' | sed 's/%//')
sysCPU=$(echo -n "$TOP" | awk '/CPU usage/ {print $5}' | sed 's/%//')
[ -z "$myCPU" ] && myCPU=0
[ -z "$sysCPU" ] && sysCPU=0
cpuPct=$(echo "$myCPU + $sysCPU" | bc 2>/dev/null | cut -d. -f1)
[ -z "$cpuPct" ] && cpuPct=0

# Memory
memTotal=$(sysctl -n hw.memsize 2>/dev/null | awk '{print $0/1048576}')
memUsed=$(echo -n "$TOP" | awk '/PhysMem/' | awk '{print $2}' | grep -oE '[0-9]+')
memUnit=$(echo -n "$TOP" | awk '/PhysMem/' | awk '{print $2}' | grep -oE '[MG]')
[ -z "$memTotal" ] && memTotal=0
[ -z "$memUsed" ] && memUsed=0
if [ "$memUnit" = "G" ]; then
  memUsed=$((memUsed * 1024))
fi
memPct=0
[ "$memTotal" -gt 0 ] && memPct=$((100 * memUsed / memTotal))

# Disk (root volume - first line with / at end or matching main volume)
diskPct=$(df 2>/dev/null | awk 'NF>=5 && $6=="/" {gsub(/%/,"",$5); print $5+0; exit}')
[ -z "$diskPct" ] && diskPct=$(df 2>/dev/null | awk 'NF>=5 && $1~/\/dev\// {gsub(/%/,"",$5); print $5+0; exit}')
[ -z "$diskPct" ] && diskPct=0

# Battery
batPct=$(pmset -g batt 2>/dev/null | grep -oE '[0-9]+%' | tr -d '%' | head -1)
[ -z "$batPct" ] && batPct="N/A"

# Battery health (max/design capacity)
maxCap=$(ioreg -w0 -l 2>/dev/null | grep '"AppleRawMaxCapacity" ' | awk '{print $7}')
desCap=$(ioreg -w0 -l 2>/dev/null | grep '"DesignCapacity" ' | awk '{print $7}')
batHealth="N/A"
if [ -n "$maxCap" ] && [ -n "$desCap" ] && [ "$desCap" -gt 0 ]; then
  batHealth=$(echo "scale=0; $maxCap * 100 / $desCap" | bc 2>/dev/null)
fi

# Load average
loadAvg=$(uptime | sed 's/.*load averages: //' | sed 's/.*: //' 2>/dev/null)
[ -z "$loadAvg" ] && loadAvg=$(uptime | cut -d',' -f3- | sed 's/,//g' | cut -d':' -f2- | xargs)
loadAvg=$(echo "$loadAvg" | sed 's/\\/\\\\/g; s/"/\\"/g; s/'"'"'/\\'"'"'/g')

# Uptime
uptimeStr=$(uptime | sed 's/.* up //' | sed 's/,.*//' | xargs)
[ -z "$uptimeStr" ] && uptimeStr="N/A"
uptimeStr=$(echo "$uptimeStr" | sed 's/\\/\\\\/g; s/"/\\"/g')

# Global IP
globalIp=$(dig +short txt ch whoami.cloudflare @1.1.1.1 2>/dev/null | tr -d '"' || echo "N/A")
globalIp=$(echo "$globalIp" | sed 's/\\/\\\\/g; s/"/\\"/g')

# Local IPs
localIps=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | tr '\n' ' ' | xargs)
[ -z "$localIps" ] && localIps="N/A"
localIps=$(echo "$localIps" | sed 's/\\/\\\\/g; s/"/\\"/g')

# Top CPU: up to 7 processes, keep longer command names for UI truncation
topCpuJson="["
count=0
total=0
while IFS= read -r line; do
  cpuVal=$(echo "$line" | awk '{print $1}' | tr ',' '.')
  cmdPart=$(echo "$line" | sed 's/^[[:space:]]*[0-9][0-9]*[.,][0-9][[:space:]]*//')
  if [[ "$cpuVal" =~ ^[0-9]+\.?[0-9]*$ ]] && [ -n "$cmdPart" ]; then
    [ $total -ge 7 ] && break
    isLow=0
    echo "$cpuVal" | grep -qE '^0\.' && isLow=1
    [ $isLow -eq 1 ] && count=$((count+1)) || count=0
    [ $count -ge 3 ] && break
    [ ${#cmdPart} -gt 120 ] && cmdPart="${cmdPart:0:120}..."
    [ "$total" -gt 0 ] && topCpuJson+=","
    cmdEsc=$(echo "$cmdPart" | sed 's/\\/\\\\/g; s/"/\\"/g')
    topCpuJson+="{\"cmd\":\"$cmdEsc\",\"cpu\":\"$cpuVal\"}"
    total=$((total+1))
  fi
done < <(ps -arcwwwxo "%cpu= command=" 2>/dev/null | head -45)
topCpuJson+="]"

# Top Mem: up to 7 processes, keep longer command names for UI truncation
topMemJson="["
count=0
total=0
while IFS= read -r line; do
  rss=$(echo "$line" | awk '{print $1}')
  cmdPart=$(echo "$line" | sed 's/^[[:space:]]*[0-9][0-9]*[[:space:]]*//')
  if [[ "$rss" =~ ^[0-9]+$ ]] && [ "$rss" -gt 0 ] && [ -n "$cmdPart" ]; then
    [ $total -ge 7 ] && break
    [ "$rss" -lt 1024 ] && count=$((count+1)) || count=0
    [ $count -ge 3 ] && break
    if [ "$rss" -gt 1048576 ]; then
      rssVal=$(echo "scale=1; $rss/1048576" | bc 2>/dev/null)
      rssStr="${rssVal}G"
    else
      rssVal=$(echo "scale=1; $rss/1024" | bc 2>/dev/null)
      rssStr="${rssVal}M"
    fi
    [ ${#cmdPart} -gt 120 ] && cmdPart="${cmdPart:0:120}..."
    [ "$total" -gt 0 ] && topMemJson+=","
    cmdEsc=$(echo "$cmdPart" | sed 's/\\/\\\\/g; s/"/\\"/g')
    topMemJson+="{\"cmd\":\"$cmdEsc\",\"rss\":\"$rssStr\"}"
    total=$((total+1))
  fi
done < <(ps -arcwwwxo "rss= command=" -m 2>/dev/null | head -45)
topMemJson+="]"

# Output JSON
echo "{
  \"cpu\": $cpuPct,
  \"mem\": $memPct,
  \"disk\": $diskPct,
  \"battery\": \"$batPct\",
  \"batteryHealth\": \"$batHealth\",
  \"loadAvg\": \"$loadAvg\",
  \"uptime\": \"$uptimeStr\",
  \"globalIp\": \"$globalIp\",
  \"localIps\": \"$localIps\",
  \"topCpu\": $topCpuJson,
  \"topMem\": $topMemJson
}"
