export type FilterOption = {
    label: string
    value: string
    onChange: (value: string) => void
    options?: string[] // para dropdowns
    type?: 'text' | 'date' // tipo de campo
  }