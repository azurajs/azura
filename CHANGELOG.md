# Changelog

All notable changes to this project will be documented in this file.

The format follows an adaptation of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and versioning uses semantic conventions when applicable.

---

## [0.1.0-workspace] - 2026-01-13

### Added

* Official introduction of the **monorepo with workspace** architecture.
* New `.github` directory for CI/CD automations and configurations.
* Initial documentation structure under `docs/`.
* `examples/` and `depoiments/` directories reserved for future use.
* `turbo.json` file for task orchestration within the workspace.

### Changed

* Complete reorganization of the repository structure.
* Projects `benchmark/`, `website/`, and `package/` are now managed by the workspace.
* Standardization on **a single `bun.lock`** at the monorepo root.
* `README.md` updated to reflect the new organization.

### Removed

* Legacy structures incompatible with the workspace model (implicit).

### Notes

* Whenever modifying any project within the monorepo, run:

  ```bash
  azurajs > bun install
  ```

* Dependencies are resolved exclusively via the workspace.