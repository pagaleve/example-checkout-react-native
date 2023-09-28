import {Stack} from 'expo-router'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{title: 'CartScreen'}} />
    </Stack>
  )
}
