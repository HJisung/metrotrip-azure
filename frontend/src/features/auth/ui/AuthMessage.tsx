export function AuthMessage({ message, error = false }: { message: string; error?: boolean }) {
  if (!message) return null;
  return <p className={`mt-sm text-body-md ${error ? 'text-error' : 'text-primary'}`}>{message}</p>;
}
