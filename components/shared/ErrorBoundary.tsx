import React, { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { fonts, spacing, radius, colors as tokenColors } from '@/constants/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oups</Text>
          <Text style={styles.body}>
            Une erreur inattendue est survenue.
          </Text>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokenColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: tokenColors['on-surface'],
    marginBottom: spacing[3],
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: tokenColors['on-surface-variant'],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {
    backgroundColor: tokenColors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: tokenColors['on-primary'],
  },
});
