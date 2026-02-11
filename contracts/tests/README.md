# Contract Tests (Planned)

This folder is reserved for a contract validation runner.

MVP approach:

- Validate the JSON examples in `jarvis/contracts/examples/` against the schemas in `jarvis/contracts/schemas/`.
- Validate that stub sidecars emit payloads that match the schemas.

Implementation note:

- Once the Desktop and UI Node toolchain is in place, use Ajv to validate schemas (JSON Schema 2020-12).
