import { Loader2 } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64 w-full">
    <Loader2 className="w-8 h-8 animate-spin text-spotify-green" />
  </div>
);
