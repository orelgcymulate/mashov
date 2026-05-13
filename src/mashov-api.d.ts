// Minimal types for the unofficial `mashov-api` package.
// Upstream has no published types; we declare only the surface we use.

declare module 'mashov-api' {
  export type LoginInfo = unknown;

  export function loginToMashov(
    semel: string | number,
    year: number,
    username: string,
    password: string,
  ): Promise<LoginInfo>;

  export function get(loginInfo: LoginInfo, dataType: string): Promise<any[]>;
  export function getRaw(loginInfo: LoginInfo, dataType: string): Promise<any>;
  export function getMail(loginInfo: LoginInfo, count: number): Promise<any[]>;
  export function getNotifications(loginInfo: LoginInfo, count: number): Promise<any[]>;
  export function getPicture(loginInfo: LoginInfo): Promise<Buffer>;
  export function getSchools(loginInfo: LoginInfo): Promise<any[]>;
}
