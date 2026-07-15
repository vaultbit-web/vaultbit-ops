import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import { MarkdownRenderer } from "./markdown-renderer";
import type { Contract } from "~/lib/supabase/types";

function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

export function ContractPdfDocument({
  contract,
  templateName,
}: {
  contract: Contract;
  templateName: string;
}) {
  return (
    <Document
      title={`${templateName} · ${contract.contract_number} · VaultBit`}
      author="VaultBit Advisory S.L."
      subject={`${templateName} · ${contract.client_name}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Banda vertical naranja */}
        <View style={styles.brandStripe} fixed />

        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>VAULTBIT ADVISORY</Text>
            <Text style={styles.brandTagline}>{templateName}</Text>
          </View>
          <View>
            <Text style={styles.headerRight}>{contract.contract_number}</Text>
            <Text style={[styles.headerRight, { marginTop: 2 }]}>
              {formatLongDate(contract.created_at)}
            </Text>
          </View>
        </View>

        {/* Cuerpo del contrato — markdown rellenado */}
        <MarkdownRenderer source={contract.body_md_filled} />

        {/* Compliance notice al final */}
        <View style={styles.noticeBox} wrap={false}>
          <Text style={styles.noticeText}>
            <Text style={styles.bold}>VaultBit Advisory, S.L.</Text> · CIF B-XXXXXXXX · Sociedad de consultoría tecnológica y empresarial.
            Documento generado electrónicamente. Plantilla{" "}
            <Text style={styles.bold}>{contract.template_slug}</Text> · versión{" "}
            <Text style={styles.bold}>{contract.template_version}</Text>.
            Para cuestiones formales, prevalece la versión firmada en papel.
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
