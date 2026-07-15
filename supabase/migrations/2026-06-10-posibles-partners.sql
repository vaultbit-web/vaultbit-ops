-- ─────────────────────────────────────────────────────────
-- Posibles partners · prospección presencial por ubicación
-- 2026-06-10
--
-- La sección CRM > "Contactos LinkedIn" pasa a ser "Posibles
-- partners": base de datos de despachos, notarías, fiscalistas y
-- gestores de patrimonio para visitar en persona y proponer
-- colaboración. Reutiliza la tabla `partners` (pipeline 7 etapas,
-- fuentes de verificación) añadiendo los datos de contacto directo
-- y el tipo de profesional, filtrables por ciudad.
-- ─────────────────────────────────────────────────────────

alter table public.partners
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists professional_type varchar(40);

-- CHECK como el resto de pseudo-enums de la tabla (no PG enum)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'partners_professional_type_check'
  ) then
    alter table public.partners
      add constraint partners_professional_type_check
      check (
        professional_type is null or professional_type in (
          'notaria',
          'abogado_sucesiones',
          'fiscalista',
          'gestor_patrimonio',
          'gestoria',
          'family_office',
          'otro'
        )
      );
  end if;
end $$;

create index if not exists partners_city_idx
  on public.partners (city);

create index if not exists partners_professional_type_idx
  on public.partners (professional_type);

comment on column public.partners.email is
  'Email público de contacto (web oficial o directorio colegial). Vacío si no está publicado.';
comment on column public.partners.phone is
  'Teléfono público de contacto. Vacío si no está publicado.';
comment on column public.partners.professional_type is
  'Tipo de profesional para la prospección presencial: notaria | abogado_sucesiones | fiscalista | gestor_patrimonio | gestoria | family_office | otro.';
