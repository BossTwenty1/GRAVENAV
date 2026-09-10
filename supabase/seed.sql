-- Development-only seed data. Nothing in this file represents Forest Lake
-- Memorial Park, a real person, a real burial record, or a real cemetery
-- coordinate. Synthetic coordinates are intentionally outside the client site.

do $$
declare
  v_site uuid := '00000000-0000-4000-8000-000000000001';
  v_area uuid := '00000000-0000-4000-8000-000000000002';
  v_sector uuid := '00000000-0000-4000-8000-000000000003';
  v_std uuid := '00000000-0000-4000-8000-000000000011';
  v_prm uuid := '00000000-0000-4000-8000-000000000012';
  v_spr uuid := '00000000-0000-4000-8000-000000000013';
  v_empty_plot uuid := '00000000-0000-4000-8000-000000000021';
  v_one_plot uuid := '00000000-0000-4000-8000-000000000022';
  v_multi_plot uuid := '00000000-0000-4000-8000-000000000023';
  v_unresolved_plot uuid := '00000000-0000-4000-8000-000000000024';
  v_alpha uuid := '00000000-0000-4000-8000-000000000031';
  v_beta uuid := '00000000-0000-4000-8000-000000000032';
  v_gamma uuid := '00000000-0000-4000-8000-000000000033';
  v_delta uuid := '00000000-0000-4000-8000-000000000034';
  v_one_interment uuid := '00000000-0000-4000-8000-000000000041';
  v_multi_interment_a uuid := '00000000-0000-4000-8000-000000000042';
  v_multi_interment_b uuid := '00000000-0000-4000-8000-000000000043';
  v_session uuid := '00000000-0000-4000-8000-000000000051';
  v_observation uuid := '00000000-0000-4000-8000-000000000061';
