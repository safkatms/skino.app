import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (!isLoading && isAuthenticated) return <Redirect href="/(app)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
