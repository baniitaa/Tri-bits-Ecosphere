export const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 100);
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
};