begin
  insert into public.cemetery_sites (id, name, code, description, is_synthetic)
  values (
    v_site,
    '[DEV ONLY] Synthetic Memorial Site',
    'DEV-SYNTH',
    'Synthetic development fixture; not a client cemetery.',
    true
  )
  on conflict (id) do nothing;

  insert into public.cemetery_areas (id, cemetery_site_id, source_code, source_label, code, name, is_synthetic)
  values (
    v_area,
    v_site,
    'DEV-AREA-01',
    '[DEV ONLY] Synthetic area label',
    'DEV-AREA-01',
    '[DEV ONLY] Synthetic Garden',
    true
  )
  on conflict (id) do nothing;

  insert into public.sectors (id, cemetery_area_id, source_identifier, identifier, name, is_synthetic)
  values (
    v_sector,
    v_area,
    'DEV-SECTOR-01',
    'DEV-SECTOR-01',
    '[DEV ONLY] Synthetic Sector',
    true
  )
  on conflict (id) do nothing;

  insert into public.plot_types (id, code, name, description, regular_interment_capacity, is_synthetic)
  values
    (v_std, 'STD', 'Standard', 'Development mapping only.', 2, true),
    (v_prm, 'PRM', 'Premium', 'Development mapping only.', 2, true),
    (v_spr, 'SPR', 'Special Premium', 'Development mapping only.', 2, true)
  on conflict (id) do nothing;

  insert into public.plots (
    id, cemetery_site_id, cemetery_area_id, sector_id,
    normalized_plot_identifier, raw_lot_location, normalized_lot_key,
    plot_type_id, unresolved_source_classification, source_commercial_status, is_synthetic
  )
  values
    (
      v_empty_plot, v_site, v_area, v_sector,
      'DEV-PLOT-EMPTY', '[DEV ONLY] Empty plot', 'dev-plot-empty',
      v_std, null, 'AVAILABLE', true
    ),
    (
      v_one_plot, v_site, v_area, v_sector,
      'DEV-PLOT-ONE', '[DEV ONLY] One-interment plot', 'dev-plot-one',
      v_prm, null, 'BOOKED', true
    ),
    (
      v_multi_plot, v_site, v_area, v_sector,
      'DEV-PLOT-MULTI', '[DEV ONLY] Multiple-interment plot', 'dev-plot-multi',
      v_spr, null, 'HOLD', true
    ),
    (
      v_unresolved_plot, v_site, v_area, v_sector,
      'DEV-PLOT-UNRESOLVED', '[DEV ONLY] Unresolved source lot classification MCF', 'dev-plot-unresolved',
      null, 'MCF', null, true
    )
  on conflict (id) do nothing;

  insert into public.deceased_persons (
    id, given_name, middle_name, family_name, suffix,
    date_of_birth, date_of_death, is_synthetic
  )
  values
    (v_alpha, 'Synthetic', 'Development', 'Alpha', null, '1940-01-01', '2020-01-01', true),
    (v_beta, 'Synthetic', 'Development', 'Beta', null, '1941-02-02', '2021-02-02', true),
    (v_gamma, 'Synthetic', 'Development', 'Gamma', null, '1942-03-03', '2022-03-03', true),
    (v_delta, 'Synthetic', 'Development', 'Delta', 'Test', '1943-04-04', '2023-04-04', true)
  on conflict (id) do nothing;

  insert into public.interments (
    id, deceased_person_id, plot_id, interment_date, interment_type,
    position_sequence, permanence_status, is_publicly_visible, is_synthetic
  )
  values
    (
      v_one_interment, v_alpha, v_one_plot, '2020-01-15',
      'development-fixture', 1, 'development-fixture', false, true
    ),
    (
      v_multi_interment_a, v_beta, v_multi_plot, '2021-02-15',
      'development-fixture', 1, 'development-fixture', false, true
    ),
    (
      v_multi_interment_b, v_gamma, v_multi_plot, '2022-03-15',
      'development-fixture', 2, 'development-fixture', false, true
    )
  on conflict (id) do nothing;

  insert into public.coordinate_collection_sessions (
    id, session_identifier, collector_reference, device_label, method,
    started_at, ended_at, notes, is_synthetic
  )
  values (
    v_session,
    'DEV-SESSION-001',
    'synthetic-collector',
    'synthetic-device',
    'development-fixture',
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:10:00Z',
    'Synthetic session only; not a field collection.',
    true
  )
  on conflict (id) do nothing;

  insert into public.coordinate_observations (
    id, plot_id, collection_session_id, latitude, longitude,
    horizontal_accuracy_meters, captured_at, capture_method,
    collector_reference, device_label, notes, is_synthetic
  )
  values
    (
      v_observation, v_one_plot, v_session, 1.234500, 20.987600,
      4.2, '2026-01-01T00:01:00Z', 'development-fixture',
      'synthetic-collector', 'synthetic-device', 'Synthetic observation; not a real cemetery coordinate.', true
    ),
    (
      '00000000-0000-4000-8000-000000000062', v_one_plot, v_session, 1.234501, 20.987601,
      5.0, '2026-01-01T00:02:00Z', 'development-fixture',
      'synthetic-collector', 'synthetic-device', 'Synthetic observation; not a real cemetery coordinate.', true
    ),
    (
      '00000000-0000-4000-8000-000000000063', v_one_plot, v_session, 1.234499, 20.987599,
      3.8, '2026-01-01T00:03:00Z', 'development-fixture',
      'synthetic-collector', 'synthetic-device', 'Synthetic observation; not a real cemetery coordinate.', true
    ),
    (
      '00000000-0000-4000-8000-000000000064', v_one_plot, v_session, 1.234502, 20.987602,
      6.1, '2026-01-01T00:04:00Z', 'development-fixture',
      'synthetic-collector', 'synthetic-device', 'Synthetic observation; not a real cemetery coordinate.', true
    ),
    (
      '00000000-0000-4000-8000-000000000065', v_multi_plot, v_session, 1.234600, 20.987700,
      8.4, '2026-01-01T00:05:00Z', 'development-fixture',
      'synthetic-collector', 'synthetic-device', 'Synthetic observation; not a real cemetery coordinate.', true
    )
  on conflict (id) do nothing;

  insert into public.gravesite_coordinates (
    id, plot_id, latitude, longitude, status, source_observation_id,
    is_current, notes, is_synthetic
  )
  values
    (
      '00000000-0000-4000-8000-000000000071', v_one_plot,
      1.234500, 20.987600, 'verified', v_observation, true,
      'Synthetic verified example only; verification does not represent a real site.', true
    ),
    (
      '00000000-0000-4000-8000-000000000072', v_multi_plot,
      1.234600, 20.987700, 'pending_verification',
      '00000000-0000-4000-8000-000000000065', true,
      'Synthetic pending-verification example only.', true
    )
  on conflict (id) do nothing;

  insert into public.coordinate_verifications (
    id, gravesite_coordinate_id, result, reviewer_reference,
    verified_at, notes, is_synthetic
  )
  values (
    '00000000-0000-4000-8000-000000000081',
    '00000000-0000-4000-8000-000000000071',
    'verified',
    'synthetic-reviewer',
    '2026-01-01T00:20:00Z',
    'Synthetic verification-history example; not a production claim.',
    true
  )
  on conflict (id) do nothing;
end;
$$;
