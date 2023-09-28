export type AuthResponse = {
  token: string
  refresh_token: string
  expiration_date: string
  refresh_token_expiration_date: string
}

export type CheckoutResponse = {
  id: string
  expiration: Date
  redirect_url: string
  checkout_url: string
  shopper: Shopper
  order: Order
  metadata: Metadata
  cashback_amount: number
  merchant_id: string
  state: string
  provider: string
  cancel_url: string
  approve_url: string
  timestamp: Date
  is_pix_upfront: boolean
  terms_and_condition: TermsAndCondition
}

export type Metadata = Record<string, any>

export type Order = {
  reference: string
  metadata: Metadata
  description: string
  shipping: Shipping
  amount: number
  items: Item[]
  timestamp: Date
  type: string
  discounts: any[]
}

export type Item = {
  name: string
  sku: string
  quantity: number
  price: number
  url: string
  reference: string
  image: string
}

export type Shipping = {
  amount: number
  pickup: boolean
  address: Address
  tracking: Tracking
}

export type Address = {
  city: string
  complement: string
  name: string
  neighborhood: string
  number: string
  phone_number: string
  state: string
  street: string
  zip_code: string
}

export type Tracking = {
  url: string
  code: string
  carrier: string
}

export type Shopper = {
  first_name: string
  last_name: string
  billing_address: Address
  cpf: string
  email: string
  phone: string
}

export type TermsAndCondition = {
  url: string
  version: number
  accepted: boolean
}
