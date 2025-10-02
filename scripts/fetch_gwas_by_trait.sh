#!/usr/bin/env bash
set -euo pipefail
command -v jq >/dev/null || { echo "Need jq (brew install jq)"; exit 1; }
command -v curl >/dev/null || { echo "Need curl"; exit 1; }

BASE="https://www.ebi.ac.uk/gwas/rest/api"
OUT="data/gwas_hg38.tsv"
mkdir -p data
echo -e "rsid\tchrom\tpos\ttrait\tpval" > "$OUT"

urlenc(){ printf '%s' "$1" | jq -sRr @uri; }
fetch_trait(){
  local t="$1"; local enc; enc="$(urlenc "$t")"
  local url="${BASE}/associations?efoTrait=${enc}&size=2000"
  echo "Fetching ${t}…"
  resp=$(curl -sS -L --fail --connect-timeout 15 --max-time 60 \
         -H "User-Agent: curl-gwas/1.0" "$url") || { echo "  skip ${t}"; return 0; }
  printf '%s' "$resp" | jq -r '
    ._embedded.associations // [] | .[] |
    { rsid:(.variant.rsId//empty),
      pval:(.pvalue//empty),
      trait:( ( .trait.trait // .traitReported ) // empty ),
      chrom:( ( .hm_chromosome // .chromosomeName ) // empty ),
      pos:( ( .hm_pos // .chromosomePosition ) // empty ) } |
    select(.rsid!="" and .chrom!="" and .pos!="") |
    .chrom |= (if startswith("chr") then . else "chr"+. end) |
    [ (.rsid|ascii_downcase), .chrom, (.pos|tostring), (.trait|tostring), (.pval|tostring) ] |
    @tsv' >> "$OUT"
}

# Alcohol
fetch_trait "alcohol consumption"
fetch_trait "alcohol dependence"
fetch_trait "alcohol use disorder"
fetch_trait "drinks per week"

# BMI / adiposity
fetch_trait "body mass index"
fetch_trait "obesity"
fetch_trait "waist-hip ratio"

# Inflammation
fetch_trait "C-reactive protein"
fetch_trait "high sensitivity C-reactive protein"
fetch_trait "interleukin-6 measurement"
fetch_trait "fibrinogen measurement"
fetch_trait "white blood cell count"
fetch_trait "erythrocyte sedimentation rate"

# Deduplicate per rsid, keep smallest p
{ head -n1 "$OUT"; tail -n +2 "$OUT" | LC_ALL=C sort -t$'\t' -k1,1 -k5,5g | awk -F'\t' '!seen[$1]++'; } > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
echo "Wrote $(($(wc -l < "$OUT")-1)) rows to $OUT"
