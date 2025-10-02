#!/usr/bin/env bash
set -euo pipefail

# Requires: jq + curl
command -v jq >/dev/null || { echo "jq is required (brew install jq)"; exit 1; }
command -v curl >/dev/null || { echo "curl is required"; exit 1; }

BASE="https://www.ebi.ac.uk/gwas/rest/api"
OUT="data/gwas_hg38.tsv"
TMP="$(mktemp)"
GENES=("FOXP2" "ALB" "HNF4A" "PCSK9" "BDNF")   # add more if you like

mkdir -p data
echo -e "rsid\tchrom\tpos\ttrait\tpval" > "$OUT"

urlencode() { printf '%s' "$1" | jq -sRr @uri; }

fetch_gene() {
  local gene="$1"
  local enc; enc="$(urlencode "$gene")"
  local url="${BASE}/associations?geneName=${enc}&size=1000"
  local prev_url=""
  local page=1

  echo "Fetching ${gene}…" >&2

  while :; do
    # avoid infinite loops on broken pagination
    if [[ "$url" == "$prev_url" ]]; then
      echo "  stopping: next URL repeated on page $page" >&2
      break
    fi
    prev_url="$url"

    # fetch with timeouts; one retry on failure
    if ! resp=$(curl -sS -L --fail --connect-timeout 15 --max-time 60 "$url"); then
      echo "  curl failed, retrying…" >&2
      sleep 2
      resp=$(curl -sS -L --fail --connect-timeout 15 --max-time 60 "$url") || {
        echo "  giving up on ${gene}" >&2
        break
      }
    fi

    # count associations on this page
    n=$(printf '%s' "$resp" | jq '._embedded.associations | length // 0')
    echo "  page $page: $n records" >&2
    [[ "$n" -eq 0 ]] && break

    # append rows
    printf '%s' "$resp" | jq -r '
      ._embedded.associations // [] | .[] |
      {
        rsid: (.variant.rsId // empty),
        pval: (.pvalue // empty),
        trait: ( ( .trait.trait // .traitReported ) // empty ),
        chrom: ( ( .hm_chromosome // .chromosomeName ) // empty ),
        pos: ( ( .hm_pos // .chromosomePosition ) // empty )
      } |
      select(.rsid != "" and .chrom != "" and .pos != "") |
      .chrom |= (if startswith("chr") then . else "chr"+. end) |
      [ (.rsid | ascii_downcase), .chrom, (.pos|tostring), (.trait|tostring), (.pval|tostring) ] |
      @tsv
    ' >> "$OUT"

    # next link
    next=$(printf '%s' "$resp" | jq -r '._links.next.href // ""')
    [[ -z "$next" ]] && break
    url="$next"
    page=$((page+1))
  done
}

for g in "${GENES[@]}"; do
  fetch_gene "$g"
done

# Deduplicate by rsid (keep smallest p-value)
{ head -n1 "$OUT"; tail -n +2 "$OUT" | LC_ALL=C sort -t$'\t' -k1,1 -k5,5g | awk -F'\t' '!seen[$1]++'; } > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
echo "Wrote $(($(wc -l < "$OUT")-1)) rows to $OUT"
