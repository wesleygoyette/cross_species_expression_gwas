suppressPackageStartupMessages({
  if (!requireNamespace("data.table", quietly = TRUE)) {
    install.packages("data.table", repos = "https://cloud.r-project.org")
  }
  library(DBI); library(RSQLite); library(data.table)
})

root <- getwd()
tagbed <- file.path(root, "work", "all_species.hg38.tagged.clustered.bed")
stopifnot(file.exists(tagbed))

# 1) Read tagged+clustered BED: chr  start  end  name  species  cluster
dt <- fread(tagbed, sep="\t", header=FALSE,
            col.names=c("chrom","start","end","name","species","cluster"),
            colClasses=list(character=c("chrom","name","species"),
                            integer=c("start","end","cluster")))

# Parse enh_id from strings like HUMAN_ENH_123  ->  123
dt[, enh_id := as.integer(sub(".*_(\\d+)$", "\\1", name))]

# 2) Support per cluster (unique species)
spc <- dt[, .(support_n = uniqueN(species)), by = cluster]

# Merge and classify: >=2 species => conserved, else gained
lab <- merge(dt[, .(enh_id, cluster)], spc, by="cluster", all.x=TRUE)
lab[, class := ifelse(support_n >= 2, "conserved", "gained")]
lab[, notes := "auto_v3"]
setorder(lab, -support_n)            # prefer higher support
lab <- unique(lab, by="enh_id")
lab <- lab[, .(enh_id, class, support_n, notes)]

# 3) Filter to enhancers that actually exist in the DB
dbfile <- file.path(root, "data", "regland.sqlite")
stopifnot(file.exists(dbfile))
con <- dbConnect(SQLite(), dbfile)
dbExecute(con, "PRAGMA foreign_keys = ON")
valid_ids <- dbGetQuery(con, "SELECT enh_id FROM enhancers")$enh_id
lab <- lab[enh_id %in% valid_ids]

# 4) Replace enhancer_class with filtered labels
dbExecute(con, "DELETE FROM enhancer_class")
dbWriteTable(con, "enhancer_class", lab, append=TRUE)
dbExecute(con, "ANALYZE"); dbExecute(con, "VACUUM")

# 5) Sanity: no orphans?
orph <- dbGetQuery(con, "
  SELECT COUNT(*) AS n_orphans
  FROM enhancer_class ec
  LEFT JOIN enhancers e USING(enh_id)
  WHERE e.enh_id IS NULL
")
print(orph)

# 6) Coverage by species
cov <- dbGetQuery(con, "
  SELECT e.species_id,
         COUNT(*) AS total_enh,
         SUM(ec.enh_id IS NOT NULL) AS labeled,
         COUNT(*) - SUM(ec.enh_id IS NOT NULL) AS unlabeled,
         ROUND(100.0*SUM(ec.enh_id IS NOT NULL)/COUNT(*),2) AS pct_labeled
  FROM enhancers e
  LEFT JOIN enhancer_class ec USING(enh_id)
  WHERE e.species_id IN ('human_hg38','mouse_mm39','pig_susScr11')
  GROUP BY e.species_id
  ORDER BY e.species_id
")
print(cov)

# 7) Class breakdown
cls <- dbGetQuery(con, "
  SELECT class, COUNT(*) AS n
  FROM enhancer_class
  GROUP BY class
  ORDER BY n DESC
")
print(cls)

dbDisconnect(con)
