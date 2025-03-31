export interface Report {
  UuidReport: string;
  PiValue: string;
  CipherC: string;
  ERecord: string;
}

export interface ReportToView {
  UuidReport: string;
  User:string
  EmailPerpetrator: string;
  TelephoneNumberPerpetrator: string;
  SocialMediaURL:string
  Details: string;
}
