-- ============================================================
-- Bug fix: anon no podía hacer UPDATE en funnel_sessions
-- Proyecto: YOUR-PROJECT-REF (VaultBit Asesoría)
-- ============================================================
--
-- Síntoma detectado el 2026-05-24 tras auditoría del funnel:
-- 28 sesiones acumuladas en 18 días, TODAS con step_reached=0,
-- archetype=null, answers={}, completed=false y lead_id=null.
-- Ninguna sesión avanzó nunca aunque el flujo del navegador sí llega
-- al step 9 (existe 1 lead en funnel_leads con q1-q5 rellenos,
-- huérfano de sesión). Todas tienen updated_at = created_at.
--
-- Causa raíz: la tabla tenía policy UPDATE para anon
-- (`anon_update_recent_sessions`, USING/CHECK con ventana 24h) pero
-- NO tenía policy SELECT para anon. En PostgreSQL+RLS un UPDATE
-- evalúa internamente la fila para aplicar la USING, y si el rol no
-- tiene visibilidad SELECT sobre ella el motor responde "0 filas
-- afectadas" sin error — PostgREST devuelve 204 No Content y el
-- cliente no detecta el fallo (ver public/diagnostico/index.html,
-- función sbUpdate con Prefer: return=minimal).
--
-- Mismo patrón silencioso al de las DELETE policies faltantes
-- documentado en 2026-04-30-crm_delete_policies.sql.
--
-- Fix: política SELECT para anon limitada a sesiones de las últimas
-- 24 horas (alineada con la ventana de UPDATE). Las columnas de
-- funnel_sessions no contienen PII (los datos personales viven en
-- funnel_leads, sin SELECT anon); el riesgo de exponer step/utm/
-- answers de últimas 24h al holder de la anon key es aceptable y
-- alineado con cómo el cliente ya escribe esos datos públicamente.

create policy "anon_select_recent_sessions"
  on public.funnel_sessions
  for select
  to anon
  using (created_at > (now() - interval '24 hours'));

-- Verificación tras aplicar:
--   1) Levanta el diagnóstico, completa Q1 → revisa que funnel_sessions
--      tiene step_reached=1 en la fila con tu session_key.
--   2) Confirma updated_at > created_at en esa fila.
--   3) Completa el flujo hasta el step 9 → la sesión debe quedar con
--      completed=true y lead_id apuntando al funnel_leads insertado.
