#!/usr/bin/env python3
"""Cria folhas de contato para a revisão visual das fontes em PDF."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("audit", type=Path)
    parser.add_argument("render_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    audit = json.loads(args.audit.read_text(encoding="utf-8"))
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for source in audit["sources"]:
        if source["kind"] != "pdf":
            continue
        prefix = source["sha256"][:12]
        page_paths = sorted(args.render_dir.glob(f"{prefix}-*.png"))
        if not page_paths:
            raise FileNotFoundError(prefix)
        pages = [Image.open(path).convert("RGB") for path in page_paths]
        width = max(page.width for page in pages)
        label_height = 72
        gutter = 24
        sheet = Image.new(
            "RGB",
            (width, label_height + sum(page.height for page in pages) + gutter * (len(pages) - 1)),
            "white",
        )
        draw = ImageDraw.Draw(sheet)
        draw.text((24, 20), source["canonicalPath"], fill="black")
        y = label_height
        for page in pages:
            sheet.paste(page, ((width - page.width) // 2, y))
            y += page.height + gutter
        sheet.save(args.output_dir / f"{prefix}.jpg", quality=90, optimize=True)


if __name__ == "__main__":
    main()
