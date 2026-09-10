# GPS and navigation data foundation

Task 2 prepares data storage for future field collection and routing without claiming grave-level GPS precision.

## Coordinate lifecycle

Raw readings belong in `coordinate_observations`. Each reading stores WGS84 latitude/longitude, optional device-reported horizontal accuracy in meters, capture method, timestamp, collection session, and optional collector/device references. A reading targets either a `plot` or a `map_control_point`.

An accepted or candidate destination belongs in `gravesite_coordinates` and targets a plot. Its status is `recorded`, `pending_verification`, `verified`, or `rejected`. Coordinate versions are retained through `supersedes_coordinate_id`; a partial unique index limits each plot to one current, non-superseded row. Verification history is kept in `coordinate_verifications`.

No coordinate row is created to represent a missing destination. A plot without a current coordinate is naturally missing and can be handled by a future application query.

## Accuracy handling

The planned research/UI bands are:

- good: <= 5 m;
- fair: > 5 m and <= 10 m;
- poor: > 10 m.

These are project-defined evaluation thresholds, not guarantees of phone or grave-level accuracy. The database preserves the raw accuracy value and does not derive a claim of precision from it.

## Mapping and routing foundations

`map_control_points` will support future QGIS georeferencing of supplied cemetery plans. `navigation_nodes` and `navigation_edges` provide a future graph, while `map_features` stores digitized features that are not routing edges. All spatial fields use SRID 4326, and GiST indexes are present on meaningful spatial columns.

No real plan geometry, control point, path, navigation node, edge, or routing algorithm is included in the Task 2 seed.
