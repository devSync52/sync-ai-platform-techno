import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, marginBottom: 4 },
  tableHeader: { fontWeight: 'bold', flexDirection: 'row', borderBottom: '1pt solid #000' },
  row: { flexDirection: 'row', borderBottom: '0.5pt solid #ccc', paddingVertical: 2 },
  cell: { flex: 1 },
})

export function QuotePdfDocument({
  quote,
  items,
}: {
  quote: {
    id: string | number
    status?: string
    created_at?: string
    selected_service?: { total?: number }
  }
  items: {
    sku: string
    product_name: string
    quantity: number
    weight_lbs: number
    subtotal: number
  }[]
}) {
  const subtotal = items.reduce((sum: number, item) => sum + (item.subtotal || 0), 0)
  const shipping = Number(quote?.selected_service?.total || 0)
  const total = subtotal + shipping

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.heading}>Quote #{quote?.id}</Text>
          <Text>Status: {quote?.status}</Text>
          <Text>Created At: {quote?.created_at?.split('T')[0]}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.cell}>SKU</Text>
            <Text style={styles.cell}>Product</Text>
            <Text style={styles.cell}>Qty</Text>
            <Text style={styles.cell}>Weight</Text>
            <Text style={styles.cell}>Subtotal</Text>
          </View>
          {items.map((item: {
            sku: string
            product_name: string
            quantity: number
            weight_lbs: number
            subtotal: number
          }, i: number) => (
            <View key={i} style={styles.row}>
              <Text style={styles.cell}>{item.sku}</Text>
              <Text style={styles.cell}>{item.product_name}</Text>
              <Text style={styles.cell}>{item.quantity}</Text>
              <Text style={styles.cell}>{item.weight_lbs} lbs</Text>
              <Text style={styles.cell}>${item.subtotal?.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
          <Text>Shipping: ${shipping.toFixed(2)}</Text>
          <Text>Total: ${total.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  )
}