const DEV_COOKIE_NAME = "dev";

export const isDevCookieEnabled = (): boolean => {
  return import.meta.env.DEV || !!getCookie(DEV_COOKIE_NAME);
};

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
};
