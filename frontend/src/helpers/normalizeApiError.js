function normalizeApiError(error) {
  const body = error?.response?.data?.errors?.body;

  if (Array.isArray(body) && body.length > 0) {
    return new Error(body[0]);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Something went wrong");
}

export default normalizeApiError;
