import {router} from 'expo-router'
import {useCallback, useEffect, useState} from 'react'
import {StyleSheet} from 'react-native'

import {Button} from '../components/Button'
import {Text, View} from '../components/Themed'
import {AuthResponse, CheckoutResponse} from './type'

const MERCHANT_LOGIN = process.env.EXPO_PUBLIC_MERCHANT_LOGIN
const MERCHANT_PASSWORD = process.env.EXPO_PUBLIC_MERCHANT_PASSWORD
const API_URL = process.env.EXPO_PUBLIC_API_URL

export default function CartScreen() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState<string>()
  const [loading, setLoading] = useState(false)

  const onAuth = useCallback(async () => {
    // Referencia completa: https://docs.pagaleve.com.br/reference/authenticationcontroller_doauthentication
    const authResponse = await fetch(`${API_URL}/v1/authentication`, {
      body: JSON.stringify({
        password: MERCHANT_PASSWORD,
        username: MERCHANT_LOGIN,
      }),
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
    })

    const {token: _token} = (await authResponse.json()) as AuthResponse

    setLoggedIn(true)
    setToken(_token)
  }, [])

  const onCreateCheckout = useCallback(async () => {
    setLoading(true)
    // Referencia completa: https://docs.pagaleve.com.br/reference/checkoutcontroller_docheckout
    const checkoutResponse = await fetch(`${API_URL}/v1/checkouts`, {
      body: JSON.stringify({
        approve_url: 'exp://127.0.0.1:8081/--/success', // Passe um deep link para ser chamado ao finalizar o checkout com sucesso (aceita URLs também).
        // approve_url: 'example://success', Use o schema configurado no seu aplicativo.
        cancel_url: 'exp://127.0.0.1:8081/--/cancel', // Deep link que será chamado ao dar falha/cancelar o checkout.
        is_pix_upfront: false,
        metadata: {}, // objeto chave/valor, os valores passados podem ser recuperados por meio de API após a finalização do checkout
        order: {
          amount: 20000,
          description: 'order description',
          items: [
            {
              image: 'https://pagaleve.com.br',
              name: 'Blusa Verde Lily',
              price: 12000,
              quantity: 1,
              reference: 'reference',
              sku: 'sku',
              url: 'https://pagaleve.com.br',
            },
            {
              image: 'https://pagaleve.com.br',
              name: 'Sapato Feminino Couro Preto',
              price: 6000,
              quantity: 1,
              reference: 'reference',
              sku: 'sku',
              url: 'https://pagaleve.com.br',
            },
            {
              image: 'https://pagaleve.com.br',
              name: 'Cinto Faixa Fivela Plástico Gloss Promoção Inverno',
              price: 2000,
              quantity: 1,
              reference: 'reference',
              sku: 'sku',
              url: 'https://pagaleve.com.br',
            },
          ],
          metadata: {},
          reference: 'PL20230926015839',
          shipping: {
            address: {
              city: 'São Paulo',
              complement: '',
              name: 'Office',
              neighborhood: 'Vila Madalena',
              number: '590',
              phone_number: '11987654321',
              state: 'SP',
              street: 'Rua Harmonia',
              zip_code: '05435001',
            },
            amount: 1000,
            pickup: false,
            tracking: {
              carrier: 'carrier',
              code: 'code',
              url: 'url',
            },
          },
        },
        provider: 'INTERNAL_INVITE',
        shopper: {
          billing_address: {
            city: 'São Paulo',
            complement: '',
            name: 'Office',
            neighborhood: 'Vila Madalena',
            number: '590',
            phone_number: '11987654321',
            state: 'SP',
            street: 'Rua Harmonia',
            zip_code: '05435001',
          },
          cpf: '40443116504',
          email: 'john.doe@gmail.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '99900001234',
        },
      }),
      method: 'POST',
      headers: new Headers({
        'Content-type': 'application/json',
        'idempotency-key': new Date().getTime().toString(), // String única, usada para prevenir a criação dupla de um checkout
        authorization: token!,
      }),
    })

    const checkoutResponseJson = (await checkoutResponse.json()) as CheckoutResponse
    const {checkout_url} = checkoutResponseJson

    console.log({response: checkoutResponseJson})

    setLoading(false)

    router.push({
      pathname: '/checkout',
      params: {
        checkoutUrl: checkout_url,
      },
    })
  }, [token])

  useEffect(() => {
    if (!loggedIn) onAuth()
  }, [loggedIn, onAuth])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{loggedIn ? `Logged as ${MERCHANT_LOGIN}` : 'Not Logged'}</Text>
      <View darkColor='rgba(255,255,255,0.1)' lightColor='#eee' style={styles.separator} />
      <Button loading={loading} onPress={async () => await onCreateCheckout()}>
        Create Checkout
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
})
