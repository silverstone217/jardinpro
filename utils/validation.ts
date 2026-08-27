export const isValidTelephone = (telephone: string): boolean => {
  return /^0\d{9}$/.test(telephone);
};
