import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { authStorage } from "@/lib/auth";

export const authQueryKey = ["auth", "me"] as const;

export const useAuth = () => {
  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: authApi.me,
    retry: false,
    enabled: Boolean(authStorage.getToken())
  });

  const user = query.data ?? null;

  return {
    ...query,
    user,
    isAuthenticated: Boolean(user),
    permissions: user?.role?.permissions?.map((permission) => permission.key) ?? []
  };
};
