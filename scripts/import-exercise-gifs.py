#!/usr/bin/env python3
"""Importa um pacote de GIFs de exercicios e gera a biblioteca otimizada do app."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo


CATEGORY_MUSCLES = {
    "abdomen": "abs",
    "antebraco": "forearm",
    "biceps": "biceps",
    "cardio-academia": "cardio",
    "costas": "upper-back",
    "eretores-da-espinha": "lower-back",
    "gluteo": "gluteal",
    "ombro": "front-deltoids",
    "panturrilha": "calves",
    "peitoral": "chest",
    "pernas": "quadriceps",
    "trapezio": "trapezius",
    "triceps": "triceps",
}

SECONDARY_MUSCLES = {
    "chest": ["triceps", "front-deltoids"],
    "upper-back": ["biceps", "back-deltoids"],
    "lower-back": ["gluteal", "hamstring"],
    "trapezius": ["upper-back", "back-deltoids"],
    "front-deltoids": ["triceps", "trapezius"],
    "back-deltoids": ["upper-back"],
    "biceps": ["forearm"],
    "triceps": [],
    "forearm": [],
    "abs": [],
    "obliques": ["abs"],
    "quadriceps": ["gluteal", "hamstring"],
    "hamstring": ["gluteal", "lower-back"],
    "adductor": ["gluteal", "quadriceps"],
    "abductors": ["gluteal"],
    "gluteal": ["hamstring", "quadriceps"],
    "calves": [],
    "cardio": ["quadriceps", "calves"],
}


@dataclass(frozen=True)
class SourceExercise:
    entry_name: str
    category: str
    display_name: str
    primary_muscle: str
    source_hash: str
    video_url: str


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    ascii_value = "".join(
        character for character in normalized
        if unicodedata.category(character) != "Mn"
    ).lower()
    return re.sub(r"(^-+|-+$)", "", re.sub(r"[^a-z0-9]+", "-", ascii_value))


def clean_display_name(stem: str) -> str:
    name = unicodedata.normalize("NFC", stem).strip()
    name = re.sub(r"gif$", "", name, flags=re.IGNORECASE).strip(" ._-")
    name = re.sub(r"[_]+", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    name = re.sub(r"\s*\((\d+)\)\s*$", r" — variação \1", name)

    replacements = (
        (r"\btriceps\b", "Tríceps"),
        (r"\bbiceps\b", "Bíceps"),
        (r"\bpanturrinha\b", "panturrilha"),
        (r"\bsmith\b", "Smith"),
        (r"\btrx\b", "TRX"),
        (r"\bhalteres\b", "halteres"),
    )
    for pattern, replacement in replacements:
        name = re.sub(pattern, replacement, name, flags=re.IGNORECASE)

    if name.islower() or name.isupper():
        name = name[:1].upper() + name[1:].lower()
        name = re.sub(r"\bsmith\b", "Smith", name, flags=re.IGNORECASE)
        name = re.sub(r"\btrx\b", "TRX", name, flags=re.IGNORECASE)
        name = re.sub(r"\btríceps\b", "Tríceps", name, flags=re.IGNORECASE)
        name = re.sub(r"\bbíceps\b", "Bíceps", name, flags=re.IGNORECASE)
    return name


def infer_primary_muscle(category: str, display_name: str) -> str:
    category_key = slugify(re.sub(r"\s*\(\d+\)\s*$", "", category))
    name = slugify(display_name)

    if category_key == "abdomen" and any(
        token in name for token in ("lateral", "obliqu", "rotacao", "bicicleta", "russian")
    ):
        return "obliques"

    if category_key == "ombro" and any(
        token in name for token in ("posterior", "invers", "reverse", "face-pull", "deltoide-traseiro")
    ):
        return "back-deltoids"

    if category_key == "costas" and any(
        token in name for token in ("lombar", "hiperextens", "extensao-de-tronco", "good-morning")
    ):
        return "lower-back"

    if category_key == "pernas":
        if any(token in name for token in (
            "flexora", "mesa-flex", "cadeira-flex", "flexao-de-joelho", "stiff", "romeno", "posterior",
            "nordic", "nordico", "good-morning", "leg-curl",
        )):
            return "hamstring"
        if any(token in name for token in ("adutora", "aducao")):
            return "adductor"
        if any(token in name for token in ("abdutora", "abducao")):
            return "abductors"
        if any(token in name for token in ("panturr", "plantar", "soleo", "calf")):
            return "calves"
        if any(token in name for token in (
            "glute", "quadril", "hip-thrust", "elevacao-pelvica", "coice",
        )):
            return "gluteal"

    try:
        return CATEGORY_MUSCLES[category_key]
    except KeyError as error:
        raise ValueError(f"Categoria sem mapeamento: {category}") from error


def infer_equipment(display_name: str, muscle: str) -> str:
    name = slugify(display_name)
    if any(token in name for token in ("mesa-flex", "cadeira-flex")):
        return "Máquina"
    if "abdominal-com-carga" in name:
        return "Carga externa"
    if "russian-twist" in name:
        return "Peso corporal ou carga"
    if "remada-curvada-em-t" in name or name.startswith("remada-t"):
        return "Barra T"
    if muscle == "triceps" and "coice" in name:
        return "Halteres"
    if muscle == "calves" and "sentado-com-peso" in name:
        return "Máquina ou carga"
    if "barra-fixa" in name:
        return "Barra fixa"
    if "barra-w" in name:
        return "Barra W"
    if "leg-press" in name:
        return "Leg press"
    if "smith" in name:
        return "Smith"
    if "hack" in name and "agachamento" in name:
        return "Máquina hack"
    if "trx" in name:
        return "TRX"
    if "kettlebell" in name:
        return "Kettlebell"
    if "landmine" in name:
        return "Barra landmine"
    if any(token in name for token in ("maquina", "alavanca", "equipamento")):
        return "Máquina"
    if any(token in name for token in ("polia", "cabo", "crossover", "cross-over", "cross", "pulley", "puxada-alta")):
        return "Polia/cabo"
    if "halter" in name and "barra" in name:
        return "Barra ou halteres"
    if "halter" in name:
        return "Halteres"
    if "barra" in name:
        return "Barra"
    if name == "supino":
        return "Barra e banco"
    if "anilha" in name:
        return "Anilhas"
    if any(token in name for token in ("elastico", "faixa", "miniband")):
        return "Faixa elástica"
    if "bola" in name:
        return "Bola"
    if "corda" in name:
        return "Corda"
    if "elevacao-lateral-deitado" in name:
        return "Halter ou caneleira"
    if "banco" in name:
        return "Banco"
    if muscle == "cardio":
        return "Equipamento cardiovascular"
    return "Peso corporal"


def infer_difficulty(display_name: str, equipment: str) -> str:
    name = slugify(display_name)
    if any(token in name for token in (
        "pistol", "nordic", "nordico", "muscle-up", "handstand", "dragon-flag",
    )):
        return "advanced"
    if equipment in {"Máquina", "Equipamento cardiovascular"}:
        return "beginner"
    return "intermediate"


def instruction_for(display_name: str) -> str:
    return (
        f"Execute {display_name} com postura estável, amplitude confortável e movimento "
        "controlado. Ajuste a carga para manter a técnica durante toda a série."
    )


def sha256_entry(archive: ZipFile, entry: ZipInfo) -> str:
    digest = hashlib.sha256()
    with archive.open(entry) as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def convert_gif(
    archive_path: Path,
    entry_name: str,
    output_path: Path,
    ffmpeg: Path,
) -> int:
    if output_path.exists() and output_path.stat().st_size > 1_000:
        return output_path.stat().st_size

    with ZipFile(archive_path) as archive:
        source = archive.read(entry_name)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(".tmp.mp4")
    result = subprocess.run(
        [
            str(ffmpeg), "-hide_banner", "-loglevel", "error", "-y",
            "-f", "gif", "-i", "pipe:0", "-an",
            "-vf", "fps=12,scale=720:720:force_original_aspect_ratio=decrease:force_divisible_by=2",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(temporary_path),
        ],
        input=source,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        temporary_path.unlink(missing_ok=True)
        error = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"Falha ao converter {entry_name}: {error}")
    if not temporary_path.exists() or temporary_path.stat().st_size <= 1_000:
        temporary_path.unlink(missing_ok=True)
        raise RuntimeError(f"Arquivo convertido inválido: {entry_name}")

    temporary_path.replace(output_path)
    return output_path.stat().st_size


def render_typescript(records: list[dict[str, object]], asset_count: int) -> str:
    serialized = json.dumps(records, ensure_ascii=False, indent=2)
    return f"""// Arquivo gerado por scripts/import-exercise-gifs.py. Não edite manualmente.
