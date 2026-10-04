"""Read-only independent RGBA analysis of the immutable first native captures.

Uses Python's standard PNG/zlib primitives; no image rewrite, painter invocation,
browser, build or rig execution. JSON output preserves both original and expanded
contact measurements. It never reclassifies the original native result.
"""
import hashlib
import json
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parent
FIRST = ROOT / "study-native-first"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_png(path):
    encoded = path.read_bytes()
    assert encoded[:8] == b"\x89PNG\r\n\x1a\n"
    offset, compressed, header = 8, bytearray(), None
    while offset < len(encoded):
        length = struct.unpack(">I", encoded[offset:offset + 4])[0]
        kind = encoded[offset + 4:offset + 8]
        payload = encoded[offset + 8:offset + 8 + length]
        crc = struct.unpack(">I", encoded[offset + 8 + length:offset + 12 + length])[0]
        assert zlib.crc32(kind + payload) & 0xffffffff == crc
        if kind == b"IHDR":
            header = struct.unpack(">IIBBBBB", payload)
        elif kind == b"IDAT":
            compressed.extend(payload)
        offset += length + 12
        if kind == b"IEND":
            break
    width, height, depth, color, compression, filtering, interlace = header
    assert (depth, color, compression, filtering, interlace) == (8, 6, 0, 0, 0)
    packed = zlib.decompress(compressed)
    stride = width * 4
    assert len(packed) == (stride + 1) * height
    output, previous, seen = bytearray(), bytearray(stride), {}
    for y in range(height):
        method = packed[y * (stride + 1)]
        seen[str(method)] = seen.get(str(method), 0) + 1
        assert 0 <= method <= 4
        row = bytearray(packed[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            left = row[i - 4] if i >= 4 else 0
            above = previous[i]
            corner = previous[i - 4] if i >= 4 else 0
            if method == 0:
                predictor = 0
            elif method == 1:
                predictor = left
            elif method == 2:
                predictor = above
            elif method == 3:
                predictor = (left + above) // 2
            else:
                estimate = left + above - corner
                a, b, c = abs(estimate - left), abs(estimate - above), abs(estimate - corner)
                predictor = left if a <= b and a <= c else above if b <= c else corner
            row[i] = (row[i] + predictor) & 255
        output.extend(row)
        previous = row
    assert len(output) == width * height * 4
    return {"width": width, "height": height, "sha256": digest(encoded), "filters": seen}, output


def runs(columns):
    result = []
    for column in sorted(columns):
        if result and column == result[-1][1] + 1:
            result[-1][1] = column
        else:
            result.append([column, column])
    return result


def main():
    receipt_bytes = (FIRST / "report.json").read_bytes()
    receipt = json.loads(receipt_bytes)
    assert receipt["status"] == "FAIL"
    asset = receipt["asset"]
    rows = []
    for size in (440, 300, 132):
        actor = next(row for row in receipt["modes"][0]["initial"]["actors"] if row["size"] == size)
        info, baseline = read_png(FIRST / f"desktop-breathe-{size}-rest.png")
        motion_info, motion = read_png(FIRST / f"desktop-breathe-{size}.png")
        assert info["width"] == info["height"] == motion_info["width"] == motion_info["height"] == size
        per_band = []
        for source_rows in (2, 20):
            changed, ink, paw_ink, paw_changed, columns, row_bounds = 0, 0, 0, 0, {}, []
            per_column = {}
            for y in range(size):
                source_y = (y - actor["position"]["y"]) / actor["scale"]["y"] * asset["height"]
                if not asset["contactY"] - source_rows <= source_y <= asset["contactY"] + 2:
                    continue
                row_bounds.append(y)
                for x in range(size):
                    i = (y * size + x) * 4
                    source_x = (x - actor["position"]["x"]) / actor["scale"]["x"] * asset["width"]
                    solid = baseline[i + 3] >= 230
                    differs = baseline[i:i + 4] != motion[i:i + 4]
                    ink += int(solid)
                    changed += int(differs)
                    # Tail is spatially separate from four grounded paws. This
                    # read-only anatomy diagnostic uses the actual lower ink
                    # between source x=.30 and x=.73, not the rig's motion mask.
                    if .30 * asset["width"] <= source_x <= .73 * asset["width"]:
                        paw_ink += int(solid)
                        paw_changed += int(differs)
                        if solid:
                            columns[x] = columns.get(x, 0) + 1
                        per_column[x] = per_column.get(x, 0) + int(differs)
            clusters = []
            for lo, hi in runs(columns):
                clusters.append({"screenX0": lo, "screenX1": hi,
                    "sourceX0": (lo - actor["position"]["x"]) / actor["scale"]["x"] * asset["width"],
                    "sourceX1": (hi - actor["position"]["x"]) / actor["scale"]["x"] * asset["width"],
                    "solidPixels": sum(columns[x] for x in range(lo, hi + 1)),
                    "changedPixelsInSameColumns": sum(per_column.get(x, 0) for x in range(lo, hi + 1))})
            per_band.append({"rowsAboveContact": source_rows, "sourceYRange": [asset["contactY"] - source_rows, asset["contactY"] + 2],
                "screenYRange": [min(row_bounds), max(row_bounds)] if row_bounds else None,
                "solidPixelsWholeBand": ink, "changedPixelsWholeBand": changed,
                "solidPawPixels": paw_ink, "changedPawPixels": paw_changed, "pawColumnClusters": clusters})
        original = next(row for row in receipt["modes"][0]["probes"][0]["outputs"] if row["size"] == size)["delta"]
        assert per_band[0]["solidPixelsWholeBand"] == original["contactInk"]
        assert per_band[0]["changedPixelsWholeBand"] == original["contact"]
        rows.append({"size": size, "restImage": info, "motionImage": motion_info,
                     "nativeMeshPosition": actor["position"], "nativeMeshScale": actor["scale"],
                     "originalReportReproducedExactly": True, "bands": per_band})
    result = {"schema": "cf-civet-first-contact-independent-analysis/v1", "certification": False,
              "originalStatus": "FAIL", "originalReportSha256": digest(receipt_bytes),
              "analysisSourceSha256": digest(Path(__file__).read_bytes()), "asset": asset,
              "method": "Independent PNG chunk CRC/decompression/unfiltering and RGBA comparison, projected through native-reported mesh position/scale; original 2-row metrics must reproduce exactly.",
              "rows": rows, "scope": "Read-only diagnosis of retained first-run PNGs. No new build, native execution, rig result or superseding PASS."}
    output = ROOT / "contact-analysis.json"
    with output.open("x") as handle:
        json.dump(result, handle, indent=2)
        handle.write("\n")
    print(json.dumps({"output": str(output), "rows": rows}, indent=2))


if __name__ == "__main__":
    main()
