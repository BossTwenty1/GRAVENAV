# Administrator records integration

Task 5D connects the existing deceased-person, interment, and plot modules without changing their database model or approved business rules.

## Connected record context

- A deceased record shows its bounded related-interment history, including lifecycle state, interment date, plot, and links to the interment and plot records.
- An interment links to its deceased record and plot record.
- A plot shows bounded active-interment context with links to the interment and deceased records.

Each entity remains editable only from its own management route. The integration pass does not duplicate mutation controls or add a new database migration.

## Consistent interface behavior

The Administrator shell identifies the current section with text, styling, and `aria-current`. Navigation remains horizontally scrollable at narrow widths and returns to the existing sidebar layout on desktop.

The three modules share user-facing labels for lifecycle state, occupancy, and unknown capacity. Color supplements these labels but does not carry meaning alone. Shared loading and error panels provide consistent announcements and recovery actions. Tables retain semantic headers and use horizontal overflow on narrow screens.

Forms retain their approved validation and confirmation rules. Field errors are programmatically associated with affected inputs, pending submissions remain disabled, and every form keeps its cancel/back path.

## Security and scope

Task 5D does not alter RLS, mutation authorization, audit payloads, occupancy derivation, capacity enforcement, duplicate handling, or no-hard-delete rules. It adds no service-role access, public search, maps, GPS/coordinate work, routing, photos, reports, deployment, or real cemetery data.
