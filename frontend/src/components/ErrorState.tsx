
import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col justify-center items-center h-64 w-full text-subdued space-y-4">
    <AlertCircle className="w-12 h-12 text-red-500" />
    <p>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="px-4 py-2 bg-spotify-green text-bg-black font-semibold rounded hover:bg-opacity-80">
        Retry
      </button>
    )}
  </div>
);
