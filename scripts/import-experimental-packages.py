#!/usr/bin/env python3
"""Import the bounded experimental package set into the public site catalogue."""

import importlib.util
import json
import re
import shutil
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/zingzailoo/Documents/codex workspace/elastic_integrations")
CATALOG = SITE / "public/data/custom.json"
SLUGS = [
    "cisco_catalyst_center", "fortinet_fortinac", "fortinet_fortiweb_waf",
    "cequence_bot_defense", "netapp_ontap", "watchguard_edr",
    "cimcor_cimtrak", "dell_cybersense", "dmp_entre", "epic_systems",
    "ibm_maas360", "ibm_openpages", "logonbox", "mobileiron_core",
    "nasuni_file_services", "neo4j_aura", "netscout_arbor_edge_defense",
    "onfido", "oracle_oci_audit", "oracle_oci_cloud_guard", "proofpoint_wbi",
    "sonrai_security", "threatx_waf", "upx_antiddos",
]

spec = importlib.util.spec_from_file_location(
    "catalog_generator", SOURCE / "scripts/generate_public_site_catalog.py"
)
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


def scalar(text, key):
    match = re.search(rf"^{re.escape(key)}:\s*['\"]?(.+?)['\"]?\s*$", text, re.M)
    if not match:
        raise RuntimeError(f"Missing {key}")
    return match.group(1).strip("'\"")


def exported_fields(package):
    fields = []
    seen = set()
    for path in sorted(package.glob("data_stream/*/fields/*.yml")):
        document = path.read_text()
        parsed = generator.parse_field_yaml(document)
        for match in re.finditer(r"^- \{name:\s*([^,}]+)([^}]*)\}$", document, re.M):
            tail = match.group(2)
            field_type = re.search(r",\s*type:\s*([^,}]+)", tail)
            description = re.search(r",\s*description:\s*([^}]+)", tail)
            parsed.append({
                "field": match.group(1).strip(),
                "description": description.group(1).strip() if description else "Field exported by the integration.",
                "type": field_type.group(1).strip() if field_type else "keyword",
            })
        for field in parsed:
            key = (field["field"], field["type"])
            if key not in seen:
                seen.add(key)
                fields.append(field)
    if not fields:
        raise RuntimeError(f"No fields found for {package.name}")
    return fields


records = json.loads(CATALOG.read_text())
records = [record for record in records if record["slug"] not in SLUGS]
for slug in SLUGS:
    package = SOURCE / "packages" / slug
    manifest = (package / "manifest.yml").read_text()
    name = scalar(manifest, "title")
    description = scalar(manifest, "description")
    version = scalar(manifest, "version")
    categories, solutions, capabilities = generator.classify(name, description)
    icon_files = sorted((package / "img").glob("*")) if (package / "img").exists() else []
    icon_files = [p for p in icon_files if p.suffix.lower() in {".svg", ".png", ".jpg", ".jpeg", ".webp"}]
    icon = None
    if icon_files:
        source_icon = icon_files[0]
        icon = source_icon.name
        shutil.copyfile(source_icon, SITE / "public/icons/custom" / f"{slug}{source_icon.suffix.lower()}")
    records.append({
        "slug": slug,
        "name": name,
        "description": description,
        "version": version,
        "created": "30 August 2026",
        "buildDuration": "Best-effort experimental build",
        "status": "Experimental",
        "validationStatus": "Static validated",
        "experimentalReason": "Built without customer sample logs. Validate parsing and transport behavior against real deployment data before production use.",
        "categories": categories,
        "solutions": solutions,
        "capabilities": capabilities,
        "icon": icon,
        "repositoryUrl": f"https://github.com/2gavy/elastic_integrations/tree/main/packages/{slug}",
        "source": "custom",
        "fields": exported_fields(package),
    })

records.sort(key=lambda record: record["name"].casefold())
CATALOG.write_text(json.dumps(records, indent=2) + "\n")
print(f"Imported {len(SLUGS)} experimental packages; catalogue now has {len(records)} records")
