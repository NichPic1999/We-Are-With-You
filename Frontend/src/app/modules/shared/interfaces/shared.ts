export interface LoginData {
  password: string,
  role:string
}

export interface SignUpData {
  email: string,
  password: string,
  telephoneNumber: string,
  hashEmail:string
}

export interface AuthData {
  email: string,
  emailFromDB: string,
  encRole:string,
}

export interface TokenData {
  verifyToken: string,
}

export interface PerpetratorData {
  email: string,
  telephoneNumber: string,
  socialMediaUrl: string,
}

export interface CoefficientsDataPerpetrator {
  K_key: string,
  A_key: string,
  piValuesToMatchRecord: string,
}

export interface SharedSecretData {
  user: bigint;
  share: bigint;
}

export interface Record{
  user:string;
  perpetratorData: PerpetratorData;
  details: string;
}

export interface Ccipher{
  sharedData:SharedSecretData;
  CipherKeyWithK: string;
}

export interface DBTuple{
  piValuePerpetrator: string;
  cCipher: string;
  cipherKeyWithKU: string;
  eRecord: string;
  publicKeyLawyer: string
  }

  export interface RetrieveReport {
    piValuePerpetrator: string;
    userKey: string;
  }

  export interface Report {
    UuidReport: string;
    PiValue: string;
    CipherC: string;
    ERecord: string;
  }

  export interface SharedData {
    user: bigint;
    share: bigint;
    }

