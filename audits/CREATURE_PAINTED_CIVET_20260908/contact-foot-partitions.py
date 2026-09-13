"""Read-only per-foot coverage of the retained first native PNGs."""
import hashlib
import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("contact_analysis", root / "contact-analysis.py")
decoder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(decoder)
report = json.loads((root / "study-native-first/report.json").read_bytes())
asset = report["asset"]
partitions = [(270, 325), (325, 385), (428, 486), (486, 548)]
rows = []
for size in (440, 300, 132):
    actor = next(row for row in report["modes"][0]["initial"]["actors"] if row["size"] == size)
    info, image = decoder.read_png(root / f"study-native-first/desktop-breathe-{size}-rest.png")
    feet = [{"sourceX0": lo, "sourceX1": hi, "solid": 0} for lo, hi in partitions]
    for y in range(size):
        source_y = (y - actor["position"]["y"]) / actor["scale"]["y"] * asset["height"]
        if not asset["contactY"] - 20 <= source_y <= asset["contactY"] + 2:
            continue
        for x in range(size):
            if image[(y * size + x) * 4 + 3] < 230:
                continue
            source_x = (x - actor["position"]["x"]) / actor["scale"]["x"] * asset["width"]
            for foot in feet:
                if foot["sourceX0"] <= source_x < foot["sourceX1"]:
                    foot["solid"] += 1
    rows.append({"size": size, "imageSha256": info["sha256"], "feet": feet})
result = {"schema": "cf-civet-four-paw-coverage-analysis/v1", "certification": False,
          "sourceYRange": [393, 415], "basis": "Four separately visible 440px and132px rest paw clusters, projected using native-recorded mesh transforms. At300px the two front clusters touch; these unchanged source partitions preserve independent ink counts.",
          "rows": rows, "allTwelvePartitionsContainSolidInk": all(foot["solid"] > 0 for row in rows for foot in row["feet"]),
          "analysisSourceSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          "originalNativeStatus": "FAIL", "zeroChangedPixelCriterion": "unchanged"}
with (root / "contact-foot-partitions.json").open("x") as output:
    json.dump(result, output, indent=2)
    output.write("\n")
print(json.dumps(result, indent=2))
