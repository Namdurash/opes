export const hashPassword = (password: string): string => {
  let hash = 2166136261;

  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, '0')}`;
};
