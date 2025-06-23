// --- ctx.js ---

import React, { useState, useEffect, useContext, createContext, type PropsWithChildren } from 'react';
// 1. Importações necessárias do Supabase
import { supabase } from './services/supabase'; // Garanta que este caminho está correto
import { Session } from '@supabase/supabase-js';

// 2. O tipo do Contexto agora espera a Sessão real do Supabase ou null
const AuthContext = createContext<{
  session: Session | null;
  signOut: () => void;
  isLoading: boolean;
}>({
  session: null,
  signOut: () => {},
  isLoading: true, // Começa como true até sabermos o estado da sessão
});

// O seu hook useSession continua o mesmo.
// (Nota: `React.use` é uma API mais nova, o mais comum é usar `useContext(AuthContext)`)
export function useSession() {
  const value = useContext(AuthContext); // Usando useContext para clareza e compatibilidade
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  // 3. Jogue fora o useStorageState. Ele não é mais necessário.
  // Usamos um useState padrão para armazenar a sessão do Supabase.
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 4. O Coração da Solução: useEffect com onAuthStateChange
  useEffect(() => {
    // Tenta obter a sessão inicial quando o app carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Escuta por mudanças no estado de autenticação (LOGIN, LOGOUT, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Se a sessão mudar, garantimos que não estamos mais no estado de 'loading'
      setIsLoading(false);
    });

    // Limpa o 'ouvinte' quando o componente é desmontado para evitar vazamentos de memória
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 5. O novo valor do Contexto.
  // Note que não temos mais a função `signIn` aqui. A responsabilidade dela
  // agora é do componente de login, que chama o Supabase diretamente.
  const value = {
    session,
    isLoading,
    signOut: () => supabase.auth.signOut(), // O signOut apenas delega para o Supabase
  };

  return (
    // Sempre use o .Provider para prover o valor do contexto
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}