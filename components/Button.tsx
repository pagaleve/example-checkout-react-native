import {ActivityIndicator, Pressable, PressableProps, StyleSheet, Text} from 'react-native'

export type ButtonProps = {
  backgroundColor?: string
  color?: string
  flex?: number
  loading?: boolean
} & PressableProps

export const Button = ({
  children,
  loading,
  flex,
  backgroundColor = 'black',
  color = 'white',
  ...props
}: ButtonProps) => {
  return (
    <Pressable style={[styles.button, {flex, backgroundColor}]} {...props}>
      {loading ? (
        <ActivityIndicator />
      ) : typeof children === 'string' ? (
        <Text style={[styles.text, {color}]}>{children}</Text>
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
    fontWeight: 'bold',
  },
})
