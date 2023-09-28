import {useLocalSearchParams} from 'expo-router'
import WebView from 'react-native-webview'

export type CheckoutScreenParams = {checkoutUrl: string}

export default function CheckoutScreen() {
  const {checkoutUrl} = useLocalSearchParams<CheckoutScreenParams>()

  return (
    <WebView
      allowsBackForwardNavigationGestures
      startInLoadingState
      originWhitelist={['https://*']}
      source={{
        uri: checkoutUrl,
      }}
    />
  )
}
