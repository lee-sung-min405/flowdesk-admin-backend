/**
 * 권한 관련 유틸리티 함수
 */
export class PermissionUtil {
  /**
   * 권한 키 생성
   * @param page 페이지 코드 (예: 'users', 'boards')
   * @param action 액션 코드 (예: 'read', 'create', 'update', 'delete')
   * @returns 권한 키 (예: 'users.read')
   */
  static buildKey(page: string, action: string): string {
    return `${page}.${action}`;
  }

  /**
   * 권한 키 파싱
   * @param key 권한 키 (예: 'users.read')
   * @returns [페이지 코드, 액션 코드]
   */
  static parseKey(key: string): [string, string] {
    const parts = key.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid permission key format: ${key}. Expected format: 'page.action'`);
    }
    return [parts[0], parts[1]];
  }

  /**
   * 권한 키 검증
   * @param key 권한 키
   * @returns 유효한 형식이면 true
   */
  static isValidKey(key: string): boolean {
    return /^[a-z0-9\-\/]+\.[a-z0-9\-]+$/i.test(key);
  }
}
