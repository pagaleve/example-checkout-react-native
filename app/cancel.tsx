import {FontAwesome} from '@expo/vector-icons'
import {router} from 'expo-router'
import {StyleSheet} from 'react-native'

import {Button} from '../components/Button'
import {Text, View} from '../components/Themed'

export type CheckoutScreenParams = {checkoutUrl: string}

export default function SuccessScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Falhou!</Text>
      <View style={styles.iconView}>
        <FontAwesome color='white' name='times' size={248} />
      </View>
      <View style={{flexDirection: 'row', backgroundColor: 'transparent'}}>
        <Button flex={1} onPress={() => router.replace('/')}>
          Tela inicial
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 64,
    backgroundColor: '#ed071a',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  iconView: {
    backgroundColor: 'transparent',
    flex: 1,
  },
})
