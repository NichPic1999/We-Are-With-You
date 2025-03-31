export interface PerpetratorData {
email: string,
telephoneNumber: string,
socialMediaUrl: string,
}

export interface StoreDataPerpetrator {
K_key: string,
A_key: string,
piValuesToMatchRecord: string[],
}

export interface SharedData {
user: bigint;
share: bigint;
}

export interface Record{
user:string;
perpetratorData: PerpetratorData;
details: string;
}

export interface Ccipher{
sharedData:SharedData;
CipherKeyWithK: string;
}

export interface DBTuple{
piValuePerpetrator: string;
cCipher: string;
cipherKeyWithKU: string;
eRecord: string;
}

export interface AuthResult {
token: string;
expiresIn: number;
}

export interface RetrieveReport {
piValuePerpetrator: string;
userKey: string;
}

export interface DataToOPRFOnlyEmail {
  email: string,
}

export interface DataToGetLawyerKey {
  piValue: string,
}

export interface DataToGetLawyerKeyWithUuidLawyer {
  uuidLawyer: string,
}
