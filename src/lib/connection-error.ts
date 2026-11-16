let last: string | null = null;

export const setConnectionError = (message: string | null) => {
  last = message;
};

export const getConnectionError = () => last;
