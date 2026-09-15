export const formatDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