export interface ImportedExerciseDefinition {{
  key: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  videoUrl: string;
  sourceName: string;
}}

export const IMPORTED_EXERCISE_SOURCE_COUNT = {len(records)};
export const IMPORTED_EXERCISE_ASSET_COUNT = {asset_count};

export const IMPORTED_EXERCISES = {serialized} satisfies ImportedExerciseDefinition[];
"""


def resolve_ffmpeg(value: str | None) -> Path:
    candidate = value or shutil.which("ffmpeg")
    if not candidate:
        raise FileNotFoundError("FFmpeg não encontrado. Informe --ffmpeg com o caminho do executável.")
    path = Path(candidate).resolve()
    if not path.is_file():
        raise FileNotFoundError(f"FFmpeg não encontrado em {path}")
    return path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("--ffmpeg")
    parser.add_argument("--workers", type=int, default=min(4, os.cpu_count() or 1))
    parser.add_argument("--output", type=Path, default=Path("public/exercise-media"))
    parser.add_argument(
        "--catalog",
        type=Path,
        default=Path("src/lib/exercises/imported-media.ts"),
    )
    args = parser.parse_args()

    archive_path = args.archive.resolve()
    output_root = args.output.resolve()
    public_root = (Path.cwd() / "public").resolve()
    catalog_path = args.catalog.resolve()
    ffmpeg = resolve_ffmpeg(args.ffmpeg)
    if not archive_path.is_file():
        raise FileNotFoundError(archive_path)
    if args.workers < 1 or args.workers > 8:
        raise ValueError("--workers deve estar entre 1 e 8")
    try:
        output_root.relative_to(public_root)
    except ValueError as error:
        raise ValueError(f"A mídia precisa ser gerada dentro de {public_root}") from error

    with ZipFile(archive_path) as archive:
        gif_entries = sorted(
            (
                entry for entry in archive.infolist()
                if not entry.is_dir() and entry.filename.lower().endswith(".gif")
            ),
            key=lambda entry: entry.filename.casefold(),
        )
        if not gif_entries:
            raise ValueError("O pacote não contém GIFs.")

        hashes: dict[str, str] = {}
        for index, entry in enumerate(gif_entries, start=1):
            hashes[entry.filename] = sha256_entry(archive, entry)
            if index % 100 == 0:
                print(f"Auditados {index}/{len(gif_entries)} GIFs", flush=True)

    canonical_by_hash: dict[str, tuple[str, Path]] = {}
    exercises: list[SourceExercise] = []
    for entry in gif_entries:
        parts = PurePosixPath(entry.filename).parts
        if len(parts) < 3:
            raise ValueError(f"Caminho inesperado no ZIP: {entry.filename}")
        category = parts[-2]
        display_name = clean_display_name(PurePosixPath(entry.filename).stem)
        primary_muscle = infer_primary_muscle(category, display_name)
        source_hash = hashes[entry.filename]

        canonical = canonical_by_hash.get(source_hash)
        if canonical is None:
            category_slug = slugify(re.sub(r"\s*\(\d+\)\s*$", "", category))
            asset_name = f"{slugify(display_name)}-{source_hash[:8]}.mp4"
            output_path = (output_root / category_slug / asset_name).resolve()
            try:
                output_path.relative_to(output_root)
            except ValueError as error:
                raise ValueError(f"Destino inseguro: {output_path}") from error
            video_url = "/" + output_path.relative_to(public_root).as_posix()
            canonical_by_hash[source_hash] = (entry.filename, output_path)
        else:
            canonical_entry, canonical_path = canonical
            video_url = "/" + canonical_path.relative_to(public_root).as_posix()

        exercises.append(SourceExercise(
            entry_name=entry.filename,
            category=category,
            display_name=display_name,
            primary_muscle=primary_muscle,
            source_hash=source_hash,
            video_url=video_url,
        ))

    completed = 0
    total_bytes = 0
    print(
        f"Convertendo {len(canonical_by_hash)} animações únicas com {args.workers} processos...",
        flush=True,
    )
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(convert_gif, archive_path, entry_name, output_path, ffmpeg): output_path
            for entry_name, output_path in canonical_by_hash.values()
        }
        for future in as_completed(futures):
            total_bytes += future.result()
            completed += 1
            if completed % 25 == 0 or completed == len(futures):
                print(f"Convertidas {completed}/{len(futures)} animações", flush=True)

    records: list[dict[str, object]] = []
    for exercise in exercises:
        equipment = infer_equipment(exercise.display_name, exercise.primary_muscle)
        source_id = hashlib.sha256(exercise.entry_name.encode("utf-8")).hexdigest()[:10]
        records.append({
            "key": f"media:{exercise.primary_muscle}:{slugify(exercise.display_name)}:{source_id}",
            "name": exercise.display_name,
            "primaryMuscle": exercise.primary_muscle,
            "secondaryMuscles": SECONDARY_MUSCLES[exercise.primary_muscle],
            "equipment": equipment,
            "difficulty": infer_difficulty(exercise.display_name, equipment),
            "instructions": instruction_for(exercise.display_name),
            "videoUrl": exercise.video_url,
            "sourceName": PurePosixPath(exercise.entry_name).name,
        })

    catalog_path.parent.mkdir(parents=True, exist_ok=True)
    catalog_path.write_text(
        render_typescript(records, len(canonical_by_hash)),
        encoding="utf-8",
        newline="\n",
    )
    print(
        json.dumps({
            "sources": len(records),
            "uniqueAssets": len(canonical_by_hash),
            "outputBytes": total_bytes,
            "catalog": str(catalog_path),
        }, ensure_ascii=False),
        flush=True,
    )


if __name__ == "__main__":
    main()
