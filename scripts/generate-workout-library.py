#!/usr/bin/env python3
"""Gera o catálogo versionado da Biblioteca G KONG a partir das fichas-fonte."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any


MONTHS = (1, 3, 5, 7, 9, 11)
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

MALE_HYPERTROPHY = {
    1: [1, 2],
    3: [3, 4],
    5: [5, 6, 7, 8],
    7: [9, 10, 11, 12],
    9: [13, 14, 15, 16, 17],
    11: [19, 20, 21, 22, 23],
}

FEMALE_HYPERTROPHY = {
    1: [1, 2],
    3: [3, 4],
    5: [5, 6, 7, 8],
    7: [9, 10, 11],
    9: [12, 13, 14, 15, 16],
    11: [18, 19, 20, 21, 22],
}

DEFINITION = {
    1: [1],
    3: [2],
    5: [3],
    7: [4],
    9: [5, 6, 7],
    11: [8, 9, 10, 11],
}

# Nomes históricos são mantidos no relatório de origem, mas esta tabela aponta
# variações para a demonstração biomecanicamente equivalente do catálogo atual.
ALIASES = {
    "abdome supra c/ anilha": "Abdominal com Carga",
    "abdome supra polia": "Abdominal com Carga",
    "abdome infra": "abdominal infra",
    "abdominal invertido": "Hiperextensão no Chão",
    "abdominal invertido lombar": "Hiperextensão no Chão",
    "abdominal lateral calcanhar": "Abdominal Oblíquo Deitada",
    "abdominal no pulley": "Abdominal com Carga",
    "abdominal remador": "Abdominal Completo — variação 1",
    "abdominal supra": "Abdominal Concentrado",
    "afundo pes em cima do step": "afundo no step",
    "afundo pe da frente em cima do step": "afundo no step",
    "afundo com pe no step": "Afundo no banco com halteres",
    "afundo com halter com pe no step": "Afundo no banco com halteres",
    "agachamento": "Agachamento livre com barra",
    "agachamento livre": "Agachamento livre com barra",
    "agachamento smith ou livre": "Agachamento no Smith",
    "agachamento hack pes juntos": "Agachamento na Máquina Hack",
    "agachamento hack maquina": "agachamento hack",
    "barra fixa negativa": "barra fixa pronada",
    "biceps pulley": "Rosca com Cabo de um Braço",
    "bom dia goodmorning": "Levantamento Terra Romeno",
    "bom dia": "Levantamento Terra Romeno",
    "cadeira isometrica": "Agachamento na Parede com Bola de Exercício",
    "cadeira isometrica 1": "Agachamento na Parede com Bola de Exercício",
    "cadeira flexora": "Cadeira flex",
    "chao": "Hiperextensão no Chão",
    "coice com halter": "triceps coice com halter",
    "coice no cross": "Gluteos Coice nilateral Polia Baixa",
    "coice no cross polia alta": "Gluteos Coice nilateral Polia Baixa",
    "crucifixo": "Crucifixo com halteres",
    "crucifixo no cross": "Crossover com Cabos",
    "crucifixo no crossover baixo": "Crossover com Cabos",
    "crucifixo polia": "Crossover com Cabos",
    "desenvolvimento frente barra": "Desenvolvimento militar com barra",
    "desenvolvimento nuca": "Desenvolvimento militar com barra",
    "drag curl": "Rosca com barra",
    "elevacao de pernas banco inclinado": "Abdominal Infra",
    "elevacao de pernas": "Abdominal Infra",
    "elevacao frontal cross": "Elevação frontal com cabo duplo no cross",
    "extensao de pernas banco inclinado": "Abdominal Infra",
    "extensao de pernas chao": "Abdominal Infra",
    "extensora unilateral": "Cadeira extensora",
    "flexao": "Supino com barra no chão",
    "flexao de bracos": "Supino com barra no chão",
    "flexao com caneleira em pe": "Gluteos Coice nilateral Polia Baixa",
    "flexao de braco apoiado no banco": "Supino inclinado com barra",
    "flexao nordica reversa": "Cadeira extensora",
    "flexao plantar em cima da anilha": "Flexão Plantar com peso corporal",
    "flexao plantar em pe": "Elevação de Panturrilha em Máquina em Pé",
    "flexao plantar gemeos": "Elevação de Panturrilha em Máquina em Pé",
    "flexao plantar leg press": "Elevação de Panturrilha no Leg Press",
    "flexao plantar no gemeos": "Elevação de Panturrilha em Máquina em Pé",
    "flexao plantar no gemeos ou sentado": "Elevação de Panturrilha em Máquina em Pé",
    "flexao plantar no step": "Flexão Plantar com peso corporal",
    "flexao plantar pisando na anilha": "Flexão Plantar com peso corporal",
    "flexao plantar sentado": "Elevação de Panturrilha Sentado com Peso",
    "flexao plantar step": "Flexão Plantar com peso corporal",
    "flexora": "Mesa flex",
    "flexora sentada": "Cadeira flex",
    "flexora unilateral": "Mesa flex unilateral",
    "fly voador": "Voador na Máquina",
    "fly": "Voador na Máquina",
    "frances bilateral": "triceps frances bilateral",
    "frances unilateral": "triceps frances unilateral",
    "gemeos no step": "Flexão Plantar com peso corporal",
    "gemeos sentado": "Elevação de Panturrilha Sentado com Peso",
    "hackmachine": "agachamento hack",
    "infra canivete": "Abdominal Infra",
    "infra no banco extensao de pernas": "Abdominal Infra",
    "infra no banco": "Abdominal Infra",
    "lateral aparelho": "Abdominal Oblíquo Deitada",
    "lateral calcanhar": "Abdominal Oblíquo Deitada",
    "legpress": "leg press 45",
    "legpress 45o": "leg press 45",
    "legpress baixo": "leg press 45",
    "legpress horizontal": "leg press horizontal",
    "mesa flexora": "Mesa flex",
    "mesa flexora unilateral": "Mesa flex unilateral",
    "mountain climber": "Prancha Frontal com elevação de joelhos",
    "obliquo c anilha": "Abdominal Russian Twist",
    "obliquo com anilha": "Abdominal Russian Twist",
    "obliquo cross": "Abdominal Russian Twist",
    "panturrilhas legpress baixo": "panturrilha no leg press",
    "panturrilhas maquina": "Elevação de Panturrilha em Máquina em Pé",
    "panturrilhas smith": "Flexão Plantar no Smith",
    "passada longa": "passada com halteres",
    "polia alta barra": "Tríceps pulley barra",
    "polia alta barra triceps": "Tríceps pulley barra",
    "polia alta corda": "Tríceps pulley corda",
    "polia alta inversa": "Puxada Alta Invertida",
    "puxada aberta na frente": "Puxada Alta",
    "puxada costas": "Puxada alta na polia nuca",
    "puxada costas pulley": "Puxada alta na polia nuca",
    "puxada frente barra neutra": "Puxada Alta com Triângulo",
    "puxada frente pegada neutra": "Puxada Alta com Triângulo",
    "puxada frente pegada supinada": "Puxada Alta Invertida",
    "puxada frontal pegada aberta": "Puxada Alta",
    "puxada frontal pegada pronada": "Puxada Alta",
    "puxada frontal triangulo": "Puxada Alta com Triângulo",
    "pulldown": "Pulldown com corda",
    "pulley alto barra": "Puxada Alta",
    "pulley alto com barra": "Puxada Alta",
    "pullover": "Pullover com Cabo",
    "remada baixa": "Remada Sentada com Corda na Polia",
    "remada curvada cross over": "Remada cruzada no cross",
    "remada curvada": "Remada curvada com barra",
    "remada curvada tronco quase na horizontal": "Remada curvada com barra",
    "remada curvada supinada": "Remada Curvada com Pegada Invertida na Barra",
    "remada cavalinho pegada aberta": "Remada Curvada em T",
    "remada polia baixa": "Remada Sentada com Corda na Polia",
    "remada polia baixa barra reta": "Remada Sentada com Corda na Polia",
    "remada pulley baixo": "Remada Sentada com Corda na Polia",
    "rosca 21": "Rosca com barra",
    "rosca banco scott": "Rosca Scott com barra W",
    "rosca banco scott barra reta": "Rosca Scott com barra W",
    "rosca francesa": "triceps frances bilateral",
    "rosca polia baixa corda": "rosca martelo na polia com corda",
    "rosca scoot barra reta": "Rosca Scott com barra W",
    "rosca scotch": "Rosca Scott com barra W",
    "rotacao externa polia": "rotacao externa na polia",
    "rotacao interna polia": "Rotação externa na polia",
    "supino 45o": "supino inclinado com barra",
    "supino com halter": "supino reto com halteres",
    "supino fechado": "supino com pegada fechada",
    "supino inclinado": "supino inclinado com barra",
    "supino inclinado barra": "supino inclinado com barra",
    "supino pegada fechada": "supino com pegada fechada",
    "supino reto": "supino reto com barra",
    "supino reto com halter": "Supino com halteres",
    "supino reto com halteres": "Supino com halteres",
    "supra com carga": "Abdominal com Carga",
    "supra declinado na maquina ou supra no colchonete": "Abdominal Concentrado",
    "supra no banco declinado": "Abdominal Concentrado",
    "supra no colchonete": "Abdominal Concentrado",
    "sumo": "Agachamento sumo livre",
    "terra convencional": "Levantamento Terra",
    "terra sumo": "Levantamento terra com barra",
    "triceps barra inversa": "Tríceps pulley pegada invertida",
    "triceps corda": "Tríceps pulley corda",
    "triceps corda polia": "Tríceps pulley corda",
    "triceps frances unilateral": "triceps frances unilateral",
    "triceps pulley": "Tríceps pulley barra",
    "triceps supino fechado": "Supino com pegada fechada",
    "voador": "Voador na Máquina",
}


def normalized(value: str) -> str:
    value = unicodedata.normalize("NFD", value)
    value = "".join(character for character in value if unicodedata.category(character) != "Mn")
    value = value.lower().replace("º", "o").replace("°", "o")
    value = re.sub(r"\([^)]*\)", " ", value)
    value = value.replace("c/", "com ").replace("p/", "para ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def split_exercises(value: str, observation: str) -> list[str]:
    clean = value.replace("\n", " ").strip().strip("(")
    if "+" not in clean:
        return [clean]
    # O sinal + nas fontes sempre descreve sequência combinada. Cada movimento
    # vira um item rastreável, com o mesmo volume e método da combinação.
    return [part.strip() for part in clean.split("+") if part.strip()]


def parse_sets(value: str) -> int:
    values = [int(number) for number in re.findall(r"\d+", value)]
    return max(1, min(20, sum(values) if len(values) > 1 else (values[0] if values else 3)))


def parse_rest(value: str) -> int:
    clean = normalized(value)
    if not clean or "sem descanso" in clean:
        return 0
    numbers = re.findall(r"\d+(?:[.,]\d+)?", value)
    if not numbers:
        return 60
    amount = float(numbers[0].replace(",", "."))
    if "min" in clean:
        amount *= 60
    return max(0, min(900, round(amount)))


def method_for(reps: str, observation: str, group_size: int, source_name: str) -> tuple[str, str]:
    context = f"{reps} {observation}".lower()
    notes = observation.strip()
    if "drop" in context:
        return "dropset", notes or "Reduza a carga sem descanso ao fim de cada série."
    if "falha" in context or "máximo" in context or "max" == normalized(reps):
        return "to_failure", notes
    if normalized(source_name) == "rosca 21":
        return "partial_reps", notes or "7 repetições inferiores, 7 superiores e 7 completas."
    if group_size >= 3:
        return "triset", notes or "Execute os três movimentos em sequência."
    if group_size == 2:
        return "biset", notes or "Execute os dois movimentos em sequência."
    descending = [int(number) for number in re.findall(r"\d+", reps)]
    if len(descending) >= 3 and descending == sorted(descending, reverse=True) and len(set(descending)) > 1:
        return "pyramid_ascending", notes
    return "standard", notes


class ExerciseMatcher:
    def __init__(self, catalog: list[dict[str, Any]]) -> None:
        self.catalog = catalog
        self.media = [item for item in catalog if str(item.get("videoUrl") or "").startswith("/exercise-media/")]
        self.by_name: dict[str, list[dict[str, Any]]] = {}
        for item in self.catalog:
            self.by_name.setdefault(normalized(item["name"]), []).append(item)
        self.matches: list[dict[str, Any]] = []

    def match(self, source_name: str) -> dict[str, Any]:
        source = normalized(source_name)
        target = next((normalized(value) for key, value in ALIASES.items() if normalized(key) == source), source)
        exact = self.by_name.get(target, [])
        if exact:
            media_exact = next((candidate for candidate in exact if str(candidate.get("videoUrl") or "").startswith("/exercise-media/")), None)
            if media_exact:
                item = media_exact
                score = 1.0
            else:
                # Quando a definição curada ainda não tem mídia própria, usa a
                # variação visual mais próxima dentro do mesmo grupo muscular.
                primary_muscle = exact[0]["primaryMuscle"]
                candidates = [candidate for candidate in self.media if candidate["primaryMuscle"] == primary_muscle]
                if candidates:
                    item = max(candidates, key=lambda candidate: SequenceMatcher(None, target, normalized(candidate["name"])).ratio())
                    score = SequenceMatcher(None, target, normalized(item["name"])).ratio()
                else:
                    item = exact[0]
                    score = 1.0
        else:
            source_tokens = set(target.split())

            def score(candidate: dict[str, Any]) -> float:
                name = normalized(candidate["name"])
                candidate_tokens = set(name.split())
                sequence = SequenceMatcher(None, target, name).ratio()
                overlap = len(source_tokens & candidate_tokens) / max(1, len(source_tokens | candidate_tokens))
                containment = 1.0 if target in name or name in target else 0.0
                return sequence * 0.55 + overlap * 0.35 + containment * 0.10

            item = max(self.media, key=score)
            score = score(item)
        self.matches.append({
            "source": source_name,
            "target": item["name"],
            "key": item["key"],
            "score": round(score, 3),
        })
        return item


def source_by_suffix(audit: dict[str, Any], suffix: str) -> dict[str, Any]:
    return next(source for source in audit["sources"] if source["canonicalPath"].endswith(suffix))


def rows_for(source: dict[str, Any], table_number: int) -> list[list[str]]:
    table = next(table for table in source["tables"] if table["table"] == table_number)
    rows = table["rows"]
    if rows and normalized(rows[0][0]) in {"exercicio", "exercicio set reps obs intervalo"}:
        rows = rows[1:]
    return [row for row in rows if row and row[0].strip()]


def day_from_table(
    source: dict[str, Any],
    table_number: int,
    label: str,
    matcher: ExerciseMatcher,
    extra_rows: list[list[str]] | None = None,
) -> dict[str, Any]:
    rows = rows_for(source, table_number) + (extra_rows or [])
    exercises: list[dict[str, Any]] = []
    muscles: dict[str, int] = {}
    for row in rows:
        padded = (row + ["", "", "", ""])[:5]
        source_name, sets_value, reps_value, observation, rest_value = padded
        parts = split_exercises(source_name, observation)
        for part in parts:
            catalog = matcher.match(part)
            muscles[catalog["primaryMuscle"]] = muscles.get(catalog["primaryMuscle"], 0) + 1
            method, notes = method_for(reps_value, observation, len(parts), part)
            if len(parts) > 1:
                sequence = " + ".join(parts)
                notes = f"Sequência original: {sequence}. {notes}".strip()
            exercises.append({
                "exerciseKey": catalog["key"],
                "sourceName": part,
                "sets": parse_sets(sets_value),
                "reps": (reps_value.strip() or "10").replace("***", "10–12")[:50],
                "restTime": parse_rest(rest_value),
                "method": method,
                "methodNotes": notes[:500],
            })
    labels = {
        "chest": "Peito", "upper-back": "costas", "lower-back": "lombar",
        "front-deltoids": "ombros", "back-deltoids": "ombros posteriores",
        "biceps": "bíceps", "triceps": "tríceps", "forearm": "antebraços",
        "abs": "abdômen", "obliques": "oblíquos", "quadriceps": "quadríceps",
        "hamstring": "posterior de coxa", "adductor": "adutores",
        "abductors": "abdutores", "gluteal": "glúteos", "calves": "panturrilhas",
    }
    focus = [labels[key] for key, _ in sorted(muscles.items(), key=lambda pair: (-pair[1], pair[0]))[:2] if key in labels]
    return {
        "label": label,
        "name": f"Treino {label} — {' e '.join(focus) if focus else 'condicionamento'}",
        "exercises": exercises,
    }


def metabolic_day(label: str, month: int, matcher: ExerciseMatcher) -> dict[str, Any]:
    variations = {
        1: [("Bike", "12 min"), ("Agachamento com salto e halteres", "10–15"), ("Flexão de braços", "10–15"), ("Prancha frontal", "Máximo")],
        3: [("Bike", "20 min"), ("Agachamento com kettlebell", "10–15"), ("Flexão de braços", "10–15"), ("Abdominal supra com carga", "Máximo")],
        5: [("Bike", "20 min"), ("Agachamento com kettlebell", "10–15"), ("Flexão de braços", "10–15"), ("Elevação lateral com halteres", "15"), ("Prancha frontal", "Máximo")],
        7: [("Bike", "20 min"), ("Agachamento com kettlebell", "10–15"), ("Flexão de braços", "10–15"), ("Mountain climber", "20 s"), ("Prancha frontal", "Máximo")],
        9: [("Bike", "20 min"), ("Agachamento com salto e halteres", "15"), ("Flexão de braços", "15"), ("Mountain climber", "20 s"), ("Prancha frontal", "Máximo")],
        11: [("Bike", "20 min"), ("Agachamento com salto e halteres", "15"), ("Flexão de braços", "15"), ("Mountain climber", "20 s"), ("Prancha frontal", "Máximo")],
    }
    exercises = []
    entries = variations[month]
    for name, reps in entries:
        catalog = matcher.match(name)
        exercises.append({
            "exerciseKey": catalog["key"],
            "sourceName": name,
            "sets": 1 if "min" in reps else (5 if "Prancha" in name else 3),
            "reps": reps,
            "restTime": 20 if "Prancha" in name else 0,
            "method": "circuit",
            "methodNotes": "Circuito metabólico: faça os movimentos em sequência e recupere ao final da volta.",
        })
    return {"label": label, "name": f"Treino {label} — circuito metabólico", "exercises": exercises}


def make_template(
    *, template_id: str, title: str, audience: str, goal: str, level: str,
    month: int | None, days_per_week: int, source_path: str, days: list[dict[str, Any]],
    description: str,
) -> dict[str, Any]:
    return {
        "id": template_id,
        "version": 1,
        "title": title,
        "audience": audience,
        "goal": goal,
        "level": level,
        "month": month,
        "durationWeeks": 8,
        "daysPerWeek": days_per_week,
        "description": description,
        "sourceFiles": [source_path],
        "days": days,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()

    audit = json.loads(args.audit.read_text(encoding="utf-8"))
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    matcher = ExerciseMatcher(catalog)
    templates: list[dict[str, Any]] = []

    male = source_by_suffix(audit, "TREINO-HOMEM-HIPERTROFIA.docx")
    female = source_by_suffix(audit, "TREINO-MULHER-HIPERTROFIA.docx")
    definition = source_by_suffix(audit, "TREINO-PARA-HOMEM-EMAGRECIMENTO-DEFINICAO(EDITAVEL).docx")

    for month in MONTHS:
        extra = rows_for(male, 18) if month == 9 else []
        days = []
        for index, table in enumerate(MALE_HYPERTROPHY[month]):
            append = extra if month == 9 and index in {1, 3} else None
            days.append(day_from_table(male, table, LETTERS[index], matcher, append))
        templates.append(make_template(
            template_id=f"homens-hipertrofia-mes-{month:02d}",
            title=f"Hipertrofia masculina — mês {month:02d}", audience="male", goal="hypertrophy",
            level="beginner" if month <= 3 else ("intermediate" if month <= 7 else "advanced"),
            month=month, days_per_week=5 if len(days) in {2, 3, 5} else 4,
            source_path=male["canonicalPath"], days=days,
            description="Programa progressivo de hipertrofia masculina com rotação semanal de fichas e duração de 8 semanas.",
        ))

        extra = rows_for(female, 17 if month == 9 else 23) if month in {9, 11} else []
        days = []
        for index, table in enumerate(FEMALE_HYPERTROPHY[month]):
            append = extra if month in {9, 11} and index in {1, 3} else None
            days.append(day_from_table(female, table, LETTERS[index], matcher, append))
        templates.append(make_template(
            template_id=f"mulheres-hipertrofia-mes-{month:02d}",
            title=f"Hipertrofia feminina — mês {month:02d}", audience="female", goal="hypertrophy",
            level="beginner" if month <= 3 else ("intermediate" if month <= 7 else "advanced"),
            month=month, days_per_week=5 if len(days) in {2, 3, 5} else 4,
            source_path=female["canonicalPath"], days=days,
            description="Programa progressivo de hipertrofia feminina, estruturado em fichas rotativas para 8 semanas.",
        ))

        days = [day_from_table(definition, table, LETTERS[index], matcher) for index, table in enumerate(DEFINITION[month])]
        metabolic_index = 1 if month < 9 else (3 if month == 9 else 2)
        days.insert(metabolic_index, metabolic_day(LETTERS[metabolic_index], month, matcher))
        for index, day in enumerate(days):
            day["label"] = LETTERS[index]
            day["name"] = re.sub(r"Treino [A-Z]", f"Treino {LETTERS[index]}", day["name"], count=1)
        templates.append(make_template(
            template_id=f"homens-definicao-mes-{month:02d}",
            title=f"Definição masculina — mês {month:02d}", audience="male", goal="definition",
            level="beginner" if month <= 3 else ("intermediate" if month <= 7 else "advanced"),
            month=month, days_per_week=5 if month != 9 else 4,
            source_path=definition["canonicalPath"], days=days,
            description="Treino de definição com musculação, cardio e circuito metabólico, organizado em um ciclo de 8 semanas.",
        ))

    for index in range(1, 5):
        source = source_by_suffix(audit, f"FULLBODY--{index}.docx")
        day = day_from_table(source, 1, "A", matcher)
        day["name"] = "Treino A — corpo inteiro"
        templates.append(make_template(
            template_id=f"mulheres-fullbody-{index:02d}", title=f"Full body feminino {index:02d}",
            audience="female", goal="general", level="beginner" if index <= 2 else "intermediate",
            month=None, days_per_week=3, source_path=source["canonicalPath"], days=[day],
            description="Ficha de corpo inteiro para alternar três vezes por semana, com execução controlada e progressiva.",
        ))

    output = sorted(templates, key=lambda template: template["id"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    unique_matches = {(item["source"], item["target"], item["key"]): item for item in matcher.matches}
    match_report = sorted(unique_matches.values(), key=lambda item: (item["score"], item["source"]))
    args.report.write_text(json.dumps({
        "templateCount": len(output),
        "dayCount": sum(len(template["days"]) for template in output),
        "exerciseCount": sum(len(day["exercises"]) for template in output for day in template["days"]),
        "lowConfidence": [item for item in match_report if item["score"] < 0.58],
        "matches": match_report,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"templates": len(output), "output": str(args.output), "report": str(args.report)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
