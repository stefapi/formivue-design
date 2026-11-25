# Changelog

Notable changes to Formivue are recorded here.

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-11-25

### Added

- Separate a form into UI, data schema, and value documents. A live session applies snapshots and patches while preserving local edits. The sales demo and other examples are available in English, French, and Spanish. ([`6193635`](https://github.com/stefapi/formivue-design/commit/61936356cef37c3642f3c888cfb279293913804d))
- Generate a data model from the designer canvas and edit JSON Schema 2020-12 in the [visual schema editor](design/data-schema-editor/README.md). Register [chart](design/data-schema-charts/README.md), [advanced control](design/data-schema-advanced/README.md), and custom contracts to validate component bindings. ([`3d7ff42`](https://github.com/stefapi/formivue-design/commit/3d7ff42ad481170ffc1784d7c5f21d9696031c8a), [`e3caa73`](https://github.com/stefapi/formivue-design/commit/e3caa7394ce94b3ab8bdf50c114a1a3577e3eea4), [`6a3cb36`](https://github.com/stefapi/formivue-design/commit/6a3cb36e18fd19d96526d4c911a58232c032d5b9), [`b1bb9e9`](https://github.com/stefapi/formivue-design/commit/b1bb9e94bd42916eb3c9f622d5c3c5b2e0172c5b), [`b579661`](https://github.com/stefapi/formivue-design/commit/b5796615468eb2062bf880328e418f2e2aafad72))
- Persist separate data model variants. Rename and move fields between objects, and review canvas renames, additions, removals, and type changes for each variant. ([`1da95fc`](https://github.com/stefapi/formivue-design/commit/1da95fcb828bfd12bcc5161f417bad5b21dedec2), [`acae2a1`](https://github.com/stefapi/formivue-design/commit/acae2a12cce7c97ded2febbd44944ca48a781c99), [`b0d6f5b`](https://github.com/stefapi/formivue-design/commit/b0d6f5b75501c3540419ee65b3e1acd259709f26), [`bca698e`](https://github.com/stefapi/formivue-design/commit/bca698e13bedf2eb2944c21f776d04b78222e210))
- Export complete designer projects as versioned JSON archives with the canvas, drafts, variants, and applied preview. Reopen unfinished reconciliation reviews with their pending choices. ([`570915b`](https://github.com/stefapi/formivue-design/commit/570915b6121172ca1efc718fc9a8ed512d66d255), [`a894f43`](https://github.com/stefapi/formivue-design/commit/a894f43f06882efa9231de5effc334a899f60073))
- Group chart dates into periods, count rows, and use shared form fields to filter chart data. The multilingual chart demo includes period and status filters. ([`3177279`](https://github.com/stefapi/formivue-design/commit/317727990ff0373f408b67fa0bfb8e503a614698), [`7dd09b8`](https://github.com/stefapi/formivue-design/commit/7dd09b80c1d75e93126c95c8a50f9c8357f3df18), [`6ff844a`](https://github.com/stefapi/formivue-design/commit/6ff844ab2770785fedd6ab35531dbf26b42bd121), [`97a0c00`](https://github.com/stefapi/formivue-design/commit/97a0c006215b80a14fad885ffc59e8fb7b341b80))
- Install the standard Vue materials from [`@formivue-design/formivue-runtime`](design/formivue-runtime/README.md) to render schemas without designer dependencies. ([`262342f`](https://github.com/stefapi/formivue-design/commit/262342ffcfe1d9f308a6ca1ca24631e2b933e777))

### Changed

- Redesign the model editor and field settings around an inline field builder and a grouped editor for advanced schema rules. ([`a04bbab`](https://github.com/stefapi/formivue-design/commit/a04bbab039b27b5648a63889f3bea0ff5558aaae), [`2d7c889`](https://github.com/stefapi/formivue-design/commit/2d7c889c9986ed555c70934f1cf46a74d2067ee3))
- Move project state, archive handling, the model panel, the JSON editor, and preview sessions into [`@formivue-design/data-model`](design/data-model/README.md). ([`cf4eb0d`](https://github.com/stefapi/formivue-design/commit/cf4eb0d2051d4c56d5ebc7b8e0a92165f5891ba0), [`f94d7f3`](https://github.com/stefapi/formivue-design/commit/f94d7f35bd77a763c6e2ca086078403357b51bf8), [`ff5ba86`](https://github.com/stefapi/formivue-design/commit/ff5ba862ec35cb91e61acaa4f1597f8f1af3597f))
- Release the model, schema editor, and component contract packages in the same Changesets group. Give draft validation and migration separate modules and move their tests to the owning packages. ([`b698b6d`](https://github.com/stefapi/formivue-design/commit/b698b6d75661a93dcf2133db4ace0c033adc9f71), [`a7415ee`](https://github.com/stefapi/formivue-design/commit/a7415ee2f0614097d7c2fbb9acbbb097da5ac0cc))
- Refresh the README, architecture guide, package documentation, and release instructions. ([`18a74c3`](https://github.com/stefapi/formivue-design/commit/18a74c35863c8d81a5658101656b8912ea7bab3d))

### Fixed

- Open the data model from the sidebar and give sidebar tabs native keyboard controls. ([`479ac03`](https://github.com/stefapi/formivue-design/commit/479ac03c9fbb3c265fe4889c294f26d8e76d81b3))
- Show the current and expected value for constant rules, and list allowed values when a choice is rejected. ([`6b85e4a`](https://github.com/stefapi/formivue-design/commit/6b85e4a98920499d87a4bee4f88e1ab8a8743bd9), [`9015f7f`](https://github.com/stefapi/formivue-design/commit/9015f7f346f2cae4e7299829ba1965b36859c27f))
- Restore deleted bound fields and the row schemas used by charts and tables during reconciliation. Recover each variant’s original type, limits, validation rules, and read-only settings. ([`a23531d`](https://github.com/stefapi/formivue-design/commit/a23531da349e5c70b3286e565eaed9c0d32c8fd2), [`fe3a778`](https://github.com/stefapi/formivue-design/commit/fe3a778e0d50b05e826de0d2029923397c0c09b8), [`6aff253`](https://github.com/stefapi/formivue-design/commit/6aff2537a83464ee8f27bd98e5eaae42103eb57a))
- Resolve TypeScript declaration errors when consuming the data model package outside the playground. ([`f6f6651`](https://github.com/stefapi/formivue-design/commit/f6f6651cddcd07209e44c8ad5c6930b3e335fa12))
- Wait for debounced history snapshots in the studio undo and redo tests. ([`af6beb9`](https://github.com/stefapi/formivue-design/commit/af6beb948f93fdb4c186a93f05d76a6e67b7ef5c))

### Security

- Use restricted rendering for imported documents and project archives by default. Executable reactions and expressions require explicit trust from the host application. ([`0867154`](https://github.com/stefapi/formivue-design/commit/0867154aad92236654e9a95e16c4b144f37b1b7c))
- Limit imported rendering attributes and require FormPath to follow only own properties. Document the same-origin Sandbox iframe as a preview for trusted content and assets. ([`f82a085`](https://github.com/stefapi/formivue-design/commit/f82a0853848dd5e57165f1873343f1eb80588b93), [`0867154`](https://github.com/stefapi/formivue-design/commit/0867154aad92236654e9a95e16c4b144f37b1b7c))

## [3.0.3] - 2026-11-23

### Added

- Initial tagged Formivue release, with a headless form engine, Vue bindings, schema-driven fields, validation, and conditional form flows.
- Visual Vue designer with a component palette, settings panel, undo and redo, and JSON Schema import and export.
- Standard form materials, advanced controls and layouts, chart materials, and playgrounds for the designer and form engine.

[Unreleased]: https://github.com/stefapi/formivue-design/compare/18a74c35863c8d81a5658101656b8912ea7bab3d...main
[3.1.0]: https://github.com/stefapi/formivue-design/compare/8ae97b832cf24cbf950917c87fbcfca6fc900050...18a74c35863c8d81a5658101656b8912ea7bab3d
[3.0.3]: https://github.com/stefapi/formivue-design/commit/8ae97b832cf24cbf950917c87fbcfca6fc900050
