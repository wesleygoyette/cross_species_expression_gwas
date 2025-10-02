set -euo pipefail

cd "/Users/wesleyg/Desktop/Project Alpha"
mkdir -p work

merge_peaks () {
  local dir="$1" tag="$2" out="$3"
  mapfile -t gz < <(ls "$dir"/*.bed.gz 2>/dev/null || true)
  mapfile -t pl < <(ls "$dir"/*.bed    2>/dev/null || true)
  if (( ${#gz[@]}==0 && ${#pl[@]}==0 )); then
    echo "No peak files found in $dir" >&2; return 1
  fi
  {
    if (( ${#gz[@]} )); then zcat "${gz[@]}"; fi
    if (( ${#pl[@]} )); then cat  "${pl[@]}";  fi
  } \
  | awk 'BEGIN{OFS="\t"}{print $1,$2,$3}' \
  | bedtools sort -i - \
  | bedtools merge \
  | awk -v T="$tag" 'BEGIN{OFS="\t"}{print $1,$2,$3, T "_" NR}' \
  > "$out"
}

# HUMAN: merge brain + heart; add IDs
zcat data/brain_enhancers.bed.gz data/heart_enhancers.bed.gz 2>/dev/null \
| awk 'BEGIN{OFS="\t"}{print $1,$2,$3}' \
| bedtools sort -i - \
| bedtools merge \
| awk 'BEGIN{OFS="\t"}{print $1,$2,$3,"H_ENH_" NR}' > work/human_enhancers.bed

# MOUSE & PIG
merge_peaks "mouse_peaks" "M_ENH" "work/mouse_enhancers.bed"
merge_peaks "pig_peaks"   "P_ENH" "work/pig_enhancers.bed"

echo "Done:"; wc -l work/*_enhancers.bed
