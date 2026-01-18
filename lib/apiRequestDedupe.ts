// API 요청 중복 방지 (같은 요청이 동시에 여러 번 발생하는 것 방지)
const pendingRequests = new Map<string, Promise<any>>();

export function dedupeRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // 이미 진행 중인 요청이 있으면 그것을 반환
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // 새로운 요청 생성
  const request = requestFn().finally(() => {
    // 요청 완료 후 pendingRequests에서 제거
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, request);
  return request;
}

