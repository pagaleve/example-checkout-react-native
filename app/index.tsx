import {yupResolver} from '@hookform/resolvers/yup'
import {router} from 'expo-router'
import {useCallback, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {Alert, StyleSheet, TextInput} from 'react-native'
import * as yup from 'yup'

import {Button} from '../components/Button'
import {Text, View} from '../components/Themed'
import {AuthResponse, CheckoutResponse} from './type'

const MERCHANT_LOGIN = process.env.EXPO_PUBLIC_MERCHANT_LOGIN
const MERCHANT_PASSWORD = process.env.EXPO_PUBLIC_MERCHANT_PASSWORD
const API_URL = process.env.EXPO_PUBLIC_API_URL

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
})

export default function CartScreen() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState<string>()
  const [loading, setLoading] = useState(false)

  const onSubmit = useCallback(async data => {
    try {
      setLoading(true)
      // Referencia completa: https://docs.pagaleve.com.br/reference/authenticationcontroller_doauthentication
      const authResponse = await fetch(`${API_URL}/v1/authentication`, {
        body: JSON.stringify({
          password: data.password,
          username: data.email,
        }),
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
      })

      const {token: _token} = (await authResponse.json()) as AuthResponse

      setLoggedIn(true)
      setToken(_token)
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível realizar o login')
    } finally {
      setLoading(false)
    }
  }, [])

  const onLogout = useCallback(async () => {
    setToken(undefined)
    setLoggedIn(false)
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

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      email: MERCHANT_LOGIN ?? '',
      password: MERCHANT_PASSWORD ?? '',
    },
    resolver: yupResolver(schema),
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{loggedIn ? `Logged as ${MERCHANT_LOGIN}` : 'Merchant Not Logged'}</Text>
      <View darkColor='rgba(255,255,255,0.1)' lightColor='#eee' style={styles.separator} />

      {!loggedIn ? (
        <View style={styles.form}>
          <Controller
            control={control}
            defaultValue=''
            name='email'
            render={({field: {onChange, onBlur, value}}) => (
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder='Email'
                style={[styles.input, {borderColor: errors.email ? 'red' : 'gray'}]}
                value={value}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <Controller
            control={control}
            defaultValue=''
            name='password'
            render={({field: {onChange, onBlur, value}}) => (
              <TextInput
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder='Password'
                style={[styles.input, {borderColor: errors.password ? 'red' : 'gray'}]}
                value={value}
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <Button
            backgroundColor='#12F2AA'
            color='black'
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            testID='login'
          >
            Login
          </Button>
        </View>
      ) : (
        <View style={styles.row}>
          <Button
            backgroundColor='#12F2AA'
            color='black'
            loading={loading}
            onPress={() => onCreateCheckout()}
            testID='create_checkout'
          >
            Create Checkout
          </Button>
          <Button backgroundColor='#FE35F1' color='white' onPress={() => onLogout()} testID='create_checkout'>
            Logout
          </Button>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  form: {
    width: '90%',
    margin: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,

    borderColor: 'gray',
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
})
