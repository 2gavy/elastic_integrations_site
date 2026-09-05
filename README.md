# Elastic Integrations (AI)

Elastic Integrations (AI) is a unified, searchable catalogue for discovering official Elastic integrations alongside custom integrations developed for sources that need additional coverage.

The catalogue currently includes **488 official integrations** and **212 custom integrations**.

## The problem this solves

Operationalising data ingestion can involve more than connecting a source to Elasticsearch. Teams must identify suitable integrations, understand the fields produced, keep parsing and ECS mappings consistent, manage package versions, and decide how data will be routed and enriched in production.

This catalogue provides one place to:

- Find official and custom integrations without searching across multiple repositories and documentation sites.
- Review an integration's purpose, categories, version, and exported fields before adoption.
- Reuse packaged collection, parsing, and field definitions instead of repeatedly building ingestion pipelines from scratch.
- Identify coverage gaps where a custom integration is required.
- Support a controlled path from discovery and testing to deployment, monitoring, upgrades, and ongoing maintenance.

## Operationalising ingestion

Official entries link to Elastic's public documentation. Custom entries provide approved metadata and an exported-fields reference while keeping implementation files in the protected private repository.

Integrations can be used through Elastic Agent and Fleet for managed collection. Where Logstash is part of the ingestion architecture, the [`elastic_integration` filter](https://www.elastic.co/docs/reference/logstash/ea-integration-tutorial) can apply an installed integration's ingest transformations to Elastic Agent events before additional Logstash enrichment, routing, or delivery. Compatibility, package versions, data-stream metadata, and the target deployment should always be validated in a non-production environment first.

The intended lifecycle is:

1. Discover an appropriate official or custom integration.
2. Review its documentation, exported fields, and version.
3. Validate collection and parsing with representative events in a test environment.
4. Deploy through Fleet, or operationalise the flow through Logstash where additional processing and routing are needed.
5. Monitor ingestion health and manage package upgrades as part of normal service operations.

## Security and project status

The public catalogue contains only approved metadata, icons, and field definitions for custom integrations. It does not publish private README content, source packages, credentials, installation material, or repository history.

Nick & Zing maintained. Not an official Elastic website.
