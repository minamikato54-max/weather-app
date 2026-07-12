export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
      {message}
    </div>
  )
}
