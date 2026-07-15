import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import {
  type Quote,
  SERVICE_LABELS,
  type ServiceSlug,
  TIER_LABELS,
  type Tier,
  MODALITY_LABELS,
  type Modality,
} from "~/lib/supabase/types";
import { parseBreakdown, parseQuoteItems } from "~/lib/quotes/pricing-engine";

function formatEur(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function QuotePdfDocument({ quote }: { quote: Quote }) {
  const items = parseQuoteItems(quote.quote_items);
  const isMulti = items.length > 1;
  const breakdown = parseBreakdown(quote.price_breakdown);
  const serviceLabel = SERVICE_LABELS[quote.service_slug as ServiceSlug] ?? quote.service_slug;
  const tierLabel =
    items[0]?.breakdown[0]?.label ?? breakdown[0]?.label ?? TIER_LABELS[quote.tier as Tier] ?? quote.tier;
  const modalityLabel = MODALITY_LABELS[quote.modality as Modality] ?? quote.modality;

  const expirationDate = new Date(
    new Date(quote.created_at).getTime() + quote.validity_days * 24 * 60 * 60 * 1000,
  );

  const discountAmount = quote.base_price_eur - quote.subtotal_eur;

  return (
    <Document
      title={`Presupuesto ${quote.quote_number} · VaultBit Advisory`}
      author="VaultBit Advisory S.L."
      subject={`Presupuesto para ${quote.client_name}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Banda vertical naranja como elemento de marca */}
        <View style={styles.brandStripe} fixed />

        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>VAULTBIT ADVISORY</Text>
            <Text style={styles.brandTagline}>Custodia · Herencia · Fiscalidad cripto</Text>
          </View>
          <View>
            <Text style={styles.headerRight}>{quote.quote_number}</Text>
            <Text style={[styles.headerRight, { marginTop: 2 }]}>
              {formatLongDate(quote.created_at)}
            </Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.eyebrow}>Presupuesto de servicios</Text>
        <Text style={styles.h1}>Propuesta económica</Text>
        <Text style={styles.small}>
          Válida hasta el {formatLongDate(expirationDate.toISOString())} · {quote.validity_days} días naturales
        </Text>

        {/* Cliente */}
        <Text style={styles.h2}>Cliente</Text>
        <FieldRow label="Nombre" value={quote.client_name} />
        {quote.client_company ? <FieldRow label="Empresa" value={quote.client_company} /> : null}
        {quote.client_nif ? <FieldRow label="NIF · CIF" value={quote.client_nif} /> : null}
        {quote.client_email ? <FieldRow label="Email" value={quote.client_email} /> : null}
        {quote.client_address ? <FieldRow label="Domicilio" value={quote.client_address} /> : null}
        {quote.client_sector ? <FieldRow label="Sector" value={quote.client_sector} /> : null}

        {/* Servicio(s) */}
        <Text style={styles.h2}>{isMulti ? "Servicios contratados" : "Servicio contratado"}</Text>
        {items.length ? (
          items.map((it, i) => (
            <FieldRow
              key={i}
              label={it.label}
              value={MODALITY_LABELS[it.modality as Modality] ?? it.modality}
            />
          ))
        ) : (
          <>
            <FieldRow label="Servicio" value={serviceLabel} />
            <FieldRow label="Modalidad" value={`${tierLabel} · ${modalityLabel}`} />
          </>
        )}

        {/* Notas / alcance */}
        {quote.notes ? (
          <>
            <Text style={styles.h2}>Alcance</Text>
            <Text style={styles.p}>{quote.notes}</Text>
          </>
        ) : null}

        {/* Totales */}
        <View style={styles.totalsBox}>
          {items.length ? (
            <>
              {items.map((it, i) => (
                <View key={i}>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>{it.label}</Text>
                    <Text style={styles.totalsValue}>{formatEur(it.base_price_eur)}</Text>
                  </View>
                  {it.breakdown.length > 1
                    ? it.breakdown.map((l, j) => (
                        <View style={styles.totalsRow} key={j}>
                          <Text style={[styles.totalsLabel, { paddingLeft: 10 }]}>{l.label}</Text>
                          <Text style={styles.totalsValue}>{formatEur(l.amount)}</Text>
                        </View>
                      ))
                    : null}
                </View>
              ))}
              {isMulti ? (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Base combinada</Text>
                  <Text style={styles.totalsValue}>{formatEur(quote.base_price_eur)}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Precio base</Text>
              <Text style={styles.totalsValue}>{formatEur(quote.base_price_eur)}</Text>
            </View>
          )}
          {quote.discount_percent > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Descuento ({quote.discount_percent}%)</Text>
              <Text style={[styles.totalsValue, { color: colors.brand }]}>
                − {formatEur(discountAmount)}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatEur(quote.subtotal_eur)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>IVA ({quote.vat_percent}%)</Text>
            <Text style={styles.totalsValue}>{formatEur(quote.vat_amount_eur)}</Text>
          </View>

          <View style={styles.totalsDivider} />

          <View style={styles.totalsRow}>
            <Text style={styles.totalsGrandLabel}>Total</Text>
            <Text style={styles.totalsGrandValue}>{formatEur(quote.total_eur)}</Text>
          </View>
        </View>

        {/* Condiciones */}
        <Text style={styles.h2}>Condiciones</Text>
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>·</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>Validez. </Text>
              {quote.validity_days} días naturales desde la fecha de emisión.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>·</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>Pago. </Text>
              50% al inicio, 50% a la entrega final, salvo pacto en contrario.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>·</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>Aceptación. </Text>
              La aceptación expresa de este presupuesto formaliza el encargo y dará lugar al precontrato correspondiente.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>·</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>Honorarios de terceros. </Text>
              Los honorarios profesionales colegiados de notarios, fiscalistas u otros profesionales independientes derivados, cuando proceda, se facturan directamente por dichos profesionales y no están incluidos.
            </Text>
          </View>
        </View>

        {/* Compliance notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            <Text style={styles.bold}>VaultBit Advisory, S.L.</Text> opera como sociedad de consultoría tecnológica y empresarial.
            <Text style={styles.bold}> No somos asesor financiero registrado, ni despacho de abogados, ni entidad de custodia regulada.</Text>{" "}
            Diseñamos arquitectura técnica y derivamos a profesionales colegiados (fiscalistas, notarios, abogados) cuando procede.
            La información contenida en este presupuesto tiene carácter orientativo y no constituye asesoramiento de inversión ni recomendación sobre activos concretos.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>VaultBit Advisory S.L. · vaultbit.es · info@vaultbit.es</Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) => `${pageNumber} · ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
