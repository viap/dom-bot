export type ContactInfo = {
  telegram?: string
  instagram?: string
  whatsapp?: string
  phone?: string
}

export type Psychologist<T> = {
  schools: Array<T>
  name: string
  descr: string
  photo?: string
  contacts: ContactInfo
}
