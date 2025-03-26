
export const getOrInitializeUUID = () => {
  const localStorageUUID = localStorage.getItem('uuid');

  if (localStorageUUID) {
    return localStorageUUID;
  }

  const newUUID = crypto.randomUUID();
  localStorage.setItem('uuid', newUUID);

  return newUUID;
};

export const getName = () => {
  return localStorage.getItem('name') || '';
}

export const getLastRoom = () => {
  return localStorage.getItem('mostRecentRoom') || '';
}

export const removeLastRoom = () => {
  return localStorage.removeItem('mostRecentRoom');
}