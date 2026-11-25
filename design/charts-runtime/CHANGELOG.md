# Changelog

## 3.1.1

### Patch Changes

- Bug correction
- Updated dependencies
  - @formivue-design/vue-ui@3.1.1

## 3.1.1

### Patch Changes

- official 3.1 release with datamodel editing
- Updated dependencies
  - @formivue-design/vue-ui@3.1.1

Notable changes to `@formivue-design/charts-runtime` are recorded here.

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-11-25

### Added

- Expose row validation, chart column metadata, and schema contracts through `/data-contract`. ([`6193635`](https://github.com/stefapi/formivue-design/commit/61936356cef37c3642f3c888cfb279293913804d), [`b1bb9e9`](https://github.com/stefapi/formivue-design/commit/b1bb9e94bd42916eb3c9f622d5c3c5b2e0172c5b))
- Support date-period grouping and row counts in categorical charts, and apply row filters before rendering. ([`7dd09b8`](https://github.com/stefapi/formivue-design/commit/7dd09b80c1d75e93126c95c8a50f9c8357f3df18), [`6ff844a`](https://github.com/stefapi/formivue-design/commit/6ff844ab2770785fedd6ab35531dbf26b42bd121))

### Fixed

- Honor the selected locale in chart formatting, including timeline dates and box-plot values. Fall back when a locale identifier is invalid. ([`6193635`](https://github.com/stefapi/formivue-design/commit/61936356cef37c3642f3c888cfb279293913804d), [`3177279`](https://github.com/stefapi/formivue-design/commit/317727990ff0373f408b67fa0bfb8e503a614698))

## [3.0.3] - 2026-11-23

### Added

- Released Unovis charts and the `ChartMaterials` registry for Formivue schemas.

[Unreleased]: https://github.com/stefapi/formivue-design/compare/18a74c35863c8d81a5658101656b8912ea7bab3d...main
[3.1.0]: https://github.com/stefapi/formivue-design/compare/8ae97b832cf24cbf950917c87fbcfca6fc900050...18a74c35863c8d81a5658101656b8912ea7bab3d
[3.0.3]: https://github.com/stefapi/formivue-design/tree/8ae97b832cf24cbf950917c87fbcfca6fc900050/design/charts-runtime
