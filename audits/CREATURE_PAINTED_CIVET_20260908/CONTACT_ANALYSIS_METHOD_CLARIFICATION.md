# Explanatory correction to the retained analysis metadata

The `method` text in `contact-analysis.json` says that the original two-row “metrics”
must reproduce exactly. That wording is too broad. The corrected description is:

**Original two-row solid-alpha counts must reproduce exactly. Encoded PNG channel-delta
counts are reported separately from raw GPU-array counts; equality is not required.**

The result fields already make that distinction: `originalAlphaCountsReproducedExactly`
is true, while `encodedPNGMatchesRawChannelDeltaCount` is false at440/300. The native
raw-pixel acceptance continues to require zero changed contact pixels. The source/JSON
artifacts retain their captured bytes and hashes; this explanatory correction required
no diagnostic rerun and changes no result.
