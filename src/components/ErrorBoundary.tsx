import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('App Error Boundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0f0f23',
                    color: '#e2e8f0',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                        😔 Algo deu errado
                    </h1>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '400px' }}>
                        Ocorreu um erro inesperado. Tente recarregar a página.
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Recarregar
                    </button>
                    {this.state.error && (
                        <details style={{ marginTop: '2rem', color: '#64748b', fontSize: '0.75rem', maxWidth: '500px' }}>
                            <summary style={{ cursor: 'pointer' }}>Detalhes do erro</summary>
                            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', textAlign: 'left' }}>
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
