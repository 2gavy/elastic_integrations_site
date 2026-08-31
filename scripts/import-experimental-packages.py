#!/usr/bin/env python3
"""Import the bounded experimental package set into the public site catalogue."""

import importlib.util
import json
import os
import re
import shutil
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get(
    "INTEGRATIONS_SOURCE",
    "/Users/zingzailoo/Documents/codex workspace/elastic_integrations",
))
CATALOG = SITE / "public/data/custom.json"
ALL_SLUGS = [
    "cisco_catalyst_center", "fortinet_fortinac", "fortinet_fortiweb_waf",
    "cequence_bot_defense", "netapp_ontap", "watchguard_edr",
    "cimcor_cimtrak", "dell_cybersense", "dmp_entre", "epic_systems",
    "ibm_maas360", "ibm_openpages", "logonbox", "mobileiron_core",
    "nasuni_file_services", "neo4j_aura", "netscout_arbor_edge_defense",
    "onfido", "oracle_oci_audit", "oracle_oci_cloud_guard", "proofpoint_wbi",
    "sonrai_security", "threatx_waf", "upx_antiddos",
    "dynatrace", "rapid7_insightidr", "logicmonitor",
    "exabeam_threat_center", "appdynamics_controller_audit", "saviynt_eic",
    "orca_security", "grafana_enterprise_audit", "veza", "securityscorecard",
    "sciencelogic_sl1", "microsoft_entra_id_graph",
]
PACKAGE_BY_SLUG = {
    "grafana_enterprise_audit": "grafana",
}
REPOSITORY_PATH_OVERRIDES = {
    "microsoft_entra_id_graph": "microsoft_entra_id_graph",
}
TITLE_OVERRIDES = {
    "grafana_enterprise_audit": "Grafana Enterprise Audit",
}
OFFICIAL_ICONS = {
    "cequence_bot_defense": "favicon.ico",
    "cimcor_cimtrak": "favicon.png",
    "cisco_catalyst_center": "favicon.ico",
    "dell_cybersense": "favicon.ico",
    "dmp_entre": "favicon.ico",
    "epic_systems": "favicon.ico",
    "fortinet_fortinac": "favicon.ico",
    "fortinet_fortiweb_waf": "favicon.ico",
    "ibm_maas360": "apple-touch-icon-152x152.png",
    "ibm_openpages": "apple-touch-icon-152x152.png",
    "logonbox": "LogonBox-Transparent.png",
    "mobileiron_core": "ivanti-favicon-152.png",
    "nasuni_file_services": None,
    "neo4j_aura": "favicon-194x194.png",
    "netapp_ontap": None,
    "netscout_arbor_edge_defense": "NS_LOGO_COL_POS_RGB.svg",
    "onfido": None,
    "oracle_oci_audit": "favicon.ico",
    "oracle_oci_cloud_guard": "favicon.ico",
    "proofpoint_wbi": "favicon.svg",
    "sonrai_security": "cropped-Sonrai-Favicon-32x32.png",
    "threatx_waf": "apple-touch-icon-144x144.png",
    "upx_antiddos": None,
    "watchguard_edr": "favicon.ico",
    "dynatrace": "favicon.png",
    "rapid7_insightidr": "favicon.ico",
    "logicmonitor": None,
    "exabeam_threat_center": "favicon.png",
    "appdynamics_controller_audit": None,
    "saviynt_eic": "favicon.svg",
    "orca_security": "favicon.svg",
    "grafana_enterprise_audit": "logo.svg",
    "veza": None,
    "securityscorecard": None,
    "sciencelogic_sl1": None,
    "microsoft_entra_id_graph": "microsoft_entra_id_graph.svg",
}
EXPERIMENTAL_REASON_OVERRIDES = {
    "veza": "Built from official historical documentation examples without a current customer-tenant capture. Validate endpoint version, audit schema variant, pagination durability, ordering, and completeness against real deployment data before operational reliance.",
    "securityscorecard": "Built from the official API contract and one anonymized ecosystem-published issue-history response without a current customer-tenant capture. Breach and recalibration parsing, ordering, date-bound semantics, late arrivals, multi-page consistency, entitlements, and completeness require live validation.",
    "sciencelogic_sl1": "Built from ScienceLogic's documented rsyslog transport without an attributable complete outbound record. Validate the emitted RFC/template, TCP framing, included programs and facilities, event-family coverage, authenticated TLS, SaaS export path, and completeness against a real Skylar One deployment.",
    "microsoft_entra_id_graph": "Built from official Microsoft Graph schemas and bounded documentation examples without a current customer-tenant capture. Validate tenant permissions, pagination, late arrivals, risk-state updates, and completeness before operational reliance.",
}
BUILD_DURATION_OVERRIDES = {
    "veza": "1 hour 21 minutes 48 seconds (measured)",
    "securityscorecard": "5 hours 43 minutes 24 seconds (measured)",
    "sciencelogic_sl1": "20 minutes 8 seconds (measured)",
    "microsoft_entra_id_graph": "1 hour 41 minutes 53 seconds (measured)",
}
CREATED_OVERRIDES = {
    "securityscorecard": "31 August 2026",
    "sciencelogic_sl1": "31 August 2026",
    "microsoft_entra_id_graph": "31 August 2026",
}
VALIDATION_OVERRIDES = {
    "securityscorecard": "Package, pipeline, and system validated",
    "sciencelogic_sl1": "Package and negative raw-fallback pipeline validated; positive fixtures blocked",
    "microsoft_entra_id_graph": "Package and attributable pipeline fixtures validated; direct Graph collection mock-validated; live tenant validation blocked",
}
requested_slugs = os.environ.get("EXPERIMENTAL_SLUGS")
SLUGS = requested_slugs.split(",") if requested_slugs else ALL_SLUGS

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
        root_match = re.search(r"^- name:\s*([^\n]+)\n\s+type:\s*group\s*$", document, re.M)
        root = root_match.group(1).strip("'\"") if root_match else ""
        for match in re.finditer(r"^\s+- \{name:\s*([^,}]+)([^}]*)\}$", document, re.M):
            tail = match.group(2)
            field_type = re.search(r",\s*type:\s*([^,}]+)", tail)
            description = re.search(r",\s*description:\s*([^}]+)", tail)
            parsed.append({
                "field": f"{root}.{match.group(1).strip()}" if root else match.group(1).strip(),
                "description": description.group(1).strip() if description else "Field exported by the integration.",
                "type": field_type.group(1).strip() if field_type else "keyword",
            })
        for field in parsed:
            field["field"] = field["field"].strip("'\"")
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
    package_slug = PACKAGE_BY_SLUG.get(slug, slug)
    package = SOURCE / "packages" / package_slug
    manifest = (package / "manifest.yml").read_text()
    name = TITLE_OVERRIDES.get(slug, scalar(manifest, "title"))
    description = scalar(manifest, "description")
    version = scalar(manifest, "version")
    categories, solutions, capabilities = generator.classify(name, description)
    icon = OFFICIAL_ICONS[slug]
    records.append({
        "slug": slug,
        "name": name,
        "description": description,
        "version": version,
        "created": CREATED_OVERRIDES.get(slug, "30 August 2026"),
        "buildDuration": BUILD_DURATION_OVERRIDES.get(slug, "Best-effort experimental build"),
        "status": "Experimental",
        "validationStatus": VALIDATION_OVERRIDES.get(slug, "Static validated"),
        "experimentalReason": EXPERIMENTAL_REASON_OVERRIDES.get(
            slug,
            "Built without customer sample logs. Validate parsing and transport behavior against real deployment data before production use.",
        ),
        "categories": categories,
        "solutions": solutions,
        "capabilities": capabilities,
        "icon": icon,
        "repositoryUrl": f"https://github.com/2gavy/elastic_integrations/tree/main/{REPOSITORY_PATH_OVERRIDES.get(slug, f'packages/{package_slug}')}",
        "source": "custom",
        "fields": exported_fields(package),
    })

records.sort(key=lambda record: record["name"].casefold())
CATALOG.write_text(json.dumps(records, indent=2) + "\n")
print(f"Imported {len(SLUGS)} experimental packages; catalogue now has {len(records)} records")
