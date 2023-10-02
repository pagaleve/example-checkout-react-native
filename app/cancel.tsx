import {FontAwesome} from '@expo/vector-icons'
import {router} from 'expo-router'
import {StyleSheet} from 'react-native'

import {Button} from '../components/Button'
import {Text, View} from '../components/Themed'

export type CheckoutScreenParams = {checkoutUrl: string}

export default function CancelScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Failed</Text>
      <View style={styles.iconView}>
        <FontAwesome color='white' name='times' size={248} />
      </View>
      <View style={{flexDirection: 'row', backgroundColor: 'transparent'}}>
        <Button backgroundColor='#FE35F1' flex={1} onPress={() => router.replace('/')}>
          Back to Home
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
    backgroundColor: '#EB3858',
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
