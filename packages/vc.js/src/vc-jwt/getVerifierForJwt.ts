export const getVerifierForJwt = async (jwt: string, options: any) => {
  const [header] = jwt
    .split(".")
    .splice(0, 1)
    .map((item: string) => {
      return JSON.parse(Buffer.from(item, "base64").toString());
    });
  if (!header.kid) {
    throw new Error(
      'Transmute requires "kid" in vc-jwt headers. Otherwise key dereferencing is not always possible.'
    );
  }
  let suite = Array.isArray(options.suite) ? options.suite[0] : options.suite;

  const verificationMethod = await suite.getVerificationMethod({
    proof: {
      verificationMethod: header.kid,
    },
    documentLoader: options.documentLoader,
    instance: true, // need this to get the class instance
  });

  if (!verificationMethod || !verificationMethod.useJwa) {
    throw new Error(
      'Transmute requires "suite.getVerificationMethod" to return a key instance with member useJwa.'
    );
  }
  const k = await verificationMethod.useJwa({
    detached: false,
  });
  const verifier = k.verifier();
  return verifier;
};
