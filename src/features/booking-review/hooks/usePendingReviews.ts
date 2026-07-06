import { useQuery } from '@tanstack/react-query';
import { getPendingReviews } from '../api/review.api';

export function usePendingReviews() {
  return useQuery({
    queryKey: ['pending-reviews'],
    queryFn: getPendingReviews,
  });
}
