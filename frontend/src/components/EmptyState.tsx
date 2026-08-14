
import { SearchX } from 'lucide-react';

export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col justify-center items-center h-64 w-full text-subdued space-y-4">
    <SearchX className="w-12 h-12" />
    <p>{message}</p>
  </div>
);
