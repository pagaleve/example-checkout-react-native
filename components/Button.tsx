import {ActivityIndicator, Pressable, PressableProps, StyleSheet, Text} from 'react-native'

export type ButtonProps = {
  loading?: boolean
  flex?: number
} & PressableProps

export const Button = ({children, loading, flex, ...props}: ButtonProps) => {
  return (
    <Pressable style={[styles.button, {flex}]} {...props}>
      {loading ? (
        <ActivityIndicator />
      ) : typeof children === 'string' ? (
        <Text style={styles.text}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'black',
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
})
